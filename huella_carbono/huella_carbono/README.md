# Huella de Carbono — Sistema de Gestión

Sistema web de analítica para gestión de huella de carbono empresarial.
Desarrollado con Django REST Framework + React + Tailwind CSS.

## Stack

| Capa       | Tecnología |
|------------|-----------|
| Backend    | Django 5.0 + DRF + SimpleJWT |
| Frontend   | React 18 + Vite + Tailwind CSS |
| BD defecto | SQLite (desarrollo) / PostgreSQL (producción) |
| Gráficos   | Recharts |
| Estado     | Zustand + React Query |
| PDF        | ReportLab |

## Arranque rápido

```bash
# 1. Backend
cd backend
cp .env.example .env
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver                         # http://localhost:8000

# 2. Frontend (otra terminal)
cd frontend
npm install
npm run dev                                        # http://localhost:3000
```

## Documentación API

- Swagger UI: http://localhost:8000/api/docs/
- Admin Django: http://localhost:8000/admin/

## Historias de usuario implementadas

| HU    | Descripción                              | App backend      | Página frontend     |
|-------|------------------------------------------|------------------|---------------------|
| HU-01 | Carga manual de datos de energía         | recoleccion      | RecoleccionPage     |
| HU-02 | Carga de combustible y logística         | recoleccion      | RecoleccionPage     |
| HU-03 | Registro de compras y consumibles        | recoleccion      | RecoleccionPage     |
| HU-04 | Registro de residuos generados           | recoleccion      | RecoleccionPage     |
| HU-05 | Cálculo automático de huella de carbono  | calculo          | CalculoPage         |
| HU-06 | Tablero de visualización de emisiones    | visualizacion    | VisualizacionPage   |
| HU-07 | Identificación de áreas de consumo anómalo | visualizacion  | VisualizacionPage   |
| HU-08 | Generación de plan de reducción          | reduccion        | ReduccionPage       |
| HU-09 | Seguimiento de iniciativas del plan      | reduccion        | ReduccionPage       |
| HU-10 | Generación y exportación de reportes     | reportes         | ReportesPage        |

## Factores de emisión aplicados

| Fuente        | Factor                     | Referencia       |
|---------------|----------------------------|------------------|
| Electricidad  | 0.2853 kgCO₂e/kWh          | UPME 2023        |
| Diésel        | 2.6847 kgCO₂e/litro        | GHG Protocol     |
| Gasolina      | 2.3120 kgCO₂e/litro        | GHG Protocol     |
| Logística     | 0.0711 kgCO₂e/tkm          | EPA AP-42        |
| Papel         | 1.84 kgCO₂e/kg             | Ecoinvent        |
| Relleno san.  | 0.582 kgCO₂e/kg            | IDEAM / IPCC     |

## Equipo

- Santiago Zapata R  — Team Leader
- Juan David Salazar — Development Manager
- Samuel Lasso       — Planning Manager
- Isaac Chaves       — Quality Manager
- Paula Ferreira     — Configuration Manager
