
L.A.D (Learn Autonomous Driving) es una plataforma web para cursos de robótica y conducción autónoma. Combina lecciones teóricas, actividades prácticas y evaluaciones que se enlazan con simulaciones ROS 2 ejecutadas en contenedores Docker. Con esta arquitectura, docentes y estudiantes pueden iniciar rápidamente un laboratorio de conducción autónoma sin preocuparse por instalaciones complejas.

## Inicio rápido

### Opción 1: Iniciar solo el frontend (Windows)
Haz doble clic en `start-frontend.bat` para iniciar automáticamente el servidor de desarrollo con detección de IP.

### Opción 2: Línea de comandos
```bash
npm install  # Solo la primera vez
npm start    # Inicia el servidor de desarrollo
```

El servidor automáticamente:
1. 🔍 Detectará tu IP de red local (ej: 192.168.1.100)
2. 📝 Actualizará `config/ip_config.json`
3. 🌐 Iniciará en `http://0.0.0.0:3000` (accesible desde la LAN)
4. 📡 Mostrará las URLs de acceso local y de red

**Acceso desde otros dispositivos:**
- Local: `http://localhost:3000`
- Red LAN: `http://192.168.x.x:3000` (la IP se muestra en la terminal)

> 📚 **Documentación detallada:** Ver `INSTALLATION.md` para solución de problemas y `SETUP.md` para configuración de acceso LAN.

## Idea general de la aplicación

- **Recorridos guiados por unidades y niveles.** El catálogo de aprendizaje está organizado en unidades temáticas; cada una despliega niveles con videos, slides interactivos y ejercicios prácticos que se consumen desde el navegador.
- **Inicio de sesión y progreso personalizado.** Cada estudiante ingresa con sus credenciales, obtiene un token JWT y, a partir de ahí, su progreso (evaluaciones, logros y checklists) queda sincronizado con el backend.
- **Actividades conectadas a ROS.** Los niveles incluyen widgets de simulación que se comunican con rosbridge vía WebSocket (`ws://localhost:9090` por defecto). Estos widgets pueden publicar y suscribirse a tópicos, ejecutar acciones, disparar lanzamientos (`ros2 launch`) o visualizar transformaciones con RViz Web.

## Arquitectura en alto nivel

| Capa | Detalles |
| --- | --- |
| **Frontend (este repositorio)** | Aplicación React creada con Create React App. Utiliza React Router para la navegación, Context API para autenticación y progreso, y hooks especializados (`useRoslib`, `useStableRosSub`) para interactuar con rosbridge. |
| **API REST** | Se espera un backend (por ejemplo, Django REST Framework o FastAPI) expuesto en `http://localhost:8000/api` —o el valor definido en `REACT_APP_API_BASE`— que entrega unidades, niveles y registra el progreso estudiantil. |
| **ROS + rosbridge** | Un contenedor ROS 2 independiente ejecuta `rosbridge_server` y los paquetes/simulaciones necesarios (Gazebo, turtlesim, QCar, etc.). El frontend se conecta a través de WebSockets utilizando `roslibjs`. |

## Flujo completo con Docker

1. **Backend y base de datos.** Empaqueta tu API en un contenedor, expón el puerto 8000 y monta la base de datos que prefieras (PostgreSQL, SQLite, etc.). Si empleas una base de datos en otro contenedor (por ejemplo PostgreSQL), enlázala mediante la misma red de Docker y comparte las credenciales vía variables de entorno (`DATABASE_URL`, `POSTGRES_PASSWORD`, etc.).
2. **ROS 2 + rosbridge.** Ejecuta rosbridge dentro de otro contenedor. Puede reutilizar el workspace del laboratorio montando volúmenes para los paquetes personalizados. Ejemplo rápido:
   ```bash
   docker run --rm -it \
     -p 9090:9090 \
     -v $(pwd)/ros2_ws:/root/ros2_ws \
     osrf/ros:humble-desktop \
     ros2 launch rosbridge_server rosbridge_websocket_launch.xml
   ```
3. **Frontend (este proyecto).** Construye la imagen del frontend o levántalo en modo desarrollo apuntando a las URLs anteriores. Una vez autenticado, el navegador se encargará de hablar con el backend y con rosbridge simultáneamente.

> 💡 **Consejo:** Si levantas todo con `docker-compose`, define una red compartida (por ejemplo, `lad_net`) y usa nombres de servicio (`api`, `rosbridge`, `frontend`) para que cada contenedor resuelva a los otros sin hardcodear IPs.

## Requisitos previos

- Node.js ≥ 18 y npm.
- Docker Engine o Docker Desktop para levantar los contenedores de backend y ROS.
- Acceso a un backend compatible con los endpoints utilizados por la aplicación (`/api/token/`, `/api/units/`, `/api/levels/progress/me/`).

## Variables de entorno

Configura las siguientes variables antes de construir o iniciar el frontend:

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `REACT_APP_API_BASE` | URL base del backend REST. | `http://localhost:8000/api` |
| `REACT_APP_ROSBRIDGE_URL` | URL WebSocket hacia rosbridge. | `ws://localhost:9090` |

Las variables se leen en tiempo de construcción, por lo que es recomendable definirlas en un archivo `.env` o inyectarlas en el contenedor de build.

## Puesta en marcha del frontend

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```
   El sitio quedará disponible en `http://localhost:3000` y se recargará automáticamente al modificar código.
3. Construye para producción (opcional):
   ```bash
   npm run build
   ```
   El resultado quedará en la carpeta `build/`, listo para servir desde un servidor estático o empaquetar dentro de una imagen Docker.

## Estructura principal del código

```
src/
├─ pages/           # Home, Learn, UnitPage y pantallas de niveles.
├─ levels/          # Definiciones de cada nivel (slides, desafíos ROS, etc.).
├─ components/      # UI reutilizable y widgets de ROS.
├─ context/         # Contextos para autenticación y progreso.
├─ hooks/           # Hooks personalizados, incluido el puente con rosbridge.
└─ config.js        # Configuración centralizada de URLs.
```

## Orquestación con docker-compose (ejemplo)

Este archivo básico levanta los tres servicios en la misma red y demuestra cómo se conectan entre sí:

```yaml
services:
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=lad
      - POSTGRES_USER=lad_user
      - POSTGRES_PASSWORD=lad_pass
    volumes:
      - lad_pgdata:/var/lib/postgresql/data

  api:
    image: lad/api:latest
    ports:
      - "8000:8000"
    environment:
      - DJANGO_SECRET_KEY=changeme
      - DATABASE_URL=postgres://lad_user:lad_pass@db:5432/lad
    depends_on:
      - db

  rosbridge:
    image: osrf/ros:humble-desktop
    command: ros2 launch rosbridge_server rosbridge_websocket_launch.xml
    ports:
      - "9090:9090"

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_BASE=http://api:8000/api
      - REACT_APP_ROSBRIDGE_URL=ws://rosbridge:9090
    depends_on:
      - api
      - rosbridge

volumes:
  lad_pgdata:
    driver: local
```

### Persistencia y backups de la base de datos

- **Volúmenes nombrados.** El volumen `lad_pgdata` mantiene los datos aunque se eliminen los contenedores. Puedes cambiarlo por un volumen bind (`./data/db:/var/lib/postgresql/data`) si prefieres inspeccionar los archivos en tu máquina.
- **Respaldos rápidos.** Ejecuta `docker compose exec db pg_dump -U lad_user lad > backup.sql` para generar un respaldo en tu host. Restaura con `cat backup.sql | docker compose exec -T db psql -U lad_user lad`.
- **Migraciones.** Tras actualizar el modelo de datos del backend, corre las migraciones dentro del contenedor: `docker compose exec api python manage.py migrate` (ajusta al framework que utilices).

## Tutorial: agregar unidades, niveles y misiones desde `localhost:8000/admin`

Si utilizas el backend de referencia en Django, la forma más rápida de gestionar contenidos es mediante el panel administrativo. A continuación se describe el flujo completo sin usar la línea de comandos.

1. **Inicia sesión en el panel.**
   - Abre `http://localhost:8000/admin` y autentícate con una cuenta de personal. Asegúrate de que el contenedor `api` esté corriendo y pueda conectarse a la base de datos del `docker-compose`.

     ![Pantalla de inicio de sesión del panel administrativo](images/admin/login.png)

2. **Revisa el módulo de aprendizaje.**
   - Una vez dentro, la sección **Learning** agrupa Unidades, Niveles, Objetivos y el progreso de los usuarios.
   - Desde este tablero puedes navegar rápidamente a los modelos que necesitas crear o editar.

     ![Panel principal de Django admin mostrando los modelos de Learning](images/admin/dashboard.png)

3. **Crea una unidad.**
   - Haz clic en **Units → Add** y completa los campos `slug`, `title` y `order`. Activa la casilla **is active** para que la unidad sea visible al público.
   - Puedes preparar la jerarquía desde aquí añadiendo niveles con el botón **Add another Level** o guardando la unidad y agregándolos después.

     ![Formulario para crear una unidad](images/admin/add-unit.png)

4. **Agrega niveles dentro de la unidad.**
   - Ingresa a **Levels → Add**. Selecciona la unidad recién creada, define el título, el orden de aparición y marca si el nivel está activo.
   - En la sección **Objectives** puedes sumar objetivos/misiones relacionados con este nivel.

     ![Formulario para crear un nivel con objetivos asociados](images/admin/add-level.png)

5. **Define las misiones u objetivos.**
   - Desde el formulario de nivel, pulsa **Add another Objective** para abrir la pantalla de creación. Completa el código interno, la descripción y los puntos que otorga.

     ![Formulario para crear un objetivo o misión](images/admin/add-objective.png)

   - Después de crear algunos objetivos, podrás verlos y filtrarlos desde **Objectives → Change** para reutilizarlos o editar su puntuación.

     ![Listado de objetivos disponibles con filtros por nivel](images/admin/objectives-list.png)

6. **Ordena y revisa el catálogo.**
   - En la vista de niveles puedes verificar qué elementos están activos, a qué unidad pertenecen y su orden. Ajusta estos valores para controlar la progresión que verá el estudiantado.

     ![Listado de niveles con su unidad, orden y estado](images/admin/levels-list.png)

7. **Valida en el frontend.**
   - Actualiza el frontend (`npm start`) y navega a la sección de aprendizaje. Las unidades, niveles y misiones activas deberían aparecer automáticamente gracias a la integración con la API.

> 📦 **Tip:** Si necesitas cargar muchas unidades de golpe, puedes preparar un archivo `fixtures.json` y usar `python manage.py loaddata` dentro del contenedor `api`. Aun así, el panel administrativo sigue siendo ideal para ajustes rápidos o revisiones durante el día a día.

## Cómo asegurar que todas las carpetas lleguen a GitHub

Si al revisar tu repositorio remoto notas que faltan carpetas como `lad/` o `images/`, sigue estos pasos:

1. **Verifica el estado local.** Ejecuta `git status` y confirma que los archivos aparecen como *untracked* o *modified*. Si no figuran, revisa si estás dentro de la carpeta correcta.
2. **Revisa `.gitignore`.** Asegúrate de que la configuración no esté filtrando tus carpetas. Si necesitas incluir un directorio ignorado, agrega una excepción con `!nombre-carpeta/`.
3. **Evita repositorios anidados.** Si tu carpeta (por ejemplo `lad/`) contiene otra carpeta `.git`, Git la tratará como un repositorio independiente y no la subirá. Elimínala o conviértela en un submódulo intencional (`git submodule add <url> lad`).
4. **Fuerza el seguimiento de directorios vacíos.** Git no guarda carpetas sin archivos. Si necesitas que existan en el remoto, agrega un archivo de marcador (por ejemplo `README.md` o `.gitkeep`).
5. **Confirma y publica.** Agrega los cambios (`git add images lad`), crea un commit y haz `git push`.

En el directorio [`lad/`](lad/README.md) encontrarás recomendaciones adicionales para versionar el backend junto al frontend.

## Próximos pasos sugeridos

- Añadir más escenarios ROS (Turtlesim, RViz, QCar, etc.) y documentarlos en los niveles correspondientes.
- Integrar herramientas de evaluación automática conectadas a tópicos ROS para medir desempeño.
- Publicar imágenes Docker oficiales o scripts de bootstrap para simplificar la instalación en laboratorios.

Con esta guía puedes desplegar la plataforma rápidamente y comenzar a enseñar/experimentar con conducción autónoma respaldada por ROS y Docker.