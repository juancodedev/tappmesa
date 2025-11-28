import { useState, useEffect, useContext } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { useAuth } from '../../hooks/useAuth'
import { SuperAdminContext } from '../../context/SuperAdminContext'
import { supabase } from '../../lib/supabase'
import {
  Save,
  Percent,
  QrCode,
  AlertCircle,
  CheckCircle,
  FileText,
  Upload,
  ExternalLink,
  Building2
} from 'lucide-react'

const PreBillSettings = () => {
  const { user, isSuperAdmin } = useAuth()
  const { tenant, loading: tenantLoading, loadTenant } = useTenant()
  const superAdminContext = useContext(SuperAdminContext)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Pre-bill settings
  const [tipPercentage, setTipPercentage] = useState(10.0)

  // Survey settings
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveyUrl, setSurveyUrl] = useState('')
  const [benefitText, setBenefitText] = useState('')
  const [surveyActive, setSurveyActive] = useState(true)

  // Load settings when tenant changes
  useEffect(() => {
    // Para super admin, usar el tenant seleccionado del contexto
    // Para admin regular, usar el tenant del contexto o del usuario
    const effectiveTenant = isSuperAdmin
      ? superAdminContext?.selectedTenant
      : (tenant || user?.tenant)

    if (effectiveTenant) {
      loadSettings(effectiveTenant)
    }
  }, [tenant, user?.tenant, superAdminContext?.selectedTenant, isSuperAdmin])

  const loadSettings = async (tenantData) => {
    try {
      console.log('📥 Cargando configuración de tenant:', {
        tenant_id: tenantData.id,
        tenant_name: tenantData.name,
        tip_percentage_from_db: tenantData.tip_percentage,
        show_survey_from_db: tenantData.show_survey
      })

      // Load tenant pre-bill settings
      // Manejar el tipo Decimal de PostgreSQL que puede venir como string
      let tipValue = 10.0
      if (tenantData.tip_percentage !== null && tenantData.tip_percentage !== undefined) {
        tipValue = typeof tenantData.tip_percentage === 'string'
          ? parseFloat(tenantData.tip_percentage)
          : parseFloat(tenantData.tip_percentage)
      }

      const surveyValue = tenantData.show_survey || false

      console.log('📝 Estableciendo valores en estado:', {
        tipPercentage: tipValue,
        showSurvey: surveyValue
      })

      setTipPercentage(tipValue)
      setShowSurvey(surveyValue)

      // Load survey configuration if exists
      const { data: survey, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .maybeSingle() // Use maybeSingle() instead of single() to handle 0 results

      if (!error && survey) {
        setSurveyUrl(survey.survey_url || '')
        setBenefitText(survey.benefit_text || '')
        setSurveyActive(survey.is_active ?? true)
        console.log('✅ Configuración de encuesta cargada:', survey)
      } else {
        // Reset to defaults if no survey exists
        setSurveyUrl('')
        setBenefitText('')
        setSurveyActive(true)
        console.log('ℹ️ No hay configuración de encuesta guardada, usando valores por defecto')
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error)
    }
  }

  const handleSave = async () => {
    // Usar el tenant efectivo según el tipo de usuario
    const effectiveTenant = isSuperAdmin
      ? superAdminContext?.selectedTenant
      : (tenant || user?.tenant)

    // Validar que tenant esté cargado
    if (!effectiveTenant || !effectiveTenant.id) {
      console.error('Error: Tenant not loaded yet')
      alert('Error: No se ha cargado la información del local. Por favor, recarga la página.')
      return
    }

    try {
      setLoading(true)

      console.log('💾 Guardando configuración:', {
        tenant_id: effectiveTenant.id,
        tenant_name: effectiveTenant.name,
        tip_percentage: parseFloat(tipPercentage),
        show_survey: showSurvey
      })

      // Update tenant settings
      const { data: updatedData, error: tenantError } = await supabase
        .from('tenants')
        .update({
          tip_percentage: parseFloat(tipPercentage),
          show_survey: showSurvey,
          updated_at: new Date().toISOString()
        })
        .eq('id', effectiveTenant.id)
        .select()

      if (tenantError) {
        console.error('❌ Error al actualizar tenant:', tenantError)
        throw tenantError
      }

      console.log('✅ Tenant actualizado exitosamente:', updatedData)

      // Update or create survey configuration
      if (showSurvey) {
        const { data: existingSurvey } = await supabase
          .from('surveys')
          .select('id')
          .eq('tenant_id', effectiveTenant.id)
          .maybeSingle() // Use maybeSingle() instead of single()

        const surveyData = {
          tenant_id: effectiveTenant.id,
          survey_url: surveyUrl || null,
          benefit_text: benefitText || null,
          is_active: surveyActive,
          updated_at: new Date().toISOString()
        }

        if (existingSurvey) {
          // Update existing
          console.log('📝 Actualizando encuesta existente:', existingSurvey.id)
          const { error } = await supabase
            .from('surveys')
            .update(surveyData)
            .eq('id', existingSurvey.id)

          if (error) throw error
        } else {
          // Create new
          console.log('✨ Creando nueva encuesta')
          const { error } = await supabase
            .from('surveys')
            .insert([surveyData])

          if (error) throw error
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)

      // Reload tenant data
      if (loadTenant) {
        loadTenant()
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error al guardar configuraciones')
    } finally {
      setLoading(false)
    }
  }

  // Determinar el tenant efectivo según el tipo de usuario
  const effectiveTenant = isSuperAdmin
    ? superAdminContext?.selectedTenant
    : (tenant || user?.tenant)

  // Mostrar estado de carga mientras se carga el tenant
  if (tenantLoading && !effectiveTenant && !isSuperAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando configuración...</p>
          </div>
        </div>
      </div>
    )
  }

  // Si es super admin y no hay tenant seleccionado, mostrar mensaje
  if (isSuperAdmin && !effectiveTenant) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Building2 className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-blue-900 font-semibold mb-2">Selecciona un Local</h3>
              <p className="text-blue-700 text-sm">
                Utiliza el selector de local en la parte superior de la página para configurar las pre-cuentas de un local específico.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar error si no hay tenant (solo para admins regulares)
  if (!effectiveTenant && !isSuperAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-900 font-semibold mb-2">Error al cargar la información</h3>
              <p className="text-red-700 text-sm">
                No se pudo cargar la información del local. Por favor, recarga la página o contacta a soporte si el problema persiste.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-amber-700 text-white rounded-lg text-sm transition-colors"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Pre-Cuentas</h1>
          <p className="text-gray-600 mt-1">
            {effectiveTenant && isSuperAdmin && (
              <span className="font-medium text-orange-600">
                {effectiveTenant.name} - {' '}
              </span>
            )}
            Personaliza las pre-cuentas y encuestas de satisfacción
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !effectiveTenant}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          } ${loading || !effectiveTenant ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Save className="h-4 w-4" />
          <span>
            {loading ? 'Guardando...' : saved ? 'Guardado ✓' : 'Guardar Cambios'}
          </span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Pre-Bill Settings */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-orange-600" />
            Configuración de Pre-Cuentas
          </h2>

          <div className="space-y-4">
            {/* Tip Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Percent className="h-4 w-4 inline mr-1" />
                Porcentaje de Propina Sugerido
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={tipPercentage}
                  onChange={(e) => setTipPercentage(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="text-gray-600">%</span>
                <span className="text-sm text-gray-500">
                  Este porcentaje se aplicará por defecto en todas las pre-cuentas
                </span>
              </div>

              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Nota:</strong> El cliente siempre puede modificar el porcentaje al momento de recibir la pre-cuenta.
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Vista previa del cálculo:</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">$10.000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Propina ({tipPercentage}%):</span>
                  <span className="font-medium">
                    ${Math.round(10000 * (parseFloat(tipPercentage) / 100)).toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300 text-base">
                  <span className="font-semibold">TOTAL:</span>
                  <span className="font-bold text-orange-600">
                    ${(10000 + Math.round(10000 * (parseFloat(tipPercentage) / 100))).toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Survey Settings */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <QrCode className="h-5 w-5 mr-2 text-orange-600" />
              Encuesta de Satisfacción
            </h2>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSurvey}
                onChange={(e) => setShowSurvey(e.target.checked)}
                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Mostrar encuesta en pre-cuentas
              </span>
            </label>
          </div>

          {showSurvey && (
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-900">
                  <p className="font-medium">Esta funcionalidad requiere un plan premium</p>
                  <p className="mt-1">
                    Si tu plan actual no incluye encuestas, contáctanos para actualizar tu suscripción.
                  </p>
                </div>
              </div>

              {/* Survey URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de la Encuesta
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    value={surveyUrl}
                    onChange={(e) => setSurveyUrl(e.target.value)}
                    placeholder="https://forms.google.com/..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {surveyUrl && (
                    <a
                      href={surveyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Probar</span>
                    </a>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Puedes usar Google Forms, Typeform, o cualquier servicio de encuestas online
                </p>
              </div>

              {/* Benefit Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto del Beneficio
                </label>
                <input
                  type="text"
                  value={benefitText}
                  onChange={(e) => setBenefitText(e.target.value)}
                  placeholder="Ej: ¡10% de descuento en tu próxima visita!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Este texto aparecerá junto al código QR de la encuesta
                </p>
              </div>

              {/* Active toggle */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={surveyActive}
                    onChange={(e) => setSurveyActive(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">
                    Encuesta activa (desmarcar para pausar temporalmente)
                  </span>
                </label>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Vista previa en pre-cuenta:</p>
                <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                      <QrCode className="h-20 w-20 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Escanea para responder nuestra encuesta
                      </p>
                      {benefitText && (
                        <p className="text-xs text-orange-600 font-medium">
                          {benefitText}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-2">Información importante:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Las pre-cuentas incluyen automáticamente la información de la mesa, mesero y productos</li>
              <li>El porcentaje de propina es editable al momento de generar la pre-cuenta</li>
              <li>Las encuestas ayudan a mejorar la calidad del servicio y fidelizar clientes</li>
              <li>Puedes generar códigos QR directos a tu encuesta desde el panel de mesas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreBillSettings
