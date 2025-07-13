#!/usr/bin/env python3
"""
{{ cookiecutter.project_name }}
{{ cookiecutter.project_description }}

Author: {{ cookiecutter.author_name }}
Email: {{ cookiecutter.author_email }}
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os

# Create FastAPI instance
app = FastAPI(
    title="{{ cookiecutter.project_name }}",
    description="{{ cookiecutter.project_description }}",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class HealthResponse(BaseModel):
    status: str


class InfoResponse(BaseModel):
    name: str
    description: str
    author: str
    port: int
    version: str


class AppResponse(BaseModel):
    app: str
    status: str
    version: str


# Routes
@app.get("/", response_model=AppResponse)
async def root():
    return {
        "app": "{{ cookiecutter.project_name }}",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    return {"status": "healthy"}


@app.get("/api/info", response_model=InfoResponse)
async def info():
    return {
        "name": "{{ cookiecutter.project_name }}",
        "description": "{{ cookiecutter.project_description }}",
        "author": "{{ cookiecutter.author_name }}",
        "port": int(os.environ.get("PORT", {{ cookiecutter.port }})),
        "version": "1.0.0"
    }


# Run the application
if __name__ == "__main__":
    port = int(os.environ.get("PORT", {{ cookiecutter.port }}))
    debug = os.environ.get("DEBUG", "False").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=debug
    )