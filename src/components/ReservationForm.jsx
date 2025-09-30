import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useTenant } from '../hooks/useTenant';

const ReservationForm = () => {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [businessHours, setBusinessHours] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    reservationDate: "",
    reservationTime: "",
    partySize: 2,
    specialRequests: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (tenant) {
      loadBusinessHours();
      loadAvailableTables();
    }
  }, [tenant]);

  useEffect(() => {
    if (formData.reservationDate) {
      generateTimeSlots();
    }
  }, [formData.reservationDate, businessHours]);

  const loadBusinessHours = async () => {
    try {
      const { data, error } = await supabase
        .from("business_hours")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("day_of_week");

      if (error) throw error;
      setBusinessHours(data || []);
    } catch (error) {
      console.error("Error loading business hours:", error);
    }
  };

  const loadAvailableTables = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_available", true)
        .order("table_number");

      if (error) throw error;
      setAvailableTables(data || []);
    } catch (error) {
      console.error("Error loading tables:", error);
    }
  };

  const generateTimeSlots = () => {
    if (!formData.reservationDate) return;

    const selectedDate = new Date(formData.reservationDate);
    const dayOfWeek = selectedDate.getDay();
    const todayHours = businessHours.find((bh) => bh.day_of_week === dayOfWeek);

    if (!todayHours || !todayHours.is_open) {
      setTimeSlots([]);
      return;
    }

    const slots = [];
    const openTime = new Date(`2000-01-01T${todayHours.open_time}`);
    const closeTime = new Date(`2000-01-01T${todayHours.close_time}`);

    // Generar slots cada 30 minutos
    const current = new Date(openTime);
    while (current < closeTime) {
      const timeString = current.toTimeString().slice(0, 5);
      slots.push(timeString);
      current.setMinutes(current.getMinutes() + 30);
    }

    setTimeSlots(slots);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "El nombre es requerido";
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = "El teléfono es requerido";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.customerPhone)) {
      newErrors.customerPhone = "Formato de teléfono inválido";
    }

    if (
      formData.customerEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)
    ) {
      newErrors.customerEmail = "Formato de email inválido";
    }

    if (!formData.reservationDate) {
      newErrors.reservationDate = "La fecha es requerida";
    } else {
      const selectedDate = new Date(formData.reservationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.reservationDate =
          "No se pueden hacer reservas en fechas pasadas";
      }
    }

    if (!formData.reservationTime) {
      newErrors.reservationTime = "La hora es requerida";
    }

    if (formData.partySize < 1 || formData.partySize > 20) {
      newErrors.partySize = "El número de personas debe estar entre 1 y 20";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkAvailability = async () => {
    try {
      // Verificar si ya hay una reserva en esa fecha/hora
      const { data: existingReservations, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("reservation_date", formData.reservationDate)
        .eq("reservation_time", formData.reservationTime)
        .in("status", ["confirmed"]);

      if (error) throw error;

      // Verificar capacidad total vs reservas existentes
      const totalCapacityReserved =
        existingReservations?.reduce((sum, res) => sum + res.party_size, 0) ||
        0;
      const totalCapacityAvailable = availableTables.reduce(
        (sum, table) => sum + table.capacity,
        0
      );

      return (
        totalCapacityReserved + formData.partySize <= totalCapacityAvailable
      );
    } catch (error) {
      console.error("Error checking availability:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Verificar disponibilidad
      const isAvailable = await checkAvailability();
      if (!isAvailable) {
        alert(
          "Lo sentimos, no hay disponibilidad para esa fecha y hora. Por favor selecciona otra."
        );
        setLoading(false);
        return;
      }

      // Encontrar la mejor mesa para el grupo
      const suitableTable = availableTables
        .filter((table) => table.capacity >= formData.partySize)
        .sort((a, b) => a.capacity - b.capacity)[0];

      // Crear la reserva
      const reservationData = {
        tenant_id: tenant.id,
        customer_name: formData.customerName,
        customer_phone: formData.customerPhone,
        customer_email: formData.customerEmail || null,
        reservation_date: formData.reservationDate,
        reservation_time: formData.reservationTime,
        party_size: formData.partySize,
        table_number: suitableTable?.table_number || null,
        special_requests: formData.specialRequests || null,
        status: "confirmed",
      };

      const { data, error } = await supabase
        .from("reservations")
        .insert(reservationData)
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Reserva creada:", data);
      setSubmitted(true);
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("Error al crear la reserva. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek) => {
    const days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];
    return days[dayOfWeek];
  };

  const isDateAvailable = (date) => {
    const dayOfWeek = new Date(date).getDay();
    const todayHours = businessHours.find((bh) => bh.day_of_week === dayOfWeek);
    return todayHours?.is_open || false;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60); // 2 meses adelante
    return maxDate.toISOString().split("T")[0];
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Reserva Confirmada!
        </h2>
        <p className="text-gray-600 mb-4">
          Hemos confirmado tu reserva para el{" "}
          {new Date(formData.reservationDate).toLocaleDateString("es-CL")}a las{" "}
          {formData.reservationTime} para {formData.partySize} personas.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Te contactaremos al {formData.customerPhone} si necesitamos confirmar
          algún detalle.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({
              customerName: "",
              customerPhone: "",
              customerEmail: "",
              reservationDate: "",
              reservationTime: "",
              partySize: 2,
              specialRequests: "",
            });
          }}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Hacer Otra Reserva
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <Calendar className="w-12 h-12 text-primary mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900">Hacer Reserva</h2>
        <p className="text-gray-600">Reserva tu mesa en {tenant?.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información del cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo *
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) =>
              setFormData({ ...formData, customerName: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Tu nombre"
          />
          {errors.customerName && (
            <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Phone className="w-4 h-4 inline mr-1" />
            Teléfono *
          </label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) =>
              setFormData({ ...formData, customerPhone: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="+56 9 1234 5678"
          />
          {errors.customerPhone && (
            <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Mail className="w-4 h-4 inline mr-1" />
            Email (opcional)
          </label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) =>
              setFormData({ ...formData, customerEmail: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="tu@email.com"
          />
          {errors.customerEmail && (
            <p className="text-red-500 text-sm mt-1">{errors.customerEmail}</p>
          )}
        </div>

        {/* Detalles de la reserva */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha *
            </label>
            <input
              type="date"
              value={formData.reservationDate}
              onChange={(e) =>
                setFormData({ ...formData, reservationDate: e.target.value })
              }
              min={getMinDate()}
              max={getMaxDate()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {errors.reservationDate && (
              <p className="text-red-500 text-sm mt-1">
                {errors.reservationDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Hora *
            </label>
            <select
              value={formData.reservationTime}
              onChange={(e) =>
                setFormData({ ...formData, reservationTime: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={!formData.reservationDate || timeSlots.length === 0}
            >
              <option value="">Seleccionar</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {errors.reservationTime && (
              <p className="text-red-500 text-sm mt-1">
                {errors.reservationTime}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Users className="w-4 h-4 inline mr-1" />
            Número de personas *
          </label>
          <select
            value={formData.partySize}
            onChange={(e) =>
              setFormData({ ...formData, partySize: parseInt(e.target.value) })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {[...Array(20)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1} persona{i > 0 ? "s" : ""}
              </option>
            ))}
          </select>
          {errors.partySize && (
            <p className="text-red-500 text-sm mt-1">{errors.partySize}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Solicitudes especiales (opcional)
          </label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) =>
              setFormData({ ...formData, specialRequests: e.target.value })
            }
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Cumpleaños, alergias, preferencias de mesa..."
          />
        </div>

        {/* Mostrar horarios */}
        {businessHours.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">
              Horarios de atención:
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              {businessHours.map((bh) => (
                <div key={bh.day_of_week} className="flex justify-between">
                  <span>{getDayName(bh.day_of_week)}</span>
                  <span>
                    {bh.is_open
                      ? `${bh.open_time} - ${bh.close_time}`
                      : "Cerrado"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Procesando..." : "Confirmar Reserva"}
        </button>
      </form>
    </div>
  );
};

export default ReservationForm;
