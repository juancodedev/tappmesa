import { createContext, useContext, useState, useEffect } from "react";
import { useTenant } from "./TenantContext";
import { supabase } from "../lib/supabase";

const ReservationsContext = createContext();

export const useReservations = () => {
  const context = useContext(ReservationsContext);
  if (!context) {
    throw new Error("useReservations must be used within ReservationsProvider");
  }
  return context;
};

export const ReservationsProvider = ({ children }) => {
  const { tenant } = useTenant();
  const [tables, setTables] = useState([]);
  const [operatingHours, setOperatingHours] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos cuando el tenant cambie
  useEffect(() => {
    if (tenant) {
      loadTablesConfiguration();
      loadOperatingHours();
      loadReservations();
    }
  }, [tenant]);

  // Cargar configuración de mesas
  const loadTablesConfiguration = async () => {
    if (!tenant) return;

    try {
      const { data, error } = await supabase
        .from("table_configurations")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_available", true)
        .order("table_number");

      if (error) throw error;
      setTables(data || []);
      console.log("✅ Configuración de mesas cargada:", data?.length || 0);
    } catch (error) {
      console.error("Error loading tables configuration:", error);
      setTables([]);
    }
  };

  // Cargar horarios de operación
  const loadOperatingHours = async () => {
    if (!tenant) return;

    try {
      const { data, error } = await supabase
        .from("operating_hours")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("day_of_week");

      if (error) throw error;
      setOperatingHours(data || []);
      console.log("✅ Horarios de operación cargados:", data?.length || 0);
    } catch (error) {
      console.error("Error loading operating hours:", error);
      setOperatingHours([]);
    }
  };

  // Cargar reservas
  const loadReservations = async () => {
    if (!tenant) return;

    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          `
          *,
          table_configurations (
            table_number,
            capacity,
            location_description
          )
        `
        )
        .eq("tenant_id", tenant.id)
        .gte("reservation_date", new Date().toISOString().split("T")[0])
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true });

      if (error) throw error;
      setReservations(data || []);
      console.log("✅ Reservas cargadas:", data?.length || 0);
    } catch (error) {
      console.error("Error loading reservations:", error);
      setReservations([]);
    }
  };

  // Verificar disponibilidad de mesa
  const checkTableAvailability = async (
    tableId,
    date,
    time,
    duration = 120
  ) => {
    try {
      const reservationDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(
        reservationDateTime.getTime() + duration * 60000
      );

      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("table_id", tableId)
        .eq("reservation_date", date)
        .in("status", ["confirmed"]);

      if (error) throw error;

      // Verificar conflictos de horario
      const hasConflict = data.some((reservation) => {
        const existingStart = new Date(
          `${date}T${reservation.reservation_time}`
        );
        const existingEnd = new Date(
          existingStart.getTime() +
            (reservation.duration_minutes || 120) * 60000
        );

        return (
          (reservationDateTime >= existingStart &&
            reservationDateTime < existingEnd) ||
          (endDateTime > existingStart && endDateTime <= existingEnd) ||
          (reservationDateTime <= existingStart && endDateTime >= existingEnd)
        );
      });

      return !hasConflict;
    } catch (error) {
      console.error("Error checking table availability:", error);
      return false;
    }
  };

  // Obtener mesas disponibles para una fecha y hora específica
  const getAvailableTables = async (date, time, partySize, duration = 120) => {
    const availableTables = [];

    for (const table of tables) {
      if (table.capacity >= partySize) {
        const isAvailable = await checkTableAvailability(
          table.id,
          date,
          time,
          duration
        );
        if (isAvailable) {
          availableTables.push(table);
        }
      }
    }

    return availableTables;
  };

  // Crear nueva reserva
  const createReservation = async (reservationData) => {
    if (!tenant)
      return { success: false, error: "No hay cafetería seleccionada" };

    try {
      setLoading(true);

      // Verificar disponibilidad antes de crear
      const isAvailable = await checkTableAvailability(
        reservationData.tableId,
        reservationData.date,
        reservationData.time,
        reservationData.duration || 120
      );

      if (!isAvailable) {
        return {
          success: false,
          error: "La mesa no está disponible en el horario seleccionado",
        };
      }

      const { data, error } = await supabase
        .from("reservations")
        .insert({
          tenant_id: tenant.id,
          table_id: reservationData.tableId,
          customer_name: reservationData.customerName,
          customer_phone: reservationData.customerPhone,
          customer_email: reservationData.customerEmail || null,
          party_size: reservationData.partySize,
          reservation_date: reservationData.date,
          reservation_time: reservationData.time,
          duration_minutes: reservationData.duration || 120,
          special_requests: reservationData.specialRequests || null,
          status: "confirmed",
        })
        .select(
          `
          *,
          table_configurations (
            table_number,
            capacity,
            location_description
          )
        `
        )
        .single();

      if (error) throw error;

      console.log("✅ Reserva creada:", data);

      // Recargar reservas
      await loadReservations();

      return {
        success: true,
        reservation: data,
        message: `¡Reserva confirmada! Mesa ${
          data.table_configurations.table_number
        } para el ${formatDate(data.reservation_date)} a las ${formatTime(
          data.reservation_time
        )}`,
      };
    } catch (error) {
      console.error("Error creating reservation:", error);
      return {
        success: false,
        error: "Error al crear la reserva: " + error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  // Actualizar estado de reserva
  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .update({ status: newStatus })
        .eq("id", reservationId)
        .eq("tenant_id", tenant.id)
        .select();

      if (error) throw error;

      console.log("✅ Estado de reserva actualizado:", data[0]);

      // Actualizar estado local
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status: newStatus }
            : reservation
        )
      );

      return { success: true, reservation: data[0] };
    } catch (error) {
      console.error("Error updating reservation status:", error);
      return { success: false, error: error.message };
    }
  };

  // Verificar si el local está abierto en una fecha/hora específica
  const isOpenAt = (date, time) => {
    const dayOfWeek = new Date(date).getDay();
    const hours = operatingHours.find((h) => h.day_of_week === dayOfWeek);

    if (!hours) return false;

    return time >= hours.open_time && time <= hours.close_time;
  };

  // Obtener horarios disponibles para una fecha
  const getAvailableTimeSlots = (date) => {
    const dayOfWeek = new Date(date).getDay();
    const hours = operatingHours.find((h) => h.day_of_week === dayOfWeek);

    if (!hours) return [];

    const slots = [];
    const openTime = hours.open_time;
    const closeTime = hours.close_time;

    // Generar slots de 30 minutos
    let currentTime = openTime;
    while (currentTime < closeTime) {
      slots.push(currentTime);

      // Incrementar 30 minutos
      const [hours, minutes] = currentTime.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes + 30;
      const newHours = Math.floor(totalMinutes / 60);
      const newMinutes = totalMinutes % 60;

      if (newHours >= 24) break;

      currentTime = `${newHours.toString().padStart(2, "0")}:${newMinutes
        .toString()
        .padStart(2, "0")}`;
    }

    return slots;
  };

  // Utilidades de formato
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const value = {
    // Estado
    tables,
    operatingHours,
    reservations,
    loading,

    // Acciones
    loadTablesConfiguration,
    loadOperatingHours,
    loadReservations,
    createReservation,
    updateReservationStatus,

    // Utilidades
    checkTableAvailability,
    getAvailableTables,
    isOpenAt,
    getAvailableTimeSlots,
    formatDate,
    formatTime,
  };

  return (
    <ReservationsContext.Provider value={value}>
      {children}
    </ReservationsContext.Provider>
  );
};
