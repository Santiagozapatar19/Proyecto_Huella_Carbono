"""
HU-10: Generación y exportación de reportes.
Genera reportes en CSV y PDF con el resumen de huella, costos e iniciativas.
"""
import csv
import io
from datetime import date
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, inline_serializer
from drf_spectacular.types import OpenApiTypes
from rest_framework import serializers
from apps.recoleccion.models import Periodo
from apps.calculo.models import ResultadoCalculo
from apps.reduccion.models import PlanReduccion, Iniciativa
from apps.visualizacion.models import Anomalia


class ReporteHuellaCSV(APIView):
    """
    HU-10: Exporta la huella de carbono de todos los períodos en CSV.
    GET /api/reportes/huella/csv/
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.BINARY})
    def get(self, request):
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="huella_carbono_{date.today()}.csv"'
        response.write('\ufeff')  # BOM para Excel

        writer = csv.writer(response)
        writer.writerow([
            'Período', 'Año', 'Mes',
            'Total tCO₂e', 'Energía tCO₂e', 'Combustible tCO₂e',
            'Logística tCO₂e', 'Compras tCO₂e', 'Residuos tCO₂e',
        ])

        calculos = ResultadoCalculo.objects.select_related('periodo').order_by('periodo__anio', 'periodo__mes')
        for c in calculos:
            writer.writerow([
                str(c.periodo), c.periodo.anio, c.periodo.mes,
                c.total_tco2e, c.energia_tco2e, c.combustible_tco2e,
                c.logistica_tco2e, c.compras_tco2e, c.residuos_tco2e,
            ])
        return response


class ReporteIniciativasCSV(APIView):
    """
    HU-10: Exporta el plan de reducción e iniciativas en CSV.
    GET /api/reportes/iniciativas/csv/
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.BINARY})
    def get(self, request):
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="iniciativas_{date.today()}.csv"'
        response.write('\ufeff')

        writer = csv.writer(response)
        writer.writerow([
            'Plan', 'Iniciativa', 'Fuente', 'Área', 'Sede',
            'Impacto (1-5)', 'Factibilidad (1-5)', 'Score',
            'Costo estimado COP', 'Reducción estimada tCO₂e',
            'Reducción real tCO₂e', 'Estado',
            'Fecha inicio plan', 'Fecha fin plan',
            'Fecha inicio real', 'Fecha fin real', 'Responsable',
        ])

        for ini in Iniciativa.objects.select_related('plan', 'responsable').order_by('plan__nombre', '-impacto'):
            writer.writerow([
                ini.plan.nombre, ini.nombre, ini.fuente_impacto,
                ini.area, ini.sede, ini.impacto, ini.factibilidad,
                ini.score_priorizacion, ini.costo_estimado_cop or '',
                ini.reduccion_estimada_tco2e, ini.reduccion_real_tco2e or '',
                ini.estado, ini.fecha_inicio_plan, ini.fecha_fin_plan,
                ini.fecha_inicio_real or '', ini.fecha_fin_real or '',
                str(ini.responsable) if ini.responsable else '',
            ])
        return response


class ReporteAnomaliasCsv(APIView):
    """
    HU-10: Exporta las anomalías detectadas en CSV.
    GET /api/reportes/anomalias/csv/
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.BINARY})
    def get(self, request):
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="anomalias_{date.today()}.csv"'
        response.write('\ufeff')

        writer = csv.writer(response)
        writer.writerow([
            'Período', 'Fuente', 'Severidad', 'Estado',
            'Descripción', 'Área', 'Sede',
            'Valor actual', 'Valor promedio', 'Desviación %', 'Unidad',
            'Comentario', 'Detectada el',
        ])

        for a in Anomalia.objects.select_related('periodo').order_by('-desviacion_pct'):
            writer.writerow([
                str(a.periodo), a.fuente, a.severidad, a.estado,
                a.descripcion, a.area, a.sede,
                a.valor_actual, a.valor_promedio, a.desviacion_pct, a.unidad,
                a.comentario, a.detectada_en.strftime('%Y-%m-%d %H:%M'),
            ])
        return response


class ReporteEjecutivoPDF(APIView):
    """
    HU-10: Reporte ejecutivo completo en PDF.
    GET /api/reportes/ejecutivo/pdf/
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.BINARY})
    def get(self, request):
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import cm
            from reportlab.lib import colors
            from reportlab.platypus import (
                SimpleDocTemplate, Paragraph, Spacer, Table,
                TableStyle, HRFlowable,
            )
            from reportlab.lib.enums import TA_CENTER, TA_LEFT
        except ImportError:
            return Response({'detail': 'reportlab no instalado. Ejecuta: pip install reportlab'}, status=500)

        buffer   = io.BytesIO()
        doc      = SimpleDocTemplate(buffer, pagesize=A4,
                                     rightMargin=2*cm, leftMargin=2*cm,
                                     topMargin=2*cm, bottomMargin=2*cm)
        styles   = getSampleStyleSheet()
        story    = []

        # ── Colores ──────────────────────────────────────────────
        VERDE    = colors.HexColor('#16a34a')
        GRIS_OSC = colors.HexColor('#1e293b')
        GRIS_CLA = colors.HexColor('#f1f5f9')

        # ── Estilos personalizados ────────────────────────────────
        estilo_titulo = ParagraphStyle('titulo', parent=styles['Title'],
                                       textColor=GRIS_OSC, fontSize=20, spaceAfter=6)
        estilo_subtit = ParagraphStyle('subtit', parent=styles['Heading2'],
                                       textColor=VERDE, fontSize=13, spaceBefore=14, spaceAfter=6)
        estilo_normal = styles['Normal']
        estilo_small  = ParagraphStyle('small', parent=styles['Normal'], fontSize=8, textColor=colors.grey)

        # ── Encabezado ────────────────────────────────────────────
        story.append(Paragraph('Reporte Ejecutivo', estilo_titulo))
        story.append(Paragraph('Sistema de Gestión de Huella de Carbono', estilo_small))
        story.append(Paragraph(f'Generado el {date.today().strftime("%d/%m/%Y")} por {request.user.get_full_name() or request.user.email}', estilo_small))
        story.append(HRFlowable(width='100%', thickness=2, color=VERDE, spaceAfter=12))

        # ── 1. Resumen de huella ──────────────────────────────────
        story.append(Paragraph('1. Huella de Carbono por Período', estilo_subtit))
        calculos = ResultadoCalculo.objects.select_related('periodo').order_by('periodo__anio', 'periodo__mes')

        if calculos.exists():
            datos_tabla = [[
                'Período', 'Total tCO₂e', 'Energía', 'Combustible',
                'Logística', 'Compras', 'Residuos'
            ]]
            for c in calculos:
                datos_tabla.append([
                    str(c.periodo),
                    f'{float(c.total_tco2e):.3f}',
                    f'{float(c.energia_tco2e):.3f}',
                    f'{float(c.combustible_tco2e):.3f}',
                    f'{float(c.logistica_tco2e):.3f}',
                    f'{float(c.compras_tco2e):.3f}',
                    f'{float(c.residuos_tco2e):.3f}',
                ])

            tabla = Table(datos_tabla, repeatRows=1)
            tabla.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), VERDE),
                ('TEXTCOLOR',  (0,0), (-1,0), colors.white),
                ('FONTSIZE',   (0,0), (-1,0), 9),
                ('FONTSIZE',   (0,1), (-1,-1), 8),
                ('BACKGROUND', (0,1), (-1,-1), GRIS_CLA),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, GRIS_CLA]),
                ('GRID',       (0,0), (-1,-1), 0.5, colors.lightgrey),
                ('ALIGN',      (1,0), (-1,-1), 'RIGHT'),
                ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
            ]))
            story.append(tabla)
        else:
            story.append(Paragraph('Sin cálculos de huella registrados.', estilo_normal))

        story.append(Spacer(1, 0.5*cm))

        # ── 2. Anomalías ──────────────────────────────────────────
        story.append(Paragraph('2. Anomalías Detectadas', estilo_subtit))
        anomalias = Anomalia.objects.select_related('periodo').order_by('-desviacion_pct')[:20]
        if anomalias.exists():
            datos_an = [['Período','Fuente','Severidad','Desviación %','Descripción']]
            for a in anomalias:
                datos_an.append([
                    str(a.periodo), a.fuente, a.severidad.upper(),
                    f'{float(a.desviacion_pct):.1f}%',
                    a.descripcion[:60],
                ])
            tabla_an = Table(datos_an, repeatRows=1, colWidths=[2*cm,2.5*cm,2*cm,2.5*cm,None])
            tabla_an.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), GRIS_OSC),
                ('TEXTCOLOR',  (0,0), (-1,0), colors.white),
                ('FONTSIZE',   (0,0), (-1,-1), 8),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, GRIS_CLA]),
                ('GRID',       (0,0), (-1,-1), 0.5, colors.lightgrey),
            ]))
            story.append(tabla_an)
        else:
            story.append(Paragraph('Sin anomalías registradas.', estilo_normal))

        story.append(Spacer(1, 0.5*cm))

        # ── 3. Iniciativas de reducción ───────────────────────────
        story.append(Paragraph('3. Plan de Reducción — Iniciativas', estilo_subtit))
        iniciativas = Iniciativa.objects.select_related('plan', 'responsable').order_by('-impacto')[:25]
        if iniciativas.exists():
            datos_ini = [['Iniciativa','Plan','Fuente','Estado','Est. tCO₂e','Real tCO₂e']]
            for ini in iniciativas:
                datos_ini.append([
                    ini.nombre[:35],
                    ini.plan.nombre[:20],
                    ini.fuente_impacto,
                    ini.estado,
                    f'{float(ini.reduccion_estimada_tco2e):.3f}',
                    f'{float(ini.reduccion_real_tco2e):.3f}' if ini.reduccion_real_tco2e else '—',
                ])
            tabla_ini = Table(datos_ini, repeatRows=1)
            tabla_ini.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), VERDE),
                ('TEXTCOLOR',  (0,0), (-1,0), colors.white),
                ('FONTSIZE',   (0,0), (-1,-1), 8),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, GRIS_CLA]),
                ('GRID',       (0,0), (-1,-1), 0.5, colors.lightgrey),
            ]))
            story.append(tabla_ini)
        else:
            story.append(Paragraph('Sin iniciativas registradas.', estilo_normal))

        # ── Pie de página ─────────────────────────────────────────
        story.append(Spacer(1, 1*cm))
        story.append(HRFlowable(width='100%', thickness=1, color=colors.lightgrey))
        story.append(Paragraph(
            'Documento generado automáticamente por el Sistema de Gestión de Huella de Carbono. '
            'Factores de emisión: UPME 2023, IPCC AR6, GHG Protocol.',
            estilo_small
        ))

        doc.build(story)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="reporte_ejecutivo_{date.today()}.pdf"'
        return response


class ResumenReportes(APIView):
    """
    Metadatos de los reportes disponibles para mostrar en el frontend.
    GET /api/reportes/
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses=inline_serializer(
            name='ResumenReportesResponse',
            fields={
                'reportes': serializers.ListField(
                    child=serializers.DictField(),
                )
            },
        )
    )
    def get(self, request):
        return Response({
            'reportes': [
                {
                    'id': 'huella_csv',
                    'nombre': 'Huella de Carbono por Período',
                    'descripcion': 'Resumen de emisiones tCO₂e por fuente y período',
                    'formato': 'CSV',
                    'url': '/api/reportes/huella/csv/',
                },
                {
                    'id': 'iniciativas_csv',
                    'nombre': 'Plan de Reducción — Iniciativas',
                    'descripcion': 'Estado y avance de todas las iniciativas de reducción',
                    'formato': 'CSV',
                    'url': '/api/reportes/iniciativas/csv/',
                },
                {
                    'id': 'anomalias_csv',
                    'nombre': 'Anomalías Detectadas',
                    'descripcion': 'Listado de consumos anómalos con severidad y estado',
                    'formato': 'CSV',
                    'url': '/api/reportes/anomalias/csv/',
                },
                {
                    'id': 'ejecutivo_pdf',
                    'nombre': 'Reporte Ejecutivo Completo',
                    'descripcion': 'Huella, anomalías e iniciativas en un PDF formateado',
                    'formato': 'PDF',
                    'url': '/api/reportes/ejecutivo/pdf/',
                },
            ]
        })
