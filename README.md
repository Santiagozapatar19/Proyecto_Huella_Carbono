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

### Terminal 1: Backend Django

```bash
# Carpeta: huella_carbono/backend/
cd huella_carbono/backend

# Activar entorno virtual
.\venv\Scripts\activate           # Windows
# source venv/bin/activate        # macOS/Linux

# Instalar dependencias (si no lo has hecho)
pip install -r requirements.txt

# Crear y aplicar migraciones (primera vez)
python manage.py makemigrations
python manage.py migrate

# Crear superusuario (primera vez)
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

**Backend disponible en:** http://localhost:8000
- Swagger API: http://localhost:8000/api/docs/
- Admin Django: http://localhost:8000/admin/

### Terminal 2: Frontend React

```bash
# Carpeta: huella_carbono/frontend/
cd huella_carbono/frontend

# Instalar dependencias (si no lo has hecho)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**Frontend disponible en:** http://localhost:3000

## Solución de problemas

Si al ejecutar `python manage.py runserver` aparece un error como `No module named 'django'` o falla la instalación de dependencias por incompatibilidad con la versión de Python, recrea el entorno virtual con Python 3.12:

```powershell
# Primero, deactivate el venv actual
deactivate

# Eliminar el venv viejo
Remove-Item -Recurse -Force venv

# Crear nuevo venv con Python 3.12
py -3.12 -m venv venv

# Activar el nuevo venv
.\venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt
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

**Credenciales Django Admin**

Email: santi@gmail.com

Nombre de usuario: santiago

Nombre: Santiago

Apellidos: Zapata

Password: santiago
