import { useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, Download, FileSpreadsheet, Loader2, CheckCircle } from 'lucide-react'
import {
  descargarHuellaCSV, descargarIniciativasCSV,
  descargarAnomaliasCSV, descargarEjecutivoPDF,
} from '../../services/reportes'

const REPORTES = [
  {
    id: 'huella_csv',
    nombre: 'Huella de Carbono por Período',
    descripcion: 'Exporta la tabla completa de emisiones en tCO₂e por fuente (energía, combustible, logística, compras y residuos) para cada período calculado.',
    formato: 'CSV',
    icono: FileSpreadsheet,
    color: 'text-green-600 bg-green-50 border-green-200',
    fn: descargarHuellaCSV,
  },
  {
    id: 'iniciativas_csv',
    nombre: 'Plan de Reducción — Iniciativas',
    descripcion: 'Exporta todas las iniciativas con su estado de avance, fechas planificadas y reales, reducción estimada vs real y score de priorización.',
    formato: 'CSV',
    icono: FileSpreadsheet,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    fn: descargarIniciativasCSV,
  },
  {
    id: 'anomalias_csv',
    nombre: 'Anomalías Detectadas',
    descripcion: 'Listado de consumos anómalos con severidad, % de desviación, estado de revisión y comentarios del responsable.',
    formato: 'CSV',
    icono: FileSpreadsheet,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    fn: descargarAnomaliasCSV,
  },
  {
    id: 'ejecutivo_pdf',
    nombre: 'Reporte Ejecutivo Completo',
    descripcion: 'PDF formateado con la huella por período, anomalías detectadas y estado de las iniciativas de reducción. Listo para presentar a la dirección.',
    formato: 'PDF',
    icono: FileText,
    color: 'text-red-600 bg-red-50 border-red-200',
    fn: descargarEjecutivoPDF,
  },
]

function TarjetaReporte({ reporte }) {
  const [loading, setLoading]   = useState(false)
  const [descargado, setDescargado] = useState(false)
  const Icon = reporte.icono

  const handleDescargar = async () => {
    setLoading(true)
    try {
      await reporte.fn()
      setDescargado(true)
      toast.success(`${reporte.nombre} descargado`)
      setTimeout(() => setDescargado(false), 3000)
    } catch (e) {
      toast.error('Error al generar el reporte. Verifica que haya datos cargados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`card border-2 ${reporte.color} flex flex-col gap-4`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl border ${reporte.color} flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-carbon-800">{reporte.nombre}</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${reporte.color}`}>
              {reporte.formato}
            </span>
          </div>
          <p className="text-sm text-carbon-200 mt-1 leading-relaxed">{reporte.descripcion}</p>
        </div>
      </div>

      <button
        onClick={handleDescargar}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all ${
          descargado
            ? 'bg-green-50 border-green-300 text-green-700'
            : `${reporte.color} hover:opacity-80`
        }`}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
        ) : descargado ? (
          <><CheckCircle className="w-4 h-4" /> Descargado</>
        ) : (
          <><Download className="w-4 h-4" /> Descargar {reporte.formato}</>
        )}
      </button>
    </div>
  )
}

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-carbon-800">Generación de Reportes</h1>
        <p className="text-carbon-200 text-sm mt-1">HU-10 · Exporta los datos del sistema en CSV y PDF</p>
      </div>

      {/* Info */}
      <div className="card bg-blue-50 border-blue-200 border">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">¿Qué incluyen los reportes?</p>
            <p className="text-sm text-blue-700 mt-1">
              Los reportes se generan en tiempo real con todos los datos cargados en el sistema.
              Los CSV son compatibles con Excel y Google Sheets.
              El PDF está formateado para presentaciones ejecutivas e incluye encabezado con fecha y usuario.
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas de reportes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {REPORTES.map(r => <TarjetaReporte key={r.id} reporte={r} />)}
      </div>

      {/* Nota sobre trazabilidad */}
      <div className="card bg-carbon-50">
        <p className="text-xs text-carbon-200">
          <strong>Trazabilidad:</strong> Cada reporte incluye metadatos de generación (fecha, usuario, versión del sistema).
          Los factores de emisión aplicados son: UPME 2023 (red eléctrica Colombia), IPCC AR6 y GHG Protocol (combustibles),
          EPA/Ecoinvent (logística y consumibles) e IDEAM (residuos). Los reportes son de soporte interno y no reemplazan
          una auditoría certificada externa.
        </p>
      </div>
    </div>
  )
}
