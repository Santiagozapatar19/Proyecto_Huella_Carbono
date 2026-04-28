"""
Factores de emisión para Colombia.
Fuentes:
  - UPME / IDEAM: Factor de emisión red eléctrica nacional 2023
  - IPCC AR6 / GHG Protocol: combustibles fósiles
  - EPA AP-42 / Ecoinvent: residuos y logística
  - GHG Protocol Scope 3: compras y consumibles

Unidades: kgCO2e por unidad indicada en cada constante.
"""

# ── Red eléctrica Colombia (UPME 2023) ───────────────────────────
# kgCO2e por kWh consumido
ELECTRICIDAD_RED_CO = 0.2853   # Colombia grid average 2023
ELECTRICIDAD_SOLAR  = 0.0      # Generación solar propia = 0 emisiones directas

# ── Gas natural (IPCC / GHG Protocol) ────────────────────────────
# kgCO2e por kWh térmico (conversión: 1 m³ GN ≈ 10.55 kWh)
GAS_NATURAL_KWH     = 0.2018   # kgCO2e/kWh
GAS_NATURAL_M3      = 2.029    # kgCO2e/m³

# ── GLP Propano/Butano ────────────────────────────────────────────
GLP_KWH             = 0.2140   # kgCO2e/kWh

# ── Combustibles vehículos / maquinaria (GHG Protocol, IPCC AR6) ─
# kgCO2e por litro
DIESEL_LITRO        = 2.6847
GASOLINA_LITRO      = 2.3120
GAS_NATURAL_V_LITRO = 1.8960   # equivalente líquido GNV
BIODIESEL_LITRO     = 1.9100   # B100; reducción neta vs diésel

# ── Logística / transporte de carga ──────────────────────────────
# kgCO2e por tonelada-km (tkm)
LOGISTICA_TERRESTRE = 0.0711   # camión diésel promedio
LOGISTICA_AEREO     = 0.6020   # avión carga
LOGISTICA_MARITIMO  = 0.0116   # barco portacontenedores
LOGISTICA_TREN      = 0.0280   # ferrocarril eléctrico Colombia

# ── Compras / consumibles (GHG Protocol Scope 3 / Ecoinvent) ─────
# kgCO2e por kg de producto
CONSUMIBLE_PAPEL         = 1.8400   # papel bond A4
CONSUMIBLE_PLASTICO      = 3.1400   # plástico genérico
CONSUMIBLE_QUIMICO       = 2.5000   # insumo químico industrial (promedio)
CONSUMIBLE_ALIMENTO      = 1.2000   # alimento procesado (promedio)
CONSUMIBLE_ELECTRONICO   = 22.000   # equipo electrónico (incluye fabricación)
CONSUMIBLE_OTRO          = 1.5000   # genérico

# Multiplicador por origen importado (transporte adicional)
FACTOR_IMPORTADO         = 1.15

# ── Residuos (IPCC / IDEAM) ──────────────────────────────────────
# kgCO2e por kg de residuo según disposición
RESIDUO_RELLENO          = 0.5820   # CH4 relleno sanitario
RESIDUO_RECICLAJE        = 0.0210   # proceso reciclaje
RESIDUO_COMPOSTAJE       = 0.1100   # compostaje aerobio
RESIDUO_INCINERACION     = 0.6800   # incineración con recuperación
RESIDUO_GESTOR_RESPEL    = 0.3500   # tratamiento especializado RESPEL
RESIDUO_OTRO             = 0.4500   # promedio genérico

# ── Mapas de lookup ───────────────────────────────────────────────

FACTOR_ENERGIA = {
    'electrica':   ELECTRICIDAD_RED_CO,
    'solar':       ELECTRICIDAD_SOLAR,
    'gas_natural': GAS_NATURAL_KWH,
    'glp':         GLP_KWH,
    'otro':        0.2500,  # genérico
}

FACTOR_COMBUSTIBLE = {
    'diesel':       DIESEL_LITRO,
    'gasolina':     GASOLINA_LITRO,
    'gas_natural_v':GAS_NATURAL_V_LITRO,
    'biodiesel':    BIODIESEL_LITRO,
    'otro':         2.3000,
}

FACTOR_LOGISTICA = {
    'terrestre': LOGISTICA_TERRESTRE,
    'aereo':     LOGISTICA_AEREO,
    'maritimo':  LOGISTICA_MARITIMO,
    'tren':      LOGISTICA_TREN,
    'otro':      LOGISTICA_TERRESTRE,  # conservador
}

FACTOR_CONSUMIBLE = {
    'papel':       CONSUMIBLE_PAPEL,
    'plasticos':   CONSUMIBLE_PLASTICO,
    'quimicos':    CONSUMIBLE_QUIMICO,
    'alimentos':   CONSUMIBLE_ALIMENTO,
    'electronico': CONSUMIBLE_ELECTRONICO,
    'otro':        CONSUMIBLE_OTRO,
}

FACTOR_RESIDUO = {
    'relleno':           RESIDUO_RELLENO,
    'reciclaje':         RESIDUO_RECICLAJE,
    'compostaje':        RESIDUO_COMPOSTAJE,
    'incineracion':      RESIDUO_INCINERACION,
    'gestor_autorizado': RESIDUO_GESTOR_RESPEL,
    'otro':              RESIDUO_OTRO,
}
