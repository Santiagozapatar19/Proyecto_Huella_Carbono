from django.urls import path
from .views import (
    ReporteHuellaCSV, ReporteIniciativasCSV,
    ReporteAnomaliasCsv, ReporteEjecutivoPDF, ResumenReportes,
)

urlpatterns = [
    path('',                  ResumenReportes.as_view(),      name='reportes-lista'),
    path('huella/csv/',       ReporteHuellaCSV.as_view(),     name='reporte-huella-csv'),
    path('iniciativas/csv/',  ReporteIniciativasCSV.as_view(),name='reporte-iniciativas-csv'),
    path('anomalias/csv/',    ReporteAnomaliasCsv.as_view(),  name='reporte-anomalias-csv'),
    path('ejecutivo/pdf/',    ReporteEjecutivoPDF.as_view(),  name='reporte-ejecutivo-pdf'),
]
