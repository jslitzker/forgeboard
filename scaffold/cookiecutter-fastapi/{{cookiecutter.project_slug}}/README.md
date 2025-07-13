# {{ cookiecutter.project_name }}

{{ cookiecutter.project_description }}

## Setup

1. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Run the application:
```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port {{ cookiecutter.port }}
```

## ForgeBoard Configuration

This app is configured to work with ForgeBoard:
- Port: {{ cookiecutter.port }}
- Domain: {{ cookiecutter.domain }}
- Entry point: main.py

## API Documentation

FastAPI automatically generates interactive API documentation:
- Swagger UI: http://localhost:{{ cookiecutter.port }}/docs
- ReDoc: http://localhost:{{ cookiecutter.port }}/redoc

## API Endpoints

- `GET /` - Main endpoint
- `GET /health` - Health check
- `GET /api/info` - Application information

## Author

{{ cookiecutter.author_name }} ({{ cookiecutter.author_email }})