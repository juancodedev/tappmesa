import { useState } from 'react'
import { Button } from '../../ui/Button'

const PERIODS = [
  { id: 'today', label: 'Hoy' },
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: 'custom', label: 'Personalizado' },
]

const PeriodFilter = ({ period, custom, onChange }) => {
  const [showCustom, setShowCustom] = useState(period === 'custom')
  const [draft, setDraft] = useState(custom)
  const invalid = !draft.from || !draft.to || draft.from > draft.to

  const choose = (id) => {
    if (id === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    onChange(id)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div role="group" aria-label="Período" className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
        {PERIODS.map(({ id, label }) => {
          // Pressed = the period the data on screen belongs to; opening the
          // custom form does not change it until Aplicar.
          const active = period === id
          return (
            <Button
              key={id}
              variant={active ? 'default' : 'ghost'}
              size="sm"
              aria-pressed={active}
              onClick={() => choose(id)}
            >
              {label}
            </Button>
          )
        })}
      </div>

      {showCustom && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!invalid) onChange('custom', draft)
          }}
        >
          <label className="flex flex-col text-xs font-medium text-gray-600">
            Desde
            <input
              type="date"
              value={draft.from}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
              className="mt-1 min-h-9 rounded-md border border-gray-300 px-2 text-sm text-gray-900"
            />
          </label>
          <label className="flex flex-col text-xs font-medium text-gray-600">
            Hasta
            <input
              type="date"
              value={draft.to}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
              className="mt-1 min-h-9 rounded-md border border-gray-300 px-2 text-sm text-gray-900"
            />
          </label>
          <Button type="submit" size="sm" disabled={invalid}>
            Aplicar
          </Button>
        </form>
      )}
    </div>
  )
}

export default PeriodFilter
