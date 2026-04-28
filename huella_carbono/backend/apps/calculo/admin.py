from django.contrib import admin
from .models import ResultadoCalculo, LineaBase


@admin.register(ResultadoCalculo)
class ResultadoCalculoAdmin(admin.ModelAdmin):
    list_display = ['periodo', 'total_tco2e', 'energia_tco2e', 'combustible_tco2e',
                    'logistica_tco2e', 'compras_tco2e', 'residuos_tco2e', 'fecha_calculo']
    list_filter  = ['periodo__anio']
    readonly_fields = ['detalle_json', 'fecha_calculo']


@admin.register(LineaBase)
class LineaBaseAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'anio', 'total_tco2e', 'fecha_creacion']
