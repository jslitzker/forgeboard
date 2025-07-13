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
python app.py
```

## ForgeBoard Configuration

This app is configured to work with ForgeBoard:
- Port: {{ cookiecutter.port }}
- Domain: {{ cookiecutter.domain }}
- Entry point: app.py

## API Endpoints

- `GET /` - Main endpoint
- `GET /health` - Health check
- `GET /api/info` - Application information

## Author

{{ cookiecutter.author_name }} ({{ cookiecutter.author_email }})