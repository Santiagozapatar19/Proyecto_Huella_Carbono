from django.db import models
from apps.usuarios.models import Usuario
from apps.recoleccion.models import Periodo


class ResultadoCalculo(models.Model):
    """
    Guarda el resultado de cada cálculo de huella para un período.
    Permite tener historial y evitar recalcular en cada request.
    """
    periodo          = models.ForeignKey(Periodo, on_delete=models.CASCADE, related_name='calculos')
    total_tco2e      = models.DecimalField(max_digits=14, decimal_places=6)
    energia_tco2e    = models.DecimalField(max_digits=14, decimal_places=6, default=0)
    combustible_tco2e= models.DecimalField(max_digits=14, decimal_places=6, default=0)
    logistica_tco2e  = models.DecimalField(max_digits=14, decimal_places=6, default=0)
    compras_tco2e    = models.DecimalField(max_digits=14, decimal_places=6, default=0)
    residuos_tco2e   = models.DecimalField(max_digits=14, decimal_places=6, default=0)
    detalle_json     = models.JSONField(help_text='Detalle completo del cálculo')
    calculado_por    = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    fecha_calculo    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_calculo']
        verbose_name = 'Resultado de Cálculo'
        verbose_name_plural = 'Resultados de Cálculo'

    def __str__(self):
        return f'Cálculo {self.periodo} → {self.total_tco2e} tCO₂e'

    @property
    def resumen_fuentes(self):
        return [
            {'fuente': 'Energía',     'tco2e': float(self.energia_tco2e)},
            {'fuente': 'Combustible', 'tco2e': float(self.combustible_tco2e)},
            {'fuente': 'Logística',   'tco2e': float(self.logistica_tco2e)},
            {'fuente': 'Compras',     'tco2e': float(self.compras_tco2e)},
            {'fuente': 'Residuos',    'tco2e': float(self.residuos_tco2e)},
        ]


class LineaBase(models.Model):
    """Línea base de referencia para comparar la huella actual."""
    nombre        = models.CharField(max_length=100)
    anio          = models.PositiveIntegerField()
    total_tco2e   = models.DecimalField(max_digits=14, decimal_places=6)
    descripcion   = models.TextField(blank=True)
    creado_por    = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    fecha_creacion= models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-anio']
        verbose_name = 'Línea Base'

    def __str__(self):
        return f'{self.nombre} ({self.anio}) — {self.total_tco2e} tCO₂e'
