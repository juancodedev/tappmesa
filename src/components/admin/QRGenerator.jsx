import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { QrCode, Download, Eye, Copy, Check, ArrowLeft } from 'lucide-react'

const QRGenerator = ({ tenantId }) => {
  const [searchParams] = useSearchParams()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState(null)
  const [copiedCode, setCopiedCode] = useState(null)
  
  // Obtener parámetro de mesa específica de la URL
  const tableParam = searchParams.get('table')

  useEffect(() => {
    loadTables()
  }, [tenantId])

  useEffect(() => {
    // Si hay un parámetro de mesa en la URL, seleccionar esa mesa
    if (tableParam && tables.length > 0) {
      const table = tables.find(t => t.id.toString() === tableParam || t.number === `Mesa ${tableParam}`)
      if (table) {
        setSelectedTable(table)
      }
    }
  }, [tableParam, tables])

  const loadTables = async () => {
    try {
      setLoading(true)
      
      // Intentar cargar desde Supabase primero
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('is_active', true)
        .order('number')

      if (error) {
        console.warn('No se pudo cargar desde Supabase, usando datos de ejemplo:', error)
        // Usar datos de ejemplo si falla Supabase
        setTables([
          { id: 1, number: 'Mesa 1', capacity: 2, location: 'interior', unique_code: 'ABCD1234', is_active: true },
          { id: 2, number: 'Mesa 2', capacity: 4, location: 'interior', unique_code: 'EFGH5678', is_active: true },
          { id: 3, number: 'Mesa 3', capacity: 6, location: 'terraza', unique_code: 'IJKL9012', is_active: true },
          { id: 4, number: 'Mesa 4', capacity: 2, location: 'barra', unique_code: 'MNOP3456', is_active: true },
          { id: 5, number: 'Mesa 5', capacity: 4, location: 'interior', unique_code: 'QRST7890', is_active: true },
          { id: 6, number: 'Mesa 6', capacity: 6, location: 'terraza', unique_code: 'UVWX1234', is_active: true },
        ])
      } else {
        setTables(data || [])
      }
    } catch (error) {
      console.error('Error loading tables:', error)
      // Datos de ejemplo como fallback
      setTables([
        { id: 1, number: 'Mesa 1', capacity: 2, location: 'interior', unique_code: 'ABCD1234', is_active: true },
        { id: 2, number: 'Mesa 2', capacity: 4, location: 'interior', unique_code: 'EFGH5678', is_active: true },
        { id: 3, number: 'Mesa 3', capacity: 6, location: 'terraza', unique_code: 'IJKL9012', is_active: true },
        { id: 4, number: 'Mesa 4', capacity: 2, location: 'barra', unique_code: 'MNOP3456', is_active: true },
      ])
    } finally {
      setLoading(false)
    }
  }

  const generateQRUrl = (table) => {
    // En desarrollo local
    const hostname = window.location.hostname
    if (hostname.includes('local') || hostname === 'localhost') {
      return `http://cafe-central.tappmesa.local:5173/${table.unique_code}/`
    }
    
    // En producción
    return `https://cafe-central.tappmesa.com/${table.unique_code}/`
  }

  const copyToClipboard = async (text, tableId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(tableId)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const downloadQR = (table) => {
    // Crear URL del QR usando un servicio externo
    const qrUrl = generateQRUrl(table)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`
    
    // Crear link de descarga
    const link = document.createElement('a')
    link.href = qrApiUrl
    link.download = `QR-${table.number.replace(/\s+/g, '_')}-${table.unique_code}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const previewQR = (table) => {
    setSelectedTable(table)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Códigos QR de Mesas</h1>
        <p className="text-gray-600">
          Genera y descarga códigos QR únicos para cada mesa. Los clientes pueden escanear estos códigos para acceder al menú.
        </p>
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((table) => {
          const qrUrl = generateQRUrl(table)
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`

          return (
            <div key={table.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{table.number}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    table.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {table.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {table.capacity} personas • {table.location}
                </p>
              </div>

              {/* QR Code */}
              <div className="p-4 text-center">
                <img 
                  src={qrImageUrl} 
                  alt={`QR Code para ${table.number}`}
                  className="mx-auto mb-4 rounded-lg shadow-sm"
                  width={150}
                  height={150}
                />
                
                {/* Código único */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Código único:</p>
                  <div className="flex items-center justify-center space-x-2">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {table.unique_code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(table.unique_code, table.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copiar código"
                    >
                      {copiedCode === table.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* URL */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">URL:</p>
                  <div className="flex items-center justify-center space-x-2">
                    <code className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded max-w-full truncate">
                      {qrUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(qrUrl, `url_${table.id}`)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copiar URL"
                    >
                      {copiedCode === `url_${table.id}` ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex space-x-2">
                  <button
                    onClick={() => previewQR(table)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Vista previa</span>
                  </button>
                  <button
                    onClick={() => downloadQR(table)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de vista previa */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                QR Code - {selectedTable.number}
              </h3>
              
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generateQRUrl(selectedTable))}`}
                alt={`QR Code para ${selectedTable.number}`}
                className="mx-auto mb-4 rounded-lg shadow-lg"
                width={250}
                height={250}
              />
              
              <div className="text-sm text-gray-600 mb-6">
                <p className="mb-2">Código: <code className="bg-gray-100 px-2 py-1 rounded">{selectedTable.unique_code}</code></p>
                <p>URL: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{generateQRUrl(selectedTable)}</code></p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => downloadQR(selectedTable)}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Descargar QR
                </button>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Instrucciones</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Descarga los códigos QR e imprímelos en formato A5 o A4</li>
          <li>• Coloca cada QR en su mesa correspondiente</li>
          <li>• Los clientes escanean el código y acceden automáticamente al menú</li>
          <li>• Cada mesa tiene un código único por seguridad</li>
        </ul>
      </div>
    </div>
  )
}

export default QRGenerator