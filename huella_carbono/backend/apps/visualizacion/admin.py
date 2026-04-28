from django.contrib import admin
from .models import Anomalia


@admin.register(Anomalia)
class AnomaliaAdmin(admin.ModelAdmin):
    list_display  = ['periodo', 'fuente', 'descripcion', 'severidad', 'estado',
                     'desviacion_pct', 'detectada_en']
    list_filter   = ['severidad', 'estado', 'fuente', 'periodo__anio']
    search_fields = ['descripcion', 'sede', 'area']
    readonly_fields = ['detectada_en']
