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
  Coffee,
  ArrowLeft
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
    const tenantSubdomain = tenant.subdomain || tenant.slug

    console.log('🔄 Generating tenant URL:', {
      hostname,
      protocol,
      port,
      tenantSubdomain,
      fullTenant: tenant
    })

    // En desarrollo local con .local
    if (hostname.endsWith('.local')) {
      const baseUrl = `${protocol}//${tenantSubdomain}.tappmesa.local${port ? ':' + port : ''}`
      console.log('📍 Local .local URL:', baseUrl)
      return `${baseUrl}/admin`
    }

    // En desarrollo local con .localhost
    if (hostname.endsWith('.localhost')) {
      const baseUrl = `${protocol}//${tenantSubdomain}.localhost${port ? ':' + port : ''}`
      console.log('📍 Local .localhost URL:', baseUrl)
      return `${baseUrl}/admin`
    }

    // En desarrollo con localhost o IP - redirigir al subdominio .localhost
    if (hostname === 'localhost' || hostname.match(/^\d/)) {
      const baseUrl = `${protocol}//${tenantSubdomain}.localhost${port ? ':' + port : ''}`
      console.log('📍 Localhost redirect URL:', baseUrl)
      return `${baseUrl}/admin`
    }

    // En producción con Vercel: formato [nombre]-tappmesa.vercel.app
    if (hostname.includes('.vercel.app')) {
      const url = `https://${tenantSubdomain}.vercel.app/admin`
      console.log('📍 Vercel production URL:', url)
      return url
    }

    // En producción con tappmesa.com
    if (hostname.includes('tappmesa.com')) {
      const url = `https://${tenantSubdomain}.tappmesa.com/admin`
      console.log('📍 Production tappmesa.com URL:', url)
      return url
    }

    // Otros dominios personalizados
    const url = `${protocol}//${tenantSubdomain}.${hostname}/admin`
    console.log('📍 Custom domain URL:', url)
    return url
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

  // Función para obtener ruta según rol del usuario
  const getRoleBasedRoute = (user) => {
    const role = user.role?.toLowerCase()

    switch (role) {
      case 'waiter':
      case 'mesero':
        return '/waiter'

      case 'kitchen':
      case 'chef':
      case 'cocinero':
        return '/kitchen'

      case 'tenant_admin':
      case 'admin':
      case 'super_admin':
        return '/admin'

      default:
        // Por defecto, ir al admin
        return '/admin'
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoginLoading(true)
    setErrors({})

    try {
      const result = await login(formData.email, formData.password)

      // console.log('Login result:', result)

      if (result.success && result.user) {
        // console.log('User tenant:', result.user.tenant)

        // Determinar ruta según rol del usuario
        const roleRoute = getRoleBasedRoute(result.user)

        // Si el usuario tiene un tenant, redirigir al subdominio del tenant
        if (result.user.tenant) {
          const tenantAdminUrl = generateTenantAdminUrl(result.user.tenant)
          const currentHostname = window.location.hostname
          const targetSubdomain = result.user.tenant.subdomain || result.user.tenant.slug

          // console.log('🔍 Checking subdomain:', {
          //   currentHostname,
          //   targetSubdomain,
          //   tenantAdminUrl,
          //   role: result.user.role,
          //   destination: roleRoute
          // })

          // Verificar si ya estamos en el subdominio correcto
          const isCorrectSubdomain =
            currentHostname === targetSubdomain || // localhost directo
            currentHostname === `${targetSubdomain}.localhost` || // .localhost
            currentHostname === `${targetSubdomain}.tappmesa.local` || // .local
            currentHostname === `${targetSubdomain}.vercel.app` || // Vercel
            currentHostname === `${targetSubdomain}.tappmesa.com` || // Production
            currentHostname.startsWith(`${targetSubdomain}.`) || // Cualquier subdominio
            currentHostname.startsWith(targetSubdomain) // Starts with subdomain

          if (isCorrectSubdomain) {
            // Ya estamos en el subdominio correcto, navegar según rol
            // console.log(`✅ Already on correct subdomain, navigating to ${roleRoute}`)
            navigate(roleRoute, { replace: true })
          } else {
            // Redirigir al subdominio correcto con la ruta del rol
            const targetUrl = tenantAdminUrl.replace('/admin', roleRoute)
            // console.log('🔄 Redirecting to tenant subdomain:', targetUrl)
            window.location.href = targetUrl
          }
        } else {
          // Si no tiene tenant (super admin), ir al admin normal
          // console.log('👤 No tenant (super admin), navigating to:', from)
          navigate(from, { replace: true })
        }
      } else {
        setErrors({ form: result.error })
      }
    } catch {
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
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-primary-50/20 to-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-300/20 rounded-full blur-3xl animate-float-delay pointer-events-none" />

      {/* Botón volver al inicio */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl transition-all font-medium text-sm shadow-md hover:shadow-lg z-20"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al Inicio
      </button>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo y título */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-linear-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl group hover:scale-110 transition-transform">
            <Coffee className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            Panel de Administración
          </h2>
          <p className="text-lg text-gray-600">
            Ingresa a tu cuenta para gestionar tu local
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error general */}
            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800">Error de autenticación</h3>
                  <p className="text-sm text-red-700 mt-1">{errors.form}</p>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-12 pr-12 py-3.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={loginLoading || loading}
              className="w-full flex justify-center py-4 px-8 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-linear-to-r from-primary-600 to-secondary-600 hover:shadow-2xl hover:shadow-primary-500/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
            >
              {loginLoading || loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Credenciales de prueba - SOLO EN DESARROLLO */}
          {import.meta.env.DEV && (
            <div className="mt-8 p-5 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Credenciales de prueba:</h4>
              <div className="text-xs text-blue-800 space-y-2">
                <p><strong>Super Admin:</strong> admin@tappmesa.com / admin123</p>
                <p><strong>Café Central:</strong> cafe-central@cafe-central.com / admin123</p>
                <p><strong>Tetería Luna:</strong> teteria-luna@teteria-luna.com / admin123</p>
                <p><strong>Bistro Sunrise:</strong> bistro-sunrise@bistro-sunrise.com / admin123</p>
                <p><strong>Coffee & Co:</strong> coffee-co@coffee-co.com / admin123</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            ¿Problemas para acceder?{' '}
            <a href="mailto:soporte@tappmesa.com" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Contacta soporte
            </a>
          </p>
          <p className="text-sm text-gray-500">
            ¿No tienes una cuenta?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-secondary-600 hover:text-secondary-700 font-semibold transition-colors"
            >
              Regístrate gratis
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
