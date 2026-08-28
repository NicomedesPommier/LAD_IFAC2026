# L.A.D (Learn Autonomous Driving)

<div align="center">

**An interactive web platform for teaching robotics and autonomous driving**

*Combining theoretical lessons, hands-on practice, and real-time ROS 2 simulations in a single browser-based learning environment*

[Quick Start](#-quick-start) • [Features](#-features) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Troubleshooting](#-troubleshooting)

</div>

---

## 📖 What is L.A.D?

L.A.D (Learn Autonomous Driving) is an **educational platform** designed for robotics and autonomous driving courses. It brings together three integrated components:

1. **React Frontend** - Interactive web interface where students access learning units, levels, and ROS widgets
2. **Django REST Backend** - Manages authentication, content catalog, and individual student progress
3. **ROS 2 Simulators** - Real robotics simulations accessible directly from the browser via rosbridge WebSocket

### Why L.A.D?

- **No complex installations** - Students access everything through a web browser
-  **Hands-on learning** - Real ROS 2 simulations integrated with lessons
-  **Progress tracking** - Individual student monitoring and assessment
-  **Scalable** - Deploy on a single machine and serve multiple students over LAN
-  **Modular** - Easy to add new levels, missions, and ROS scenarios

### Who is it for?

-  **Educators** teaching robotics, autonomous driving, or ROS courses
-  **Students** learning robotics without complex setup requirements
-  **Institutions** looking to deploy robotics labs quickly
-  **Researchers** prototyping interactive robotics demonstrations

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x and npm >= 9.x
- **Python** 3.10–3.13 (Django 5.1 supported range)
  - **Linux only:** Also install `python3-venv` package (see Installation section)
- **Docker** >= 24.x (for ROS 2 simulations)
- **Git**

### Installation

L.A.D includes automated installers that handle all setup steps for you!

**Windows Installation**
```cmd
# Clone the repository
git clone <repository-url>
cd L.A.D

# Run the installer (double-click or run from command line)
installer.bat
```

**Linux/Mac Installation**
```bash
# Clone the repository
git clone <repository-url>
cd L.A.D

# Linux only: Install python3-venv first
# Ubuntu/Debian:
sudo apt-get update && sudo apt-get install python3-venv

# Fedora/RHEL:
sudo dnf install python3-virtualenv

# Arch Linux:
sudo pacman -S python-virtualenv

# Make installer executable and run
chmod +x installer.sh
./installer.sh
```

**What the installer does:**
-  Checks all prerequisites (Python, Node.js, Docker)
-  Creates Python virtual environment
-  Installs all backend dependencies from `requirements.txt`
-  Runs database migrations
-  Loads sample content (Units, Levels, Objectives)
-  Creates admin superuser account
-  Installs all frontend npm packages
-  Builds ROS 2 Docker images

### Starting the Platform

After installation, start all services with one command:

**Windows**
```cmd
scripts\start-all.bat
```

**Linux/Mac**
```bash
./scripts/start-all.sh
```

This will:
- Auto-detect your network IP
- Update all configurations
- Start Django backend (port 8000)
- Start ROS 2 Docker (ports 9090, 7000)
- Start React frontend (port 3000)

### Manual Installation (Advanced)

If you prefer manual control or the installer fails:

 **Clone the repository**
```bash
git clone <repository-url>
cd L.A.D
```

 **Install Backend**
```bash
cd LAD/lad
python -m venv ../.venv
source ../.venv/bin/activate  # On Windows: ..\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py load_curriculum
python manage.py createsuperuser
```

 **Install Frontend**
```bash
cd AVEDU/avedu
npm install
```

 **Build ROS Docker**
```bash
cd qcar_docker
docker compose build
```

 **Start all services** (use scripts/start-all.bat or start-all.sh)

### First Steps After Installation

1. **Access the application**: Open `http://localhost:3000`
2. **Login**: Use the superuser credentials you created during installation
3. **Explore content**: Sample units and levels are already loaded
4. **Django admin**: Visit `http://localhost:8000/admin` to manage content
5. **Test ROS**: Navigate to ROS levels to verify simulation connectivity

---

##  Features

### For Students
-  **Structured Learning Path** - Organized units and levels with progressive difficulty
-  **Interactive Simulations** - Real-time ROS 2 robot control from the browser
-  **Progress Tracking** - See your achievements and completed objectives
-  **Hands-on Missions** - Practical exercises that validate learning through ROS topics
-  **Multi-device Access** - Learn from any device on the network

### For Educators
-  **Content Management** - Easy-to-use admin panel for creating units and levels
-  **Student Monitoring** - Track individual and class progress
-  **Customizable Missions** - Define objectives tied to ROS topics and services
-  **Flexible Content** - Add videos, slides, and interactive widgets
-  **Assessment Tools** - Automatic evaluation based on ROS simulation performance

### Technical Features
-  **Real-time ROS Integration** - WebSocket connection to rosbridge for live robot interaction
-  **JWT Authentication** - Secure user sessions with token-based auth
-  **LAN Deployment** - Automatic IP detection for network-wide access
-  **Dockerized ROS** - Pre-configured ROS 2 Humble environment
-  **Modular Architecture** - Easy to extend with new levels and simulations

---

##  Architecture

### System Overview



### Data Flow

1. **Authentication**: Student logs in → Frontend requests JWT from Django → Token stored in localStorage
2. **Content Loading**: Frontend fetches units/levels from Django API → Displays course structure
3. **ROS Interaction**: Student interacts with ROS widget → WebSocket publishes/subscribes to topics via rosbridge
4. **Progress Tracking**: ROS objective achieved → Frontend notifies Django → Progress saved to database

### Component Details

#### Frontend (React)
- **Location**: `AVEDU/avedu/`
- **Tech Stack**: React 19, React Router 7, Three.js, Blockly, ROSLIB.js
- **Key Features**:
  - JWT authentication via Context API
  - Real-time ROS WebSocket connection with auto-reconnect
  - 3D robot visualization with URDF loader
  - Visual programming with Blockly
  - Responsive design for multi-device access

#### Backend (Django)
- **Location**: `LAD/lad/`
- **Tech Stack**: Django 4+, Django REST Framework, SimpleJWT
- **Database Models**:
  - `Unit` - Course modules (e.g., "Introduction to ROS")
  - `Level` - Individual lessons within units
  - `Objective` - Specific goals to achieve (tied to ROS topics)
  - `UserProgress` - Student completion tracking
  - `ObjectiveProgress` - Individual objective achievements

#### ROS 2 Docker
- **Location**: `qcar_docker/`
- **Tech Stack**: ROS 2 Humble, rosbridge_server, QCar packages
- **Services**:
  - Port 9090: rosbridge WebSocket
  - Port 7000: Static URDF/mesh server
  - Port 8080: web_video_server (optional)

---

##  How It Works

### Learning Flow

1. **Student Login**
   - Navigate to the platform
   - Authenticate with credentials
   - JWT token issued for session

2. **Browse Course Content**
   - View available units (course modules)
   - Select a level (individual lesson)
   - See objectives to complete

3. **Interactive Learning**
   - Read theory content
   - Watch instructional videos
   - Interact with ROS simulations
   - Complete practical missions

4. **ROS Integration**
   - Widgets connect to rosbridge via WebSocket
   - Publish commands to robot (velocity, position, etc.)
   - Subscribe to sensor data (odometry, laser scans, etc.)
   - Call ROS services for complex actions

5. **Progress Validation**
   - Objectives monitored in real-time
   - Achievement detected via ROS topic validation
   - Progress automatically saved to backend
   - Move to next level when complete

### Example: Turtlesim Level

```javascript
// Student sees a Turtlesim widget in the browser
// Widget code (simplified):

const { ros, connected } = useRoslib();  // Connect to rosbridge

// Publish velocity commands
const moveForward = () => {
  const cmdVel = new ROSLIB.Topic({
    ros, name: '/turtle1/cmd_vel', messageType: 'geometry_msgs/Twist'
  });
  cmdVel.publish({ linear: { x: 2.0 }, angular: { z: 0 } });
};

// Subscribe to position
useEffect(() => {
  const pose = new ROSLIB.Topic({
    ros, name: '/turtle1/pose', messageType: 'turtlesim/Pose'
  });
  pose.subscribe((msg) => {
    console.log(`Turtle at: x=${msg.x}, y=${msg.y}`);
    // Check if objective reached (e.g., x > 9)
    if (msg.x > 9) {
      completeObjective('REACH_RIGHT_EDGE');
    }
  });
}, [ros]);
```

---

## 📦 Repository Structure

```
L.A.D/
├── AVEDU/avedu/              # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── blocks/       # Blockly/URDF visual editors
│   │   │   └── tsim/         # Turtlesim interface
│   │   ├── context/          # React Context (Auth, Progress)
│   │   ├── hooks/            # Custom hooks (useRoslib, etc.)
│   │   ├── levels/           # Level-specific components
│   │   ├── pages/            # Route pages (Home, Learn, etc.)
│   │   ├── App.js            # Main routing
│   │   └── config.js         # API/ROS URL configuration
│   ├── scripts/
│   │   └── detect-ip.js      # Auto IP detection
│   ├── package.json
│   ├── INSTALLATION.md       # Detailed setup guide
│   └── SETUP.md              # LAN access configuration
│
├── LAD/lad/                  # Django Backend
│   ├── apps/learning/        # Main learning app
│   │   ├── models.py         # Database models
│   │   ├── views.py          # API endpoints
│   │   ├── serializers.py    # JSON serialization
│   │   └── admin.py          # Admin panel config
│   ├── core/                 # Project settings
│   │   ├── settings.py       # Django configuration
│   │   ├── urls.py           # URL routing
│   │   └── ip_config.py      # Network config loader
│   ├── fixtures/             # Database fixtures
│   │   └── initial_data.json # Sample units, levels, objectives
│   ├── manage.py
│   └── requirements.txt      # Python dependencies
│
├── qcar_docker/              # ROS 2 Docker Environment
│   ├── qcar/rosws/src/       # ROS packages
│   │   ├── qcar_description/ # Robot URDF
│   │   └── qcar_bringup/     # Launch files
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── entrypoint.sh         # Startup script
│   └── README.md
│
├── config/
│   └── ip_config.json        # Centralized network IP config
│
├── scripts/                  # Utility scripts
│   ├── start-all.bat/.sh     # Start all services
│   ├── stop-all.bat/.sh      # Stop all services
│   └── set-ip.js             # Manual IP configuration
│
├── installer.bat             # Windows automated installer
├── installer.sh              # Linux/Mac automated installer
├── CLAUDE.md                 # AI assistant context guide
└── README.md                 # This file
```

---

## 🔧 Configuration

### Network Configuration

All services read from `config/ip_config.json`. **This file is gitignored** (it
holds your real LAN/robot addresses) — create it from the template on a fresh
clone:

```bash
cp config/ip_config.example.json config/ip_config.json
```

```json
{
  "exposed_ip": "<your_ip>",
  "qcar_ip": "<qcar_ip>"
}
```

Sin este archivo la app arranca con `127.0.0.1` (segura pero solo local).
También puedes usar variables de entorno `EXPOSED_IP` / `QCAR_IP`, que tienen
prioridad sobre el JSON.

**Automatic IP Detection (Recommended)**
```bash
cd AVEDU/avedu
npm start  # Automatically detects and updates IP
```

**Manual IP Configuration**
```bash
node scripts/set-ip.js <your ip>
```

### Environment Variables

#### Frontend (`AVEDU/avedu/.env` or `.env.local`)
| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_BASE` | Backend API URL | `/api` |
| `REACT_APP_ROS_WS` | ROS bridge WebSocket URL | Auto-derived from IP config |
| `HOST` | Dev server bind address | `0.0.0.0` |
| `DANGEROUSLY_DISABLE_HOST_CHECK` | Allow LAN connections | `true` (dev only) |

#### Backend (`LAD/lad/core/settings.py`)
- `DJANGO_SECRET_KEY` - Secret key for Django (change in production)
- `DATABASE_URL` - Database connection string
- `CORS_ALLOWED_ORIGINS` - Allowed frontend origins (auto-configured from IP)
- `CSRF_TRUSTED_ORIGINS` - Trusted origins for CSRF protection

#### ROS Docker (`qcar_docker/docker-compose.yml`)
| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ALLOW_ORIGIN` | Allowed WebSocket origins | `http://localhost:3000` |
| `ENABLE_JSP` | Enable joint_state_publisher | `1` |
| `ENABLE_ROSAPI` | Enable rosapi service | `1` |
| `ENABLE_WVS` | Enable web_video_server | `0` |
| `ENABLE_TURTLESIM` | Launch turtlesim for testing | `1` |

---

## 📚 Documentation

### For Getting Started
- **[INSTALLATION.md](AVEDU/avedu/INSTALLATION.md)** - Complete installation guide with troubleshooting

### For Educators
- **Django Admin Panel** (`http://localhost:8000/admin`) - Create and manage educational content
  - Add Units (course modules)
  - Create Levels (individual lessons)
  - Define Objectives (learning goals tied to ROS topics)
  - Monitor student progress

---

## 🎯 Creating Educational Content

### Adding a New Unit and Level

1. **Access the Admin Panel**
   ```
   http://localhost:8000/admin
   ```

2. **Create a Unit**
   - Navigate to **Learning → Units → Add Unit**
   - Fill in: slug, title, order, is_active
   - Save

3. **Create a Level**
   - Navigate to **Learning → Levels → Add Level**
   - Select the parent unit
   - Fill in: slug, title, order, is_active
   - Add objectives (optional)
   - Save

4. **Define Objectives**
   - Each objective has a unique code
   - Linked to ROS topics for automatic validation
   - Points awarded when completed

5. **Create Frontend Component**
   ```javascript
   // src/levels/my-unit/my-level.jsx
   import { useRoslib } from '../../hooks/useRoslib';

   export default function MyLevel() {
     const { ros, connected } = useRoslib();

     // Your level content and ROS widgets here

     return (
       <div>
         <h1>My Custom Level</h1>
         {/* Add your widgets, instructions, etc. */}
       </div>
     );
   }
   ```

6. **Test**
   - Refresh the frontend
   - Navigate to your unit/level
   - Verify ROS connection and objectives

---

## 🛠️ Troubleshooting

### Frontend Issues

**npm start fails with "Invalid options object"**
```bash
# Solution: Install react-app-rewired
npm install
npm start
```

**Can't access from other devices on the network**
- Check firewall allows port 3000
- Ensure devices are on same WiFi network
- Verify IP with `ipconfig` (Windows) or `ifconfig` (Linux)
- Windows firewall: `netsh advfirewall firewall add rule name="React Dev Server" dir=in action=allow protocol=TCP localport=3000`

**Wrong IP detected**
```bash
node scripts/set-ip.js YOUR_CORRECT_IP
npm start
```

### Backend Issues

**CORS errors in browser console**
- Check `config/ip_config.json` has correct IP
- Verify `CORS_ALLOWED_ORIGINS` in Django settings
- Restart Django server

**Can't login / 401 Unauthorized**
- Ensure superuser was created: `python manage.py createsuperuser`
- Check Django is running on port 8000
- Verify API endpoint in browser: `http://localhost:8000/api/units/`

### ROS Issues

**ROS widgets don't connect**
- Verify rosbridge is running: `docker compose ps`
- Check WebSocket URL in browser DevTools Network tab
- Ensure port 9090 is accessible
- Test with: `ros2 topic list` (should show topics)

**ROS topics not appearing**
- Check ROS_DOMAIN_ID matches between containers
- Verify turtlesim or QCar simulation is running
- Check rosbridge logs: `docker compose logs ros`

### General Issues

| Problem | Solution |
|---------|----------|
| Services won't start | Check ports 3000, 8000, 9090 aren't in use |
| Changes not reflected | Clear browser cache, restart dev server |
| Database errors | Run migrations: `python manage.py migrate` |
| Docker build fails | Ensure Docker daemon is running, check logs |

---

##  LAN Deployment

### Quick LAN Setup

1. **Start all services** using automatic IP detection:
   ```bash
   # Windows
   scripts\start-all.bat

   # Linux/Mac
   ./scripts/start-all.sh
   ```

2. **Access from other devices**:
   - Note the IP shown in terminal (e.g., `< ip>`)
   - On another device, navigate to: `http://<server ip>:3000`



### Network Architecture

```
Host Computer (192.168.0.10)          ← ejemplo; usa tu IP LAN real
├── Frontend :3000  → Accessible from any device on LAN
├── Backend :8000   → API endpoints
└── ROS Docker :9090 → rosbridge WebSocket

Student Device 1 (192.168.0.11) → http://192.168.0.10:3000
Student Device 2 (192.168.0.12) → http://192.168.0.10:3000
Student Device 3 (192.168.0.13) → http://192.168.0.10:3000
```

---

## ☸️ Kubernetes Deployment

For production or multi-user deployments, L.A.D. can be deployed to a Kubernetes cluster.

### Prerequisites

- **kubectl** configured with cluster access
- **Docker Hub account** (or other container registry)
- **Kubernetes cluster** with nginx ingress controller

### Building and Pushing Docker Images

**Backend:**
```bash
cd LAD
docker build -t YOUR_DOCKERHUB_USERNAME/lad-backend:latest .
docker push YOUR_DOCKERHUB_USERNAME/lad-backend:latest
```

**Frontend** (with K8s ingress paths):
```bash
cd AVEDU
docker build \
  --build-arg PUBLIC_URL=/lad \
  --build-arg REACT_APP_API_BASE=/lad/api \
  -t YOUR_DOCKERHUB_USERNAME/lad-frontend:latest \
  .
docker push YOUR_DOCKERHUB_USERNAME/lad-frontend:latest
```

**ROS** (takes longer ~15-30 min):
```bash
cd qcar_docker
docker build -t YOUR_DOCKERHUB_USERNAME/lad-ros:latest .
docker push YOUR_DOCKERHUB_USERNAME/lad-ros:latest
```

### Deploying to Kubernetes

```bash
# Apply K8s manifests
kubectl apply -f k8s/

# Check pod status
kubectl get pods -n lad

# Watch pods start
kubectl get pods -n lad -w
```

### Managing Pods

**Restart deployments** (to pull new images):
```bash
kubectl rollout restart deployment/lad-frontend -n lad
kubectl rollout restart deployment/lad-backend -n lad
kubectl rollout restart deployment/lad-ros -n lad
```

**View logs:**
```bash
# Backend logs
kubectl logs -n lad deployment/lad-backend --tail=100

# Follow logs in real-time
kubectl logs -n lad deployment/lad-backend -f

# Frontend logs
kubectl logs -n lad deployment/lad-frontend -f
```

**Shell into a pod:**
```bash
kubectl exec -it -n lad deployment/lad-backend -- /bin/bash
```

**Run Django commands:**
```bash
# Load fixtures
kubectl exec -n lad deployment/lad-backend -- python manage.py loaddata fixtures/curriculum_data.json

# Create superuser
kubectl exec -it -n lad deployment/lad-backend -- python manage.py createsuperuser

# Run migrations
kubectl exec -n lad deployment/lad-backend -- python manage.py migrate
```

### Volume Issues

If pods get stuck in `ContainerCreating` with volume errors:
```bash
# Scale down to release volumes
kubectl scale deployment/lad-backend -n lad --replicas=0

# Wait, then scale back up
kubectl scale deployment/lad-backend -n lad --replicas=1
```

### Environment Variables

The backend entrypoint automatically:
- Runs migrations
- Collects static files
- Loads fixtures if database is empty

Configure fixture file via environment variable:
```yaml
env:
  - name: FIXTURE_FILE
    value: "fixtures/curriculum_data.json"  # Default
```

### Ingress Configuration

The application is accessible at `/lad/` path:
- Frontend: `http://your-cluster/lad/`
- API: `http://your-cluster/lad/api/`
- Admin: `http://your-cluster/lad/admin/`
- ROSBridge: `ws://your-cluster/lad/rosbridge`
- ROS Static: `http://your-cluster/lad/ros-static/`

---

## 🧪 Development

### Running Tests

**Frontend**
```bash
cd AVEDU/avedu
npm test
```

**Backend**
```bash
cd LAD/lad
python manage.py test apps.learning
```

### Development Workflow

1. **Make changes** to code
2. **Frontend**: Auto-reloads in browser
3. **Backend**: Restart Django server if needed
4. **ROS**: Rebuild Docker image if packages changed

### Adding New Dependencies

**Frontend**
```bash
cd AVEDU/avedu
npm install <package-name>
```

**Backend**
```bash
cd LAD/lad
pip install <package-name>
pip freeze > requirements.txt
```

**ROS Docker**
- Edit `qcar_docker/Dockerfile`
- Rebuild: `docker compose build`

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation
- Test on multiple devices (desktop, mobile, tablet)
- Ensure ROS integration works correctly

---

## 📄 License

---


##  Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review the troubleshooting section

---

<div align="center">



[⬆ Back to Top](#lad-learn-autonomous-driving)

</div>
