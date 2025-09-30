//este es el login correcto

import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Coffee
} from 'lucide-react'

const LoginPage = () => {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  const from = location.state?.from?.pathname || '/admin'

  // Función para generar URL del tenant
  const generateTenantAdminUrl = (tenant) => {
    if (!tenant) return '/admin'

    const hostname = window.location.hostname
    const protocol = window.location.protocol
    const port = window.location.port

    // En desarrollo local con .local
    if (hostname.endsWith('.local')) {
      const baseUrl = `${protocol}//${tenant.subdomain}.tappmesa.local${port ? ':' + port : ''}`
      return `${baseUrl}/admin`
    }

    // En desarrollo local con .localhost
    if (hostname.endsWith('.localhost')) {
      const baseUrl = `${protocol}//${tenant.subdomain}.localhost${port ? ':' + port : ''}`
      return `${baseUrl}/admin`
    }

    // En desarrollo con localhost - redirigir al subdominio correcto
    if (hostname === 'localhost' || hostname.match(/^\d/)) {
      const baseUrl = `${protocol}//${tenant.subdomain}.localhost${port ? ':' + port : ''}`
      return `${baseUrl}/admin`
    }

    // En producción con tappmesa.com
    if (hostname.includes('tappmesa.com')) {
      return `https://${tenant.subdomain}.tappmesa.com/admin`
    }

    // En producción con Vercel (tappmesa.vercel.app)
    if (hostname.includes('vercel.app')) {
      return `https://${tenant.subdomain}.tappmesa.vercel.app/admin`
    }

    // Otros dominios personalizados
    return `${protocol}//${tenant.subdomain}.${hostname}/admin`
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoginLoading(true)
    setErrors({})

    try {
      const result = await login(formData.email, formData.password)

      if (result.success && result.user) {
        // Si el usuario tiene un tenant, redirigir al subdominio del tenant
        if (result.user.tenant) {
          const tenantAdminUrl = generateTenantAdminUrl(result.user.tenant)
          window.location.href = tenantAdminUrl
        } else {
          // Si no tiene tenant (super admin), ir al admin normal
          navigate(from, { replace: true })
        }
      } else {
        setErrors({ form: result.error })
      }
    } catch (error) {
      setErrors({ form: 'Error inesperado. Intenta nuevamente.' })
    } finally {
      setLoginLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y título */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Coffee className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Panel de Administración
          </h2>
          <p className="mt-2 text-gray-600">
            Ingresa a tu cuenta para gestionar tu local
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error general */}
            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error de autenticación</h3>
                  <p className="text-sm text-red-700 mt-1">{errors.form}</p>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={loginLoading || loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loginLoading || loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Credenciales de prueba:</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <p><strong>Super Admin:</strong> admin@tappmesa.com / admin123</p>
              <p><strong>Café Central:</strong> cafe-central@cafe-central.com / admin123</p>
              <p><strong>Tetería Luna:</strong> teteria-luna@teteria-luna.com / admin123</p>
              <p><strong>Bistro Sunrise:</strong> bistro-sunrise@bistro-sunrise.com / admin123</p>
              <p><strong>Coffee & Co:</strong> coffee-co@coffee-co.com / admin123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            ¿Problemas para acceder?{' '}
            <a href="mailto:soporte@tappmesa.com" className="text-primary hover:text-red-700">
              Contacta soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage