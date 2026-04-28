"""
HU-06 y HU-07: Motor de análisis y detección de anomalías.
Genera los datos para tableros y detecta consumos anómalos.
"""
from django.db.models import Sum, Avg, Count, Q
from apps.recoleccion.models import (
    Periodo, RegistroEnergia, RegistroCombustible,
    RegistroLogistica, RegistroComprasConsumibles, RegistroResiduos,
)
from apps.calculo.models import ResultadoCalculo

# Umbral: desviación mayor a este % sobre el promedio = anomalía
UMBRAL_MEDIA  = 30   # >30%  → baja
UMBRAL_ALTA   = 60   # >60%  → media
UMBRAL_CRITICA= 100  # >100% → alta


def _severidad(desviacion_pct):
    pct = abs(desviacion_pct)
    if pct >= UMBRAL_CRITICA:
        return 'alta'
    elif pct >= UMBRAL_ALTA:
        return 'media'
    return 'baja'


# ─────────────────────────────────────────────────────────────────
# HU-06: Datos para tableros de visualización
# ─────────────────────────────────────────────────────────────────

def tablero_tendencia(ultimos_n=12):
    """Serie temporal de huella por período (últimos N con cálculo)."""
    calculos = (
        ResultadoCalculo.objects
        .select_related('periodo')
        .order_by('periodo__anio', 'periodo__mes')[:ultimos_n]
    )
    meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return [
        {
            'periodo':    str(c.periodo),
            'label':      f'{meses[c.periodo.mes - 1]} {c.periodo.anio}',
            'anio':       c.periodo.anio,
            'mes':        c.periodo.mes,
            'total':      float(c.total_tco2e),
            'energia':    float(c.energia_tco2e),
            'combustible':float(c.combustible_tco2e),
            'logistica':  float(c.logistica_tco2e),
            'compras':    float(c.compras_tco2e),
            'residuos':   float(c.residuos_tco2e),
        }
        for c in calculos
    ]


def tablero_emision_por_fuente():
    """Totales acumulados de huella por fuente (todos los períodos calculados)."""
    qs = ResultadoCalculo.objects.aggregate(
        energia=Sum('energia_tco2e'),
        combustible=Sum('combustible_tco2e'),
        logistica=Sum('logistica_tco2e'),
        compras=Sum('compras_tco2e'),
        residuos=Sum('residuos_tco2e'),
        total=Sum('total_tco2e'),
    )
    total = float(qs['total'] or 0)
    fuentes = [
        ('Energía',     float(qs['energia']     or 0)),
        ('Combustible', float(qs['combustible'] or 0)),
        ('Logística',   float(qs['logistica']   or 0)),
        ('Compras',     float(qs['compras']     or 0)),
        ('Residuos',    float(qs['residuos']    or 0)),
    ]
    return [
        {
            'fuente': nombre,
            'tco2e': valor,
            'porcentaje': round(valor / total * 100, 2) if total > 0 else 0,
        }
        for nombre, valor in fuentes
    ]


def tablero_energia_por_sede():
    """Consumo energético agrupado por sede."""
    qs = (
        RegistroEnergia.objects
        .values('sede', 'tipo_energia')
        .annotate(total_kwh=Sum('consumo_kwh'), registros=Count('id'))
        .order_by('-total_kwh')
    )
    return list(qs)


def tablero_residuos_por_tipo():
    """Residuos agrupados por tipo y método de disposición."""
    qs = (
        RegistroResiduos.objects
        .values('tipo_residuo', 'metodo_disposicion')
        .annotate(total_kg=Sum('cantidad_kg'), registros=Count('id'))
        .order_by('-total_kg')
    )
    return list(qs)


def tablero_costos_por_periodo():
    """Costos operativos totales por período (energía + combustible + compras)."""
    periodos = Periodo.objects.order_by('anio', 'mes')
    resultado = []
    for p in periodos:
        costo_energia     = p.registros_energia.aggregate(t=Sum('costo_cop'))['t'] or 0
        costo_combustible = p.registros_combustible.aggregate(t=Sum('costo_cop'))['t'] or 0
        costo_compras     = p.registros_compras.aggregate(t=Sum('costo_cop'))['t'] or 0
        costo_residuos    = p.registros_residuos.aggregate(t=Sum('costo_disposicion_cop'))['t'] or 0
        resultado.append({
            'periodo': str(p),
            'energia_cop':     float(costo_energia),
            'combustible_cop': float(costo_combustible),
            'compras_cop':     float(costo_compras),
            'residuos_cop':    float(costo_residuos),
            'total_cop':       float(costo_energia + costo_combustible + costo_compras + costo_residuos),
        })
    return resultado


# ─────────────────────────────────────────────────────────────────
# HU-07: Detección de anomalías
# ─────────────────────────────────────────────────────────────────

def detectar_anomalias_energia(periodo):
    """Detecta sedes con consumo > umbral respecto al promedio histórico."""
    anomalias = []
    sedes = RegistroEnergia.objects.values_list('sede', flat=True).distinct()

    for sede in sedes:
        # Promedio histórico de esa sede (excluyendo el período actual)
        historico = (
            RegistroEnergia.objects
            .filter(sede=sede)
            .exclude(periodo=periodo)
            .aggregate(promedio=Avg('consumo_kwh'), registros=Count('id'))
        )
        if not historico['promedio'] or historico['registros'] < 2:
            continue  # Sin histórico suficiente

        actual_qs = RegistroEnergia.objects.filter(periodo=periodo, sede=sede)
        if not actual_qs.exists():
            continue

        actual = float(actual_qs.aggregate(t=Sum('consumo_kwh'))['t'] or 0)
        promedio = float(historico['promedio'])
        desviacion = ((actual - promedio) / promedio) * 100

        if desviacion >= UMBRAL_MEDIA:
            anomalias.append({
                'fuente':         'energia',
                'descripcion':    f'Consumo eléctrico en {sede} supera el promedio histórico',
                'sede':           sede,
                'area':           '',
                'valor_actual':   round(actual, 4),
                'valor_promedio': round(promedio, 4),
                'desviacion_pct': round(desviacion, 2),
                'unidad':         'kWh',
                'severidad':      _severidad(desviacion),
            })
    return anomalias


def detectar_anomalias_combustible(periodo):
    """Detecta tipos de combustible con consumo > umbral."""
    anomalias = []
    tipos = RegistroCombustible.objects.values_list('tipo_combustible', flat=True).distinct()

    for tipo in tipos:
        historico = (
            RegistroCombustible.objects
            .filter(tipo_combustible=tipo)
            .exclude(periodo=periodo)
            .aggregate(promedio=Avg('cantidad_litros'), registros=Count('id'))
        )
        if not historico['promedio'] or historico['registros'] < 2:
            continue

        actual_qs = RegistroCombustible.objects.filter(periodo=periodo, tipo_combustible=tipo)
        if not actual_qs.exists():
            continue

        actual   = float(actual_qs.aggregate(t=Sum('cantidad_litros'))['t'] or 0)
        promedio = float(historico['promedio'])
        desviacion = ((actual - promedio) / promedio) * 100

        if desviacion >= UMBRAL_MEDIA:
            anomalias.append({
                'fuente':         'combustible',
                'descripcion':    f'Consumo de {tipo} supera el promedio histórico',
                'sede':           '',
                'area':           '',
                'valor_actual':   round(actual, 4),
                'valor_promedio': round(promedio, 4),
                'desviacion_pct': round(desviacion, 2),
                'unidad':         'litros',
                'severidad':      _severidad(desviacion),
            })
    return anomalias


def detectar_anomalias_residuos(periodo):
    """Detecta tipos de residuo con generación > umbral."""
    anomalias = []
    tipos = RegistroResiduos.objects.values_list('tipo_residuo', flat=True).distinct()

    for tipo in tipos:
        historico = (
            RegistroResiduos.objects
            .filter(tipo_residuo=tipo)
            .exclude(periodo=periodo)
            .aggregate(promedio=Avg('cantidad_kg'), registros=Count('id'))
        )
        if not historico['promedio'] or historico['registros'] < 2:
            continue

        actual_qs = RegistroResiduos.objects.filter(periodo=periodo, tipo_residuo=tipo)
        if not actual_qs.exists():
            continue

        actual   = float(actual_qs.aggregate(t=Sum('cantidad_kg'))['t'] or 0)
        promedio = float(historico['promedio'])
        desviacion = ((actual - promedio) / promedio) * 100

        if desviacion >= UMBRAL_MEDIA:
            anomalias.append({
                'fuente':         'residuos',
                'descripcion':    f'Generación de residuos tipo "{tipo}" supera el promedio',
                'sede':           '',
                'area':           '',
                'valor_actual':   round(actual, 4),
                'valor_promedio': round(promedio, 4),
                'desviacion_pct': round(desviacion, 2),
                'unidad':         'kg',
                'severidad':      _severidad(desviacion),
            })
    return anomalias


def analizar_anomalias_periodo(periodo):
    """
    Ejecuta todos los detectores para un período y persiste los resultados.
    Retorna la lista de anomalías encontradas.
    """
    from .models import Anomalia

    todas = (
        detectar_anomalias_energia(periodo)
        + detectar_anomalias_combustible(periodo)
        + detectar_anomalias_residuos(periodo)
    )

    # Elimina anomalías previas del período para recalcular limpio
    Anomalia.objects.filter(periodo=periodo).delete()

    objetos = []
    for a in todas:
        objetos.append(Anomalia(
            periodo        = periodo,
            fuente         = a['fuente'],
            descripcion    = a['descripcion'],
            sede           = a['sede'],
            area           = a['area'],
            valor_actual   = a['valor_actual'],
            valor_promedio = a['valor_promedio'],
            desviacion_pct = a['desviacion_pct'],
            unidad         = a['unidad'],
            severidad      = a['severidad'],
        ))

    Anomalia.objects.bulk_create(objetos)
    return todas
