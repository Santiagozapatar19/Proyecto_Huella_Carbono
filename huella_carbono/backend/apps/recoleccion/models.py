from django.db import models
from django.core.validators import MinValueValidator
from apps.usuarios.models import Usuario


class Periodo(models.Model):
    anio = models.PositiveIntegerField()
    mes = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 13)])
    cerrado = models.BooleanField(default=False)
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='periodos')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['anio', 'mes']
        ordering = ['-anio', '-mes']
        verbose_name = 'Período'
        verbose_name_plural = 'Períodos'

    def __str__(self):
        return f'{self.mes:02d}/{self.anio}'


# ── HU-01: Energía ────────────────────────────────────────────────

class TipoEnergia(models.TextChoices):
    ELECTRICA    = 'electrica',    'Eléctrica (Red)'
    SOLAR        = 'solar',        'Solar'
    GAS_NATURAL  = 'gas_natural',  'Gas Natural'
    GLP          = 'glp',          'GLP (Propano/Butano)'
    OTRO         = 'otro',         'Otro'


class RegistroEnergia(models.Model):
    periodo         = models.ForeignKey(Periodo, on_delete=models.PROTECT, related_name='registros_energia')
    tipo_energia    = models.CharField(max_length=20, choices=TipoEnergia.choices)
    sede            = models.CharField(max_length=100)
    area            = models.CharField(max_length=100, blank=True)
    consumo_kwh     = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    costo_cop       = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)], null=True, blank=True)
    proveedor       = models.CharField(max_length=100, blank=True)
    numero_factura  = models.CharField(max_length=50, blank=True)
    observaciones   = models.TextField(blank=True)
    archivo_soporte = models.FileField(upload_to='soportes/energia/', null=True, blank=True)
    registrado_por  = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='registros_energia')
    fecha_registro       = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-periodo__anio', '-periodo__mes']
        verbose_name = 'Registro de Energía'
        verbose_name_plural = 'Registros de Energía'

    def __str__(self):
        return f'{self.tipo_energia} | {self.sede} | {self.periodo}'


# ── HU-02: Combustible y Logística ───────────────────────────────

class TipoCombustible(models.TextChoices):
    DIESEL       = 'diesel',       'Diésel'
    GASOLINA     = 'gasolina',     'Gasolina'
    GAS_NAT_V    = 'gas_natural_v','Gas Natural Vehicular'
    BIODIESEL    = 'biodiesel',    'Biodiésel'
    OTRO         = 'otro',         'Otro'


class TipoVehiculo(models.TextChoices):
    CAMION = 'camion', 'Camión'
    FURGON = 'furgon', 'Furgón'
    AUTO   = 'auto',   'Automóvil'
    MOTO   = 'moto',   'Motocicleta'
    OTRO   = 'otro',   'Otro'


class RegistroCombustible(models.Model):
    periodo           = models.ForeignKey(Periodo, on_delete=models.PROTECT, related_name='registros_combustible')
    tipo_combustible  = models.CharField(max_length=20, choices=TipoCombustible.choices)
    tipo_vehiculo     = models.CharField(max_length=20, choices=TipoVehiculo.choices, blank=True)
    placa_o_equipo    = models.CharField(max_length=50, blank=True)
    area              = models.CharField(max_length=100, blank=True)
    cantidad_litros   = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    costo_cop         = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    proveedor         = models.CharField(max_length=100, blank=True)
    observaciones     = models.TextField(blank=True)
    archivo_soporte   = models.FileField(upload_to='soportes/combustible/', null=True, blank=True)
    registrado_por    = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='registros_combustible')
    fecha_registro      = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-periodo__anio', '-periodo__mes']
        verbose_name = 'Registro de Combustible'
        verbose_name_plural = 'Registros de Combustible'

    def __str__(self):
        return f'{self.tipo_combustible} | {self.placa_o_equipo or self.area} | {self.periodo}'


class RegistroLogistica(models.Model):
    periodo              = models.ForeignKey(Periodo, on_delete=models.PROTECT, related_name='registros_logistica')
    origen               = models.CharField(max_length=150)
    destino              = models.CharField(max_length=150)
    tipo_transporte      = models.CharField(max_length=50)
    distancia_km         = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    peso_toneladas       = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    numero_viajes        = models.PositiveIntegerField(default=1)
    proveedor_logistico  = models.CharField(max_length=100, blank=True)
    costo_cop            = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    observaciones        = models.TextField(blank=True)
    registrado_por       = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='registros_logistica')
    fecha_registro       = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-periodo__anio', '-periodo__mes']
        verbose_name = 'Registro de Logística'

    def __str__(self):
        return f'{self.origen} → {self.destino} | {self.periodo}'


# ── HU-03: Compras y Consumibles ─────────────────────────────────

class CategoriaConsumible(models.TextChoices):
    PAPEL       = 'papel',       'Papel y materiales de oficina'
    PLASTICOS   = 'plasticos',   'Plásticos'
    QUIMICOS    = 'quimicos',    'Químicos e insumos industriales'
    ALIMENTOS   = 'alimentos',   'Alimentos y bebidas'
    ELECTRONICO = 'electronico', 'Equipos electrónicos'
    OTRO        = 'otro',        'Otro'


class RegistroComprasConsumibles(models.Model):
    periodo         = models.ForeignKey(Periodo, on_delete=models.PROTECT, related_name='registros_compras')
    categoria       = models.CharField(max_length=30, choices=CategoriaConsumible.choices)
    descripcion     = models.CharField(max_length=200)
    proveedor       = models.CharField(max_length=150, blank=True)
    cantidad        = models.DecimalField(max_digits=12, decimal_places=3, validators=[MinValueValidator(0)])
    unidad          = models.CharField(max_length=30)
    peso_total_kg   = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    costo_cop       = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    area            = models.CharField(max_length=100, blank=True)
    origen_nacional = models.BooleanField(default=True)
    observaciones   = models.TextField(blank=True)
    archivo_soporte = models.FileField(upload_to='soportes/compras/', null=True, blank=True)
    registrado_por  = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='registros_compras')
    fecha_registro      = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-periodo__anio', '-periodo__mes']
        verbose_name = 'Registro de Compras/Consumibles'
        verbose_name_plural = 'Registros de Compras/Consumibles'

    def __str__(self):
        return f'{self.categoria} | {self.descripcion} | {self.periodo}'


# ── HU-04: Residuos ──────────────────────────────────────────────

class TipoResiduo(models.TextChoices):
    ORDINARIO  = 'ordinario',  'Ordinario / No reciclable'
    RECICLABLE = 'reciclable', 'Reciclable'
    ORGANICO   = 'organico',   'Orgánico'
    PELIGROSO  = 'peligroso',  'Peligroso (RESPEL)'
    ESPECIAL   = 'especial',   'Especial (RAEE, escombros, etc.)'


class MetodoDisposicion(models.TextChoices):
    RELLENO           = 'relleno',           'Relleno sanitario'
    RECICLAJE         = 'reciclaje',         'Reciclaje'
    COMPOSTAJE        = 'compostaje',        'Compostaje'
    INCINERACION      = 'incineracion',      'Incineración'
    GESTOR_AUTORIZADO = 'gestor_autorizado', 'Gestor autorizado RESPEL'
    OTRO              = 'otro',              'Otro'


class RegistroResiduos(models.Model):
    periodo                = models.ForeignKey(Periodo, on_delete=models.PROTECT, related_name='registros_residuos')
    tipo_residuo           = models.CharField(max_length=20, choices=TipoResiduo.choices)
    descripcion            = models.CharField(max_length=200, blank=True)
    area                   = models.CharField(max_length=100, blank=True)
    sede                   = models.CharField(max_length=100, blank=True)
    cantidad_kg            = models.DecimalField(max_digits=12, decimal_places=3, validators=[MinValueValidator(0)])
    metodo_disposicion     = models.CharField(max_length=25, choices=MetodoDisposicion.choices)
    gestor_externo         = models.CharField(max_length=150, blank=True)
    costo_disposicion_cop  = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    certificado_disposicion= models.FileField(upload_to='soportes/residuos/', null=True, blank=True)
    observaciones          = models.TextField(blank=True)
    registrado_por         = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='registros_residuos')
    fecha_registro         = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-periodo__anio', '-periodo__mes']
        verbose_name = 'Registro de Residuos'
        verbose_name_plural = 'Registros de Residuos'

    def __str__(self):
        return f'{self.tipo_residuo} | {self.cantidad_kg} kg | {self.periodo}'
