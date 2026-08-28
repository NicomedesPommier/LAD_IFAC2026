# L.A.D Platform - Django Backend

Learning Autonomous Driving (L.A.D) Platform backend built with Django and Django REST Framework.

## Features

- RESTful API for autonomous vehicle learning platform
- JWT authentication
- Curriculum management (Units, Levels, Objectives)
- Workspace management
- CORS support for frontend integration
- SQLite database (production-ready for PostgreSQL)

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd lad-platform/L.A.D/LAD/lad
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Environment Configuration

Create a `.env` file from the example:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit `.env` and set your configuration:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
```

**Generate a new SECRET_KEY:**

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 5. Network Configuration (Optional)

If you need to configure network settings for frontend/ROS integration:

```bash
# Windows
copy ..\..\config\ip_config.example.json ..\..\config\ip_config.json

# Linux/Mac
cp ../../config/ip_config.example.json ../../config/ip_config.json
```

Edit `config/ip_config.json` with your network settings:

```json
{
  "exposed_ip": "192.168.1.100"
}
```

### 6. Database Setup

Run migrations to create the database:

```bash
python manage.py migrate
```

### 7. Load Initial Data

Load the curriculum data (units, levels, objectives):

```bash
python manage.py load_curriculum
```

**Options:**
- `--clear`: Clear existing data before loading
- `--fixture`: Specify a different fixture file

```bash
# Clear and reload data
python manage.py load_curriculum --clear

# Load from different fixture
python manage.py load_curriculum --fixture fixtures/initial_data.json
```

### 8. Create Superuser (Optional)

Create an admin account for Django admin panel:

```bash
python manage.py createsuperuser
```

### 9. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

To run on a specific host/port:

```bash
python manage.py runserver 0.0.0.0:8000
```

## Project Structure

```
lad/
├── apps/
│   ├── learning/           # Learning curriculum app
│   │   ├── models.py       # Unit, Level, Objective models
│   │   ├── views.py        # API views
│   │   ├── serializers.py  # DRF serializers
│   │   └── management/
│   │       └── commands/
│   │           └── load_curriculum.py  # Custom management command
│   └── workspace/          # Workspace app
├── core/
│   ├── settings.py         # Django settings
│   ├── urls.py            # URL routing
│   └── ip_config.py       # Network configuration utility
├── fixtures/
│   ├── curriculum_data.json    # Main curriculum fixture
│   └── initial_data.json       # Initial/legacy data
├── manage.py
└── requirements.txt
```

## API Endpoints

### Authentication
- `POST /api/token/` - Obtain JWT token
- `POST /api/token/refresh/` - Refresh JWT token

### Learning Curriculum
- `GET /api/learning/units/` - List all units
- `GET /api/learning/units/{id}/` - Get unit details
- `GET /api/learning/levels/` - List all levels
- `GET /api/learning/levels/{id}/` - Get level details
- `GET /api/learning/objectives/` - List all objectives

### Admin Panel
- `http://localhost:8000/admin/` - Django admin interface

## Available Management Commands

### Load Curriculum Data

```bash
python manage.py load_curriculum [--clear] [--fixture FIXTURE_PATH]
```

Loads curriculum data from JSON fixtures into the database.

### Standard Django Commands

```bash
python manage.py makemigrations    # Create new migrations
python manage.py migrate           # Apply migrations
python manage.py createsuperuser   # Create admin user
python manage.py collectstatic     # Collect static files
python manage.py shell            # Django shell
```

## Database

### SQLite (Default)

The project uses SQLite by default for development. The database file `db.sqlite3` is created automatically.

### PostgreSQL (Production)

For production, configure PostgreSQL in your `.env`:

```env
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=lad_db
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

Install the PostgreSQL adapter:

```bash
pip install psycopg2-binary
```

## Fixtures

The project includes pre-configured curriculum data:

### curriculum_data.json (Main)
Contains the complete curriculum structure:
- 12 Units (Introduction, Vehicle Dynamics, ROS 2 Concepts, Sensing, etc.)
- 40+ Levels organized by units
- Learning objectives with points

### initial_data.json (Legacy)
Contains initial test data for development.

## CORS Configuration

CORS is configured to allow requests from:
- `http://localhost:3000` (default frontend)
- Frontend origin from `ip_config.json`

Update `core/settings.py` to add more allowed origins.

## Troubleshooting

### Import Error: No module named 'apps'

Make sure you're in the correct directory (`LAD/lad/`) and virtual environment is activated.

### Database Locked Error

Close any database browser tools and try again. SQLite doesn't handle concurrent writes well.

### CORS Errors

Check that your frontend URL is in `CORS_ALLOWED_ORIGINS` in `settings.py`.

### Fixture Loading Fails

```bash
# Clear existing data and reload
python manage.py load_curriculum --clear
```

## Development

### Running Tests

```bash
# Install test dependencies first
pip install pytest pytest-cov

# Run tests
pytest
```

### Code Style

Follow PEP 8 Python style guidelines.

## Production Deployment

1. Set `DEBUG=False` in `.env`
2. Generate a strong `SECRET_KEY`
3. Configure PostgreSQL database
4. Set up proper `ALLOWED_HOSTS`
5. Configure static file serving
6. Use a production server (Gunicorn, uWSGI)
7. Set up HTTPS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.
