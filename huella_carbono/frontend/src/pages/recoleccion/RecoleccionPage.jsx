import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Zap, Fuel, Package, Trash2, RefreshCw } from 'lucide-react'
import DataTable from '../../components/DataTable'
import FormEnergia from './FormEnergia'
import FormCombustible from './FormCombustible'
import FormCompras from './FormCompras'
import FormResiduos from './FormResiduos'
import {
  getEnergia, deleteEnergia,
  getCombustible, deleteCombustible,
  getCompras, deleteCompras,
  getResiduos, deleteResiduos,
} from '../../services/recoleccion'

const TABS = [
  { id: 'energia',     label: 'Energía',     icon: Zap,     color: 'text-yellow-600 bg-yellow-50' },
  { id: 'combustible', label: 'Combustible', icon: Fuel,    color: 'text-orange-600 bg-orange-50' },
  { id: 'compras',     label: 'Compras',     icon: Package, color: 'text-blue-600 bg-blue-50' },
  { id: 'residuos',    label: 'Residuos',    icon: Trash2,  color: 'text-red-600 bg-red-50' },
]

// ── Columnas por tab ──────────────────────────────────────────────
const COLS = {
  energia: [
    { key: 'periodo_label', label: 'Período' },
    { key: 'tipo_energia',  label: 'Tipo' },
    { key: 'sede',          label: 'Sede' },
    { key: 'area',          label: 'Área' },
    { key: 'consumo_kwh',   label: 'kWh', render: v => Number(v).toLocaleString('es-CO') },
    { key: 'costo_cop',     label: 'Costo COP', render: v => v ? `$${Number(v).toLocaleString('es-CO')}` : '—' },
  ],
  combustible: [
    { key: 'periodo_label',    label: 'Período' },
    { key: 'tipo_combustible', label: 'Combustible' },
    { key: 'placa_o_equipo',   label: 'Placa/Equipo' },
    { key: 'area',             label: 'Área' },
    { key: 'cantidad_litros',  label: 'Litros', render: v => Number(v).toLocaleString('es-CO') },
  ],
  compras: [
    { key: 'periodo_label', label: 'Período' },
    { key: 'categoria',     label: 'Categoría' },
    { key: 'descripcion',   label: 'Artículo' },
    { key: 'cantidad',      label: 'Cantidad', render: (v, r) => `${Number(v).toLocaleString('es-CO')} ${r.unidad}` },
    { key: 'peso_total_kg', label: 'Peso (kg)', render: v => v ? Number(v).toLocaleString('es-CO') : '—' },
  ],
  residuos: [
    { key: 'periodo_label',      label: 'Período' },
    { key: 'tipo_residuo',       label: 'Tipo' },
    { key: 'area',               label: 'Área' },
    { key: 'cantidad_kg',        label: 'kg', render: v => Number(v).toLocaleString('es-CO') },
    { key: 'metodo_disposicion', label: 'Disposición' },
  ],
}

const FETCHERS = { energia: getEnergia, combustible: getCombustible, compras: getCompras, residuos: getResiduos }
const DELETERS = { energia: deleteEnergia, combustible: deleteCombustible, compras: deleteCompras, residuos: deleteResiduos }
const FORMS    = { energia: FormEnergia, combustible: FormCombustible, compras: FormCompras, residuos: FormResiduos }

export default function RecoleccionPage() {
  const [tab, setTab]           = useState('energia')
  const [showForm, setShowForm] = useState(false)
  const [editReg, setEditReg]   = useState(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: [tab],
    queryFn: () => FETCHERS[tab]().then(r => r.data.results || r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => DELETERS[tab](id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [tab] }); toast.success('Eliminado') },
    onError: () => toast.error('No se pudo eliminar'),
  })

  const handleDelete = (row) => {
    if (window.confirm(`¿Eliminar este registro?`)) deleteMutation.mutate(row.id)
  }

  const handleEdit = (row) => { setEditReg(row); setShowForm(true) }
  const handleNew  = ()    => { setEditReg(null); setShowForm(true) }
  const handleClose= ()    => { setShowForm(false); setEditReg(null) }

  const ActiveForm = FORMS[tab]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-carbon-800">Recolección de Datos</h1>
          <p className="text-carbon-200 mt-1 text-sm">HU-01 al HU-04 · Ingreso manual de fuentes de emisión</p>
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo registro
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-carbon-50 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white shadow-sm text-carbon-800' : 'text-carbon-200 hover:text-carbon-800'
            }`}
          >
            <span className={`p-1 rounded-md ${tab === id ? color : ''}`}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-carbon-200">
            {Array.isArray(data) ? `${data.length} registros` : ''}
          </p>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: [tab] })}
            className="p-2 rounded-lg text-carbon-200 hover:text-carbon-800 hover:bg-carbon-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <DataTable
          columns={COLS[tab]}
          data={Array.isArray(data) ? data : data?.results || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={isLoading}
        />
      </div>

      {/* Modal formulario */}
      {showForm && <ActiveForm registro={editReg} onClose={handleClose} />}
    </div>
  )
}
