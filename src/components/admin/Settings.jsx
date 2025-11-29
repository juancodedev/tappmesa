import { useState, useEffect } from "react";
import {
  Save,
  Upload,
  Clock,
  DollarSign,
  Bell,
  Wifi,
  Printer,
  MapPin,
  Phone,
  Mail,
  Globe,
  Palette,
  QrCode,
} from "lucide-react";

const Settings = () => {
  const [settings, setSettings] = useState({
    // Información básica
    name: "Café Central",
    description: "El mejor café de Santiago",
    phone: "+56912345678",
    email: "contacto@cafecentral.cl",
    address: "Providencia 123, Santiago",
    website: "https://cafecentral.cl",

    // Branding
    primary_color: "#dc2626",
    secondary_color: "#f97316",
    logo_url: "",

    // Horarios
    business_hours: {
      monday: { open: "08:00", close: "20:00", closed: false },
      tuesday: { open: "08:00", close: "20:00", closed: false },
      wednesday: { open: "08:00", close: "20:00", closed: false },
      thursday: { open: "08:00", close: "20:00", closed: false },
      friday: { open: "08:00", close: "20:00", closed: false },
      saturday: { open: "09:00", close: "21:00", closed: false },
      sunday: { open: "09:00", close: "18:00", closed: false },
    },

    // Configuraciones operativas
    tax_rate: 19,
    currency: "CLP",
    timezone: "America/Santiago",

    // Servicios
    table_service_enabled: true,
    takeaway_enabled: true,
    delivery_enabled: false,

    // Automatización
    order_auto_print: false,

    // QR Codes
    qr_code_expiration_days: null, // null = nunca expiran

    // Notificaciones
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const dayNames = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBusinessHourChange = (day, field, value) => {
    setSettings((prev) => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleNotificationChange = (type, value) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Aquí iría la lógica para guardar en Supabase
      console.log("Saving settings:", settings);

      // Simular delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Aquí iría la lógica para subir la imagen
      console.log("Uploading logo:", file);
      // Por ahora, crear una URL temporal
      const tempUrl = URL.createObjectURL(file);
      handleInputChange("logo_url", tempUrl);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuraciones</h1>
          <p className="text-gray-600">Gestiona la configuración de tu local</p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            saved
              ? "bg-green-600 text-white"
              : "bg-primary text-white hover:bg-amber-700"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Save className="w-4 h-4" />
          <span>
            {loading ? "Guardando..." : saved ? "Guardado" : "Guardar Cambios"}
          </span>
        </button>
      </div>

      <div className="space-y-8">
        {/* Información Básica */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Información Básica
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Local
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sitio Web
              </label>
              <input
                type="url"
                value={settings.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={settings.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Dirección
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Branding
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Primario
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) =>
                    handleInputChange("primary_color", e.target.value)
                  }
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) =>
                    handleInputChange("primary_color", e.target.value)
                  }
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Secundario
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) =>
                    handleInputChange("secondary_color", e.target.value)
                  }
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) =>
                    handleInputChange("secondary_color", e.target.value)
                  }
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo
              </label>
              <div className="flex items-center space-x-3">
                {settings.logo_url && (
                  <img
                    src={settings.logo_url}
                    alt="Logo"
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                )}
                <label className="flex items-center space-x-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Subir Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Horarios de Atención */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Horarios de Atención
          </h2>

          <div className="space-y-4">
            {Object.entries(settings.business_hours).map(([day, hours]) => (
              <div key={day} className="flex items-center space-x-4">
                <div className="w-24">
                  <span className="text-sm font-medium text-gray-700">
                    {dayNames[day]}
                  </span>
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!hours.closed}
                    onChange={(e) =>
                      handleBusinessHourChange(day, "closed", !e.target.checked)
                    }
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">Abierto</span>
                </label>

                {!hours.closed && (
                  <>
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) =>
                          handleBusinessHourChange(day, "open", e.target.value)
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <span className="text-gray-500">a</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) =>
                          handleBusinessHourChange(day, "close", e.target.value)
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {hours.closed && (
                  <span className="text-sm text-gray-500 italic">Cerrado</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Configuraciones Operativas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Configuraciones Operativas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IVA (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.tax_rate}
                onChange={(e) =>
                  handleInputChange("tax_rate", parseFloat(e.target.value))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                value={settings.currency}
                onChange={(e) => handleInputChange("currency", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="CLP">Peso Chileno (CLP)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zona Horaria
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => handleInputChange("timezone", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="America/Santiago">Santiago (UTC-3)</option>
                <option value="America/New_York">Nueva York (UTC-5)</option>
                <option value="Europe/Madrid">Madrid (UTC+1)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Servicios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Wifi className="w-5 h-5 mr-2" />
            Servicios Disponibles
          </h2>

          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.table_service_enabled}
                onChange={(e) =>
                  handleInputChange("table_service_enabled", e.target.checked)
                }
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Servicio en Mesa
                </span>
                <p className="text-sm text-gray-600">
                  Los clientes pueden ordenar desde las mesas
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.takeaway_enabled}
                onChange={(e) =>
                  handleInputChange("takeaway_enabled", e.target.checked)
                }
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium text-gray-900">Para Llevar</span>
                <p className="text-sm text-gray-600">
                  Permitir órdenes para llevar
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.delivery_enabled}
                onChange={(e) =>
                  handleInputChange("delivery_enabled", e.target.checked)
                }
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium text-gray-900">Delivery</span>
                <p className="text-sm text-gray-600">
                  Servicio de entrega a domicilio
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Automatización */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Printer className="w-5 h-5 mr-2" />
            Automatización
          </h2>

          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.order_auto_print}
                onChange={(e) =>
                  handleInputChange("order_auto_print", e.target.checked)
                }
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium text-gray-900">
                  Impresión Automática
                </span>
                <p className="text-sm text-gray-600">
                  Imprimir órdenes automáticamente en cocina
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* QR Codes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            Códigos QR
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Días de expiración de códigos QR
              </label>
              <input
                type="number"
                min="0"
                value={settings.qr_code_expiration_days || ''}
                onChange={(e) =>
                  handleInputChange(
                    "qr_code_expiration_days",
                    e.target.value === '' ? null : parseInt(e.target.value)
                  )
                }
                placeholder="Dejar vacío para nunca expirar"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-600">
                Los códigos QR de las mesas expirarán después de este número de días.
                Deja este campo vacío o en 0 para que los códigos nunca expiren
                (recomendado si los códigos están impresos en las mesas).
              </p>
              {settings.qr_code_expiration_days > 0 && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Nota:</strong> Los códigos QR expirarán después de{" "}
                    {settings.qr_code_expiration_days} día
                    {settings.qr_code_expiration_days !== 1 ? "s" : ""}.
                    Tendrás que regenerarlos manualmente desde la gestión de mesas.
                  </p>
                </div>
              )}
              {(!settings.qr_code_expiration_days || settings.qr_code_expiration_days === 0) && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    ✅ Los códigos QR nunca expirarán. Esto es ideal cuando los códigos están impresos en las mesas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notificaciones
          </h2>

          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) =>
                  handleNotificationChange("email", e.target.checked)
                }
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium text-gray-900">Email</span>
                <p className="text-sm text-gray-600">
                  Recibir notificaciones por email
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.notifications.sms}
                onChange={(e) =>
                  handleNotificationChange("sms", e.target.checked)
                }
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium text-gray-900">SMS</span>
                <p className="text-sm text-gray-600">
                  Recibir notificaciones por SMS
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) =>
                  handleNotificationChange("push", e.target.checked)
                }
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium text-gray-900">Push</span>
                <p className="text-sm text-gray-600">
                  Notificaciones push en el navegador
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
