"""
Motor de cálculo de huella de carbono.
Recibe un Período y devuelve el desglose completo de emisiones en tCO2e.
"""
from decimal import Decimal
from .factores_emision import (
    FACTOR_ENERGIA, FACTOR_COMBUSTIBLE, FACTOR_LOGISTICA,
    FACTOR_CONSUMIBLE, FACTOR_RESIDUO, FACTOR_IMPORTADO,
)


def _d(valor):
    """Convierte a float seguro."""
    try:
        return float(valor or 0)
    except (TypeError, ValueError):
        return 0.0


def calcular_energia(registros_qs):
    """Calcula emisiones de energía. Retorna lista de dicts con detalle."""
    resultados = []
    for r in registros_qs:
        factor = FACTOR_ENERGIA.get(r.tipo_energia, 0.25)
        emision_kg = _d(r.consumo_kwh) * factor
        resultados.append({
            'id': r.id,
            'tipo': r.tipo_energia,
            'sede': r.sede,
            'area': r.area,
            'consumo_kwh': _d(r.consumo_kwh),
            'factor_kgco2e_kwh': factor,
            'emision_kgco2e': round(emision_kg, 4),
            'emision_tco2e': round(emision_kg / 1000, 6),
        })
    return resultados


def calcular_combustible(registros_qs):
    """Calcula emisiones de combustible."""
    resultados = []
    for r in registros_qs:
        factor = FACTOR_COMBUSTIBLE.get(r.tipo_combustible, 2.30)
        emision_kg = _d(r.cantidad_litros) * factor
        resultados.append({
            'id': r.id,
            'tipo': r.tipo_combustible,
            'placa_o_equipo': r.placa_o_equipo,
            'area': r.area,
            'litros': _d(r.cantidad_litros),
            'factor_kgco2e_litro': factor,
            'emision_kgco2e': round(emision_kg, 4),
            'emision_tco2e': round(emision_kg / 1000, 6),
        })
    return resultados


def calcular_logistica(registros_qs):
    """Calcula emisiones logística: factor * distancia_km * peso_ton * viajes."""
    resultados = []
    for r in registros_qs:
        tipo_lower = r.tipo_transporte.lower()
        factor = FACTOR_LOGISTICA.get(tipo_lower, FACTOR_LOGISTICA['terrestre'])
        peso_ton = _d(r.peso_toneladas) or 1.0  # si no hay peso, asume 1t
        tkm = _d(r.distancia_km) * peso_ton * _d(r.numero_viajes)
        emision_kg = tkm * factor
        resultados.append({
            'id': r.id,
            'origen': r.origen,
            'destino': r.destino,
            'tipo_transporte': r.tipo_transporte,
            'distancia_km': _d(r.distancia_km),
            'peso_toneladas': peso_ton,
            'numero_viajes': r.numero_viajes,
            'toneladas_km': round(tkm, 4),
            'factor_kgco2e_tkm': factor,
            'emision_kgco2e': round(emision_kg, 4),
            'emision_tco2e': round(emision_kg / 1000, 6),
        })
    return resultados


def calcular_compras(registros_qs):
    """Calcula emisiones de compras y consumibles por kg."""
    resultados = []
    for r in registros_qs:
        factor = FACTOR_CONSUMIBLE.get(r.categoria, 1.5)
        if not r.origen_nacional:
            factor *= FACTOR_IMPORTADO
        peso_kg = _d(r.peso_total_kg) or _d(r.cantidad)  # fallback a cantidad
        emision_kg = peso_kg * factor
        resultados.append({
            'id': r.id,
            'categoria': r.categoria,
            'descripcion': r.descripcion,
            'area': r.area,
            'peso_kg': round(peso_kg, 3),
            'origen_nacional': r.origen_nacional,
            'factor_kgco2e_kg': round(factor, 4),
            'emision_kgco2e': round(emision_kg, 4),
            'emision_tco2e': round(emision_kg / 1000, 6),
        })
    return resultados


def calcular_residuos(registros_qs):
    """Calcula emisiones de residuos según método de disposición."""
    resultados = []
    for r in registros_qs:
        factor = FACTOR_RESIDUO.get(r.metodo_disposicion, 0.45)
        emision_kg = _d(r.cantidad_kg) * factor
        resultados.append({
            'id': r.id,
            'tipo_residuo': r.tipo_residuo,
            'area': r.area,
            'sede': r.sede,
            'cantidad_kg': _d(r.cantidad_kg),
            'metodo_disposicion': r.metodo_disposicion,
            'factor_kgco2e_kg': factor,
            'emision_kgco2e': round(emision_kg, 4),
            'emision_tco2e': round(emision_kg / 1000, 6),
        })
    return resultados


def calcular_huella_periodo(periodo):
    """
    Calcula la huella completa de un período.
    Retorna un dict con el resumen y el detalle por fuente.
    """
    det_energia      = calcular_energia(periodo.registros_energia.all())
    det_combustible  = calcular_combustible(periodo.registros_combustible.all())
    det_logistica    = calcular_logistica(periodo.registros_logistica.all())
    det_compras      = calcular_compras(periodo.registros_compras.all())
    det_residuos     = calcular_residuos(periodo.registros_residuos.all())

    def total_tco2e(lista):
        return round(sum(r['emision_tco2e'] for r in lista), 6)

    t_energia     = total_tco2e(det_energia)
    t_combustible = total_tco2e(det_combustible)
    t_logistica   = total_tco2e(det_logistica)
    t_compras     = total_tco2e(det_compras)
    t_residuos    = total_tco2e(det_residuos)
    total         = round(t_energia + t_combustible + t_logistica + t_compras + t_residuos, 6)

    def pct(valor):
        return round((valor / total * 100), 2) if total > 0 else 0

    return {
        'periodo_id':  periodo.id,
        'periodo':     str(periodo),
        'total_tco2e': total,
        'resumen': [
            {'fuente': 'Energía',      'tco2e': t_energia,     'porcentaje': pct(t_energia)},
            {'fuente': 'Combustible',  'tco2e': t_combustible, 'porcentaje': pct(t_combustible)},
            {'fuente': 'Logística',    'tco2e': t_logistica,   'porcentaje': pct(t_logistica)},
            {'fuente': 'Compras',      'tco2e': t_compras,     'porcentaje': pct(t_compras)},
            {'fuente': 'Residuos',     'tco2e': t_residuos,    'porcentaje': pct(t_residuos)},
        ],
        'detalle': {
            'energia':     det_energia,
            'combustible': det_combustible,
            'logistica':   det_logistica,
            'compras':     det_compras,
            'residuos':    det_residuos,
        },
    }


def comparar_periodos(periodos_qs):
    """
    Compara la huella entre varios períodos. Para el tablero de tendencia.
    Retorna lista ordenada cronológicamente.
    """
    resultados = []
    for p in periodos_qs.order_by('anio', 'mes'):
        calc = calcular_huella_periodo(p)
        resultados.append({
            'periodo_id':    p.id,
            'periodo':       str(p),
            'anio':          p.anio,
            'mes':           p.mes,
            'total_tco2e':   calc['total_tco2e'],
            'energia_tco2e': calc['resumen'][0]['tco2e'],
            'combustible_tco2e': calc['resumen'][1]['tco2e'],
            'logistica_tco2e':   calc['resumen'][2]['tco2e'],
            'compras_tco2e':     calc['resumen'][3]['tco2e'],
            'residuos_tco2e':    calc['resumen'][4]['tco2e'],
        })
    return resultados
