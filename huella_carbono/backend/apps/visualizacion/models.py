from django.db import models
from apps.usuarios.models import Usuario
from apps.recoleccion.models import Periodo


class Anomalia(models.Model):
    """
    HU-07: Registro de anomalías detectadas en el análisis de datos.
    Una anomalía es un consumo que supera el umbral definido respecto al promedio.
    """
    class Severidad(models.TextChoices):
        BAJA   = 'baja',   'Baja'
        MEDIA  = 'media',  'Media'
        ALTA   = 'alta',   'Alta'

    class EstadoAnomalia(models.TextChoices):
        NUEVA      = 'nueva',      'Nueva'
        REVISADA   = 'revisada',   'Revisada'
        RESUELTA   = 'resuelta',   'Resuelta'
        DESCARTADA = 'descartada', 'Descartada (falso positivo)'

    periodo         = models.ForeignKey(Periodo, on_delete=models.CASCADE, related_name='anomalias')
    fuente          = models.CharField(max_length=30, help_text='energia, combustible, logistica, compras, residuos')
    descripcion     = models.CharField(max_length=300)
    area            = models.CharField(max_length=100, blank=True)
    sede            = models.CharField(max_length=100, blank=True)
    valor_actual    = models.DecimalField(max_digits=14, decimal_places=4)
    valor_promedio  = models.DecimalField(max_digits=14, decimal_places=4)
    desviacion_pct  = models.DecimalField(max_digits=8, decimal_places=2, help_text='% de desviación sobre el promedio')
    unidad          = models.CharField(max_length=20, default='kWh')
    severidad       = models.CharField(max_length=10, choices=Severidad.choices, default=Severidad.MEDIA)
    estado          = models.CharField(max_length=15, choices=EstadoAnomalia.choices, default=EstadoAnomalia.NUEVA)
    comentario      = models.TextField(blank=True, help_text='Observación del responsable al revisar')
    detectada_en    = models.DateTimeField(auto_now_add=True)
    revisada_por    = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='anomalias_revisadas')
    fecha_revision  = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-desviacion_pct']
        verbose_name = 'Anomalía'
        verbose_name_plural = 'Anomalías'

    def __str__(self):
        return f'[{self.severidad.upper()}] {self.fuente} | {self.descripcion[:60]}'
