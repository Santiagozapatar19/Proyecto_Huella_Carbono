// Componente reutilizable para campos de formulario
export function FormField({ label, error, required, children }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Input({ label, error, required, ...props }) {
  return (
    <FormField label={label} error={error} required={required}>
      <input className={`input ${error ? 'border-red-400' : ''}`} {...props} />
    </FormField>
  )
}

export function Select({ label, error, required, options, placeholder, ...props }) {
  return (
    <FormField label={label} error={error} required={required}>
      <select className={`input ${error ? 'border-red-400' : ''}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </FormField>
  )
}

export function Textarea({ label, error, required, ...props }) {
  return (
    <FormField label={label} error={error} required={required}>
      <textarea className={`input resize-none ${error ? 'border-red-400' : ''}`} rows={3} {...props} />
    </FormField>
  )
}
