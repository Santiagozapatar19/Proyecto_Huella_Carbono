from django.contrib import admin
from .models import PlanReduccion, Iniciativa, EvidenciaIniciativa, AlertaDesviacion


class IniciativaInline(admin.TabularInline):
    model = Iniciativa
    extra = 0
    fields = ['nombre', 'fuente_impacto', 'estado', 'impacto', 'factibilidad',
              'reduccion_estimada_tco2e', 'fecha_inicio_plan', 'fecha_fin_plan']


@admin.register(PlanReduccion)
class PlanReduccionAdmin(admin.ModelAdmin):
    list_display  = ['nombre', 'anio_objetivo', 'meta_reduccion_pct', 'estado', 'responsable']
    list_filter   = ['estado', 'anio_objetivo']
    inlines       = [IniciativaInline]


@admin.register(Iniciativa)
class IniciativaAdmin(admin.ModelAdmin):
    list_display  = ['nombre', 'plan', 'fuente_impacto', 'estado', 'impacto',
                     'factibilidad', 'reduccion_estimada_tco2e']
    list_filter   = ['estado', 'fuente_impacto']
    search_fields = ['nombre', 'descripcion']


@admin.register(EvidenciaIniciativa)
class EvidenciaAdmin(admin.ModelAdmin):
    list_display  = ['titulo', 'iniciativa', 'registrado_por', 'fecha_registro']


@admin.register(AlertaDesviacion)
class AlertaAdmin(admin.ModelAdmin):
    list_display  = ['iniciativa', 'tipo', 'mensaje', 'resuelta', 'fecha']
    list_filter   = ['tipo', 'resuelta']
