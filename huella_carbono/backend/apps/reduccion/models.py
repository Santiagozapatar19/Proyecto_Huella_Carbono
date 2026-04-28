from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from apps.usuarios.models import Usuario


class PlanReduccion(models.Model):
    """HU-08: Plan de reducción de huella de carbono."""

    class Estado(models.TextChoices):
        BORRADOR  = 'borrador',  'Borrador'
        ACTIVO    = 'activo',    'Activo'
        COMPLETADO= 'completado','Completado'
        CANCELADO = 'cancelado', 'Cancelado'

    nombre          = models.CharField(max_length=200)
    descripcion     = models.TextField(blank=True)
    anio_objetivo   = models.PositiveIntegerField()
    meta_reduccion_pct = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        help_text='% de reducción objetivo respecto a la línea base'
    )
    linea_base_tco2e= models.DecimalField(
        max_digits=14, decimal_places=6,
        help_text='Huella base desde la cual se mide la reducción'
    )
    estado          = models.CharField(max_length=15, choices=Estado.choices, default=Estado.BORRADOR)
    responsable     = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='planes_responsable')
    creado_por      = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='planes_creados')
    fecha_inicio    = models.DateField()
    fecha_fin       = models.DateField()
    fecha_creacion  = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Plan de Reducción'
        verbose_name_plural = 'Planes de Reducción'

    def __str__(self):
        return f'{self.nombre} ({self.anio_objetivo})'

    @property
    def meta_tco2e(self) -> float:
        return float(self.linea_base_tco2e) * float(self.meta_reduccion_pct) / 100

    @property
    def total_iniciativas(self) -> int:
        return self.iniciativas.count()

    @property
    def iniciativas_completadas(self) -> int:
        return self.iniciativas.filter(estado='completada').count()


class Iniciativa(models.Model):
    """HU-08: Iniciativa individual dentro de un plan de reducción."""

    class Estado(models.TextChoices):
        PENDIENTE  = 'pendiente',  'Pendiente'
        EN_CURSO   = 'en_curso',   'En curso'
        COMPLETADA = 'completada', 'Completada'
        CANCELADA  = 'cancelada',  'Cancelada'

    class Fuente(models.TextChoices):
        ENERGIA     = 'energia',     'Energía'
        COMBUSTIBLE = 'combustible', 'Combustible'
        LOGISTICA   = 'logistica',   'Logística'
        COMPRAS     = 'compras',     'Compras y consumibles'
        RESIDUOS    = 'residuos',    'Residuos'
        MULTIPLE    = 'multiple',    'Múltiples fuentes'

    plan            = models.ForeignKey(PlanReduccion, on_delete=models.CASCADE, related_name='iniciativas')
    nombre          = models.CharField(max_length=200)
    descripcion     = models.TextField()
    fuente_impacto  = models.CharField(max_length=15, choices=Fuente.choices)
    area            = models.CharField(max_length=100, blank=True)
    sede            = models.CharField(max_length=100, blank=True)

    # Priorización (HU-08: impacto, costo, factibilidad)
    impacto         = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='1=muy bajo … 5=muy alto'
    )
    costo_estimado_cop = models.DecimalField(
        max_digits=14, decimal_places=0,
        validators=[MinValueValidator(Decimal('0'))],
        null=True, blank=True
    )
    factibilidad    = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='1=muy difícil … 5=muy fácil'
    )
    reduccion_estimada_tco2e = models.DecimalField(
        max_digits=10, decimal_places=4,
        validators=[MinValueValidator(Decimal('0'))],
        help_text='tCO₂e que se espera reducir'
    )

    # Ejecución
    estado          = models.CharField(max_length=15, choices=Estado.choices, default=Estado.PENDIENTE)
    responsable     = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='iniciativas_responsable')
    fecha_inicio_plan   = models.DateField()
    fecha_fin_plan      = models.DateField()
    fecha_inicio_real   = models.DateField(null=True, blank=True)
    fecha_fin_real      = models.DateField(null=True, blank=True)
    reduccion_real_tco2e= models.DecimalField(
        max_digits=10, decimal_places=4,
        null=True, blank=True,
        help_text='tCO₂e efectivamente reducidas al completar'
    )
    fecha_creacion  = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-impacto', '-factibilidad']
        verbose_name = 'Iniciativa'
        verbose_name_plural = 'Iniciativas'

    def __str__(self):
        return f'{self.nombre} [{self.get_estado_display()}]'

    @property
    def score_priorizacion(self) -> int:
        """Score simple: impacto * factibilidad (mayor = más prioritaria)."""
        return self.impacto * self.factibilidad

    @property
    def avance_pct(self) -> int:
        if self.estado == 'completada':
            return 100
        if self.estado == 'pendiente':
            return 0
        # En curso: calcula por días transcurridos
        from datetime import date
        hoy = date.today()
        if hoy <= self.fecha_inicio_plan:
            return 0
        total = (self.fecha_fin_plan - self.fecha_inicio_plan).days
        transcurrido = (hoy - self.fecha_inicio_plan).days
        if total <= 0:
            return 50
        return min(int(transcurrido / total * 100), 99)


class EvidenciaIniciativa(models.Model):
    """HU-09: Evidencias y actualizaciones de seguimiento de una iniciativa."""
    iniciativa      = models.ForeignKey(Iniciativa, on_delete=models.CASCADE, related_name='evidencias')
    titulo          = models.CharField(max_length=200)
    descripcion     = models.TextField()
    archivo         = models.FileField(upload_to='evidencias/', null=True, blank=True)
    registrado_por  = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    fecha_registro  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha_registro']
        verbose_name = 'Evidencia'
        verbose_name_plural = 'Evidencias'

    def __str__(self):
        return f'{self.titulo} — {self.iniciativa.nombre}'


class AlertaDesviacion(models.Model):
    """HU-09: Alertas automáticas cuando una iniciativa se desvía del cronograma."""

    class Tipo(models.TextChoices):
        RETRASO       = 'retraso',       'Retraso en cronograma'
        SIN_EVIDENCIA = 'sin_evidencia', 'Sin evidencias recientes'
        META_RIESGO   = 'meta_riesgo',   'Meta en riesgo'

    iniciativa  = models.ForeignKey(Iniciativa, on_delete=models.CASCADE, related_name='alertas')
    tipo        = models.CharField(max_length=20, choices=Tipo.choices)
    mensaje     = models.CharField(max_length=300)
    resuelta    = models.BooleanField(default=False)
    fecha       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'Alerta de Desviación'
        verbose_name_plural = 'Alertas de Desviación'

    def __str__(self):
        return f'[{self.tipo}] {self.iniciativa.nombre}'
