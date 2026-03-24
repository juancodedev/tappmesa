/* eslint-disable react-refresh/only-export-components -- exporta contexto, hook useReservation y ReservationWidget */
// src/components/Reservations/ReservationContext.jsx
import { createContext, useContext, useReducer } from 'react';
import { reservationService } from '../../lib/supabase';
import logger from '../utils/logger';

const ReservationContext = createContext();

const initialState = {
  reservations: [],
  availableTables: [],
  selectedDate: null,
  selectedTime: null,
  selectedTable: null,
  guests: 2,
  customerInfo: {
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  },
  loading: false,
  error: null,
  currentStep: 1 // 1: Date/Time, 2: Table, 3: Info, 4: Confirmation
};

const reservationActions = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_AVAILABLE_TABLES: 'SET_AVAILABLE_TABLES',
  ADD_RESERVATION: 'ADD_RESERVATION',
  SET_RESERVATIONS: 'SET_RESERVATIONS',
  SET_SELECTED_DATE: 'SET_SELECTED_DATE',
  SET_SELECTED_TIME: 'SET_SELECTED_TIME',
  SET_SELECTED_TABLE: 'SET_SELECTED_TABLE',
  SET_GUESTS: 'SET_GUESTS',
  SET_CUSTOMER_INFO: 'SET_CUSTOMER_INFO',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  RESET_FORM: 'RESET_FORM'
};

function reservationReducer(state, action) {
  switch (action.type) {
    case reservationActions.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case reservationActions.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case reservationActions.SET_AVAILABLE_TABLES:
      return { ...state, availableTables: action.payload, loading: false };
    
    case reservationActions.ADD_RESERVATION:
      return { 
        ...state, 
        reservations: [...state.reservations, action.payload],
        loading: false
      };
    
    case reservationActions.SET_RESERVATIONS:
      return { ...state, reservations: action.payload, loading: false };
    
    case reservationActions.SET_SELECTED_DATE:
      return { 
        ...state, 
        selectedDate: action.payload,
        selectedTime: null,
        selectedTable: null,
        availableTables: []
      };
    
    case reservationActions.SET_SELECTED_TIME:
      return { 
        ...state, 
        selectedTime: action.payload,
        selectedTable: null
      };
    
    case reservationActions.SET_SELECTED_TABLE:
      return { ...state, selectedTable: action.payload };
    
    case reservationActions.SET_GUESTS:
      return { 
        ...state, 
        guests: action.payload,
        selectedTable: null
      };
    
    case reservationActions.SET_CUSTOMER_INFO:
      return { 
        ...state, 
        customerInfo: { ...state.customerInfo, ...action.payload }
      };
    
    case reservationActions.SET_CURRENT_STEP:
      return { ...state, currentStep: action.payload };
    
    case reservationActions.CLEAR_SELECTION:
      return {
        ...state,
        selectedDate: null,
        selectedTime: null,
        selectedTable: null,
        availableTables: [],
        currentStep: 1
      };
    
    case reservationActions.RESET_FORM:
      return { ...initialState };
    
    default:
      return state;
  }
}

export function ReservationProvider({ children }) {
  const [state, dispatch] = useReducer(reservationReducer, initialState);

  const setLoading = (loading) => {
    dispatch({ type: reservationActions.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: reservationActions.SET_ERROR, payload: error });
  };

  const setSelectedDate = (date) => {
    dispatch({ type: reservationActions.SET_SELECTED_DATE, payload: date });
  };

  const setSelectedTime = (time) => {
    dispatch({ type: reservationActions.SET_SELECTED_TIME, payload: time });
  };

  const setSelectedTable = (table) => {
    dispatch({ type: reservationActions.SET_SELECTED_TABLE, payload: table });
  };

  const setGuests = (guests) => {
    dispatch({ type: reservationActions.SET_GUESTS, payload: guests });
  };

  const setCustomerInfo = (info) => {
    dispatch({ type: reservationActions.SET_CUSTOMER_INFO, payload: info });
  };

  const setCurrentStep = (step) => {
    dispatch({ type: reservationActions.SET_CURRENT_STEP, payload: step });
  };

  const clearSelection = () => {
    dispatch({ type: reservationActions.CLEAR_SELECTION });
  };

  const resetForm = () => {
    dispatch({ type: reservationActions.RESET_FORM });
  };

  // Obtener disponibilidad de mesas
  const getTableAvailability = async (tenantId, date, time) => {
    setLoading(true);
    setError(null);

    try {
      const result = await reservationService.getTableAvailability(tenantId, date, time);
      
      if (result.success) {
        dispatch({ 
          type: reservationActions.SET_AVAILABLE_TABLES, 
          payload: result.availableTables 
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Error al obtener disponibilidad de mesas');
      logger.error('Error getting table availability:', error);
    }
  };

  // Crear reserva
  const createReservation = async (tenantId) => {
    setLoading(true);
    setError(null);

    try {
      const reservationData = {
        tenantId,
        customerName: state.customerInfo.name,
        customerPhone: state.customerInfo.phone,
        customerEmail: state.customerInfo.email,
        date: state.selectedDate,
        time: state.selectedTime,
        partySize: state.guests,
        tableNumber: state.selectedTable,
        specialRequests: state.customerInfo.specialRequests
      };

      const result = await reservationService.createReservation(reservationData);
      
      if (result.success) {
        dispatch({ 
          type: reservationActions.ADD_RESERVATION, 
          payload: result.reservation 
        });
        return { success: true, reservation: result.reservation };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Error al crear la reserva';
      setError(errorMessage);
      logger.error('Error creating reservation:', error);
      return { success: false, error: errorMessage };
    }
  };

  // Obtener reservas
  const getReservations = async (tenantId, date = null) => {
    setLoading(true);
    setError(null);

    try {
      const result = await reservationService.getReservations(tenantId, date);
      
      if (result.success) {
        dispatch({ 
          type: reservationActions.SET_RESERVATIONS, 
          payload: result.reservations 
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Error al obtener reservas');
      logger.error('Error getting reservations:', error);
    }
  };

  // Validar paso actual
  const validateCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return state.selectedDate && state.selectedTime && state.guests > 0;
      case 2:
        return state.selectedTable !== null;
      case 3:
        return state.customerInfo.name && 
               state.customerInfo.phone && 
               state.customerInfo.email;
      default:
        return true;
    }
  };

  // Ir al siguiente paso
  const nextStep = async (tenantId) => {
    if (!validateCurrentStep()) {
      setError('Por favor completa todos los campos requeridos');
      return false;
    }

    if (state.currentStep === 1) {
      // Obtener mesas disponibles al pasar del paso 1 al 2
      await getTableAvailability(tenantId, state.selectedDate, state.selectedTime);
    }

    if (state.currentStep < 4) {
      setCurrentStep(state.currentStep + 1);
      setError(null);
      return true;
    }

    return false;
  };

  // Ir al paso anterior
  const previousStep = () => {
    if (state.currentStep > 1) {
      setCurrentStep(state.currentStep - 1);
      setError(null);
      return true;
    }
    return false;
  };

  // Generar horarios disponibles
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 12; // 12:00 PM
    const endHour = 22; // 10:00 PM
    const interval = 30; // 30 minutos

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }

    return slots;
  };

  // Verificar si una fecha está disponible
  const isDateAvailable = (date) => {
    const today = new Date();
    const selectedDate = new Date(date);
    
    // No permitir fechas pasadas
    if (selectedDate < today.setHours(0, 0, 0, 0)) {
      return false;
    }

    // No permitir reservas con más de 60 días de anticipación
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    
    if (selectedDate > maxDate) {
      return false;
    }

    return true;
  };

  const value = {
    ...state,
    setSelectedDate,
    setSelectedTime,
    setSelectedTable,
    setGuests,
    setCustomerInfo,
    setCurrentStep,
    clearSelection,
    resetForm,
    getTableAvailability,
    createReservation,
    getReservations,
    validateCurrentStep,
    nextStep,
    previousStep,
    generateTimeSlots,
    isDateAvailable,
    setLoading,
    setError
  };

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservation() {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation debe ser usado dentro de un ReservationProvider');
  }
  return context;
}

// src/components/Reservations/ReservationWidget.jsx
import { useState, useMemo } from 'react';
import { useAuth } from './AuthContext';

export default function ReservationWidget() {
  const { tenant } = useAuth();
  const {
    currentStep,
    selectedDate,
    selectedTime,
    selectedTable,
    guests,
    customerInfo,
    availableTables,
    loading,
    error,
    setSelectedDate,
    setSelectedTime,
    setSelectedTable,
    setGuests,
    setCustomerInfo,
    nextStep,
    previousStep,
    createReservation,
    generateTimeSlots,
    isDateAvailable,
    resetForm
  } = useReservation();

  const [showSuccess, setShowSuccess] = useState(false);
  const [createdReservation, setCreatedReservation] = useState(null);

  const dateRange = useMemo(() => ({
    min: new Date().toISOString().split('T')[0],
    // eslint-disable-next-line react-hooks/purity -- valor estable dentro de useMemo
    max: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }), []);

  const timeSlots = generateTimeSlots();

  const handleDateChange = (date) => {
    if (isDateAvailable(date)) {
      setSelectedDate(date);
    }
  };

  const handleSubmitReservation = async () => {
    if (!tenant?.id) {
      alert('Error: No se pudo identificar el restaurante');
      return;
    }

    const result = await createReservation(tenant.id);
    
    if (result.success) {
      setCreatedReservation(result.reservation);
      setShowSuccess(true);
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
      }, 5000);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3, 4].map(step => (
        <div 
          key={step}
          className={`step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
        >
          <span className="step-number">{step}</span>
          <span className="step-label">
            {step === 1 && 'Fecha y Hora'}
            {step === 2 && 'Mesa'}
            {step === 3 && 'Información'}
            {step === 4 && 'Confirmar'}
          </span>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="reservation-step">
      <h3>Selecciona fecha y hora</h3>
      
      <div className="form-group">
        <label>Número de personas</label>
        <select
          value={guests}
          onChange={(e) => setGuests(parseInt(e.target.value))}
          className="form-control"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <option key={num} value={num}>{num} persona{num > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Fecha</label>
        <input
          type="date"
          value={selectedDate || ''}
          onChange={(e) => handleDateChange(e.target.value)}
          min={dateRange.min}
          max={dateRange.max}
          className="form-control"
        />
      </div>

      <div className="form-group">
        <label>Hora</label>
        <div className="time-slots">
          {timeSlots.map(time => (
            <button
              key={time}
              type="button"
              className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
              onClick={() => setSelectedTime(time)}
              disabled={!selectedDate}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="reservation-step">
      <h3>Selecciona tu mesa</h3>
      
      {loading ? (
        <div className="loading">Cargando mesas disponibles...</div>
      ) : availableTables.length > 0 ? (
        <div className="tables-grid">
          {availableTables.map(table => (
            <button
              key={table.number}
              type="button"
              className={`table-option ${selectedTable === table.number ? 'selected' : ''}`}
              onClick={() => setSelectedTable(table.number)}
            >
              <div className="table-icon">🪑</div>
              <div className="table-info">
                <strong>Mesa {table.number}</strong>
                <span>Capacidad: {table.capacity} personas</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="no-tables">
          <p>No hay mesas disponibles para la fecha y hora seleccionadas.</p>
          <button 
            type="button" 
            onClick={() => previousStep()}
            className="btn-secondary"
          >
            Cambiar fecha/hora
          </button>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="reservation-step">
      <h3>Información de contacto</h3>
      
      <div className="form-group">
        <label>Nombre completo *</label>
        <input
          type="text"
          value={customerInfo.name}
          onChange={(e) => setCustomerInfo({ name: e.target.value })}
          placeholder="Tu nombre completo"
          className="form-control"
          required
        />
      </div>

      <div className="form-group">
        <label>Teléfono *</label>
        <input
          type="tel"
          value={customerInfo.phone}
          onChange={(e) => setCustomerInfo({ phone: e.target.value })}
          placeholder="+56 9 1234 5678"
          className="form-control"
          required
        />
      </div>

      <div className="form-group">
        <label>Email *</label>
        <input
          type="email"
          value={customerInfo.email}
          onChange={(e) => setCustomerInfo({ email: e.target.value })}
          placeholder="tu@email.com"
          className="form-control"
          required
        />
      </div>

      <div className="form-group">
        <label>Solicitudes especiales (opcional)</label>
        <textarea
          value={customerInfo.specialRequests}
          onChange={(e) => setCustomerInfo({ specialRequests: e.target.value })}
          placeholder="Ej: Celebración de cumpleaños, necesidades dietéticas especiales..."
          className="form-control"
          rows="3"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="reservation-step">
      <h3>Confirmar reserva</h3>
      
      <div className="reservation-summary">
        <div className="summary-item">
          <strong>Fecha:</strong>
          <span>{new Date(selectedDate).toLocaleDateString('es-CL', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        
        <div className="summary-item">
          <strong>Hora:</strong>
          <span>{selectedTime}</span>
        </div>
        
        <div className="summary-item">
          <strong>Mesa:</strong>
          <span>Mesa {selectedTable}</span>
        </div>
        
        <div className="summary-item">
          <strong>Personas:</strong>
          <span>{guests} persona{guests > 1 ? 's' : ''}</span>
        </div>
        
        <div className="summary-item">
          <strong>Nombre:</strong>
          <span>{customerInfo.name}</span>
        </div>
        
        <div className="summary-item">
          <strong>Teléfono:</strong>
          <span>{customerInfo.phone}</span>
        </div>
        
        <div className="summary-item">
          <strong>Email:</strong>
          <span>{customerInfo.email}</span>
        </div>
        
        {customerInfo.specialRequests && (
          <div className="summary-item">
            <strong>Solicitudes especiales:</strong>
            <span>{customerInfo.specialRequests}</span>
          </div>
        )}
      </div>

      <div className="confirmation-note">
        <p>
          <strong>Nota:</strong> Recibirás una confirmación por email y SMS. 
          Por favor llega 10 minutos antes de tu hora reservada.
        </p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="reservation-success">
      <div className="success-icon">✅</div>
      <h2>¡Reserva confirmada!</h2>
      <p>Tu reserva ha sido confirmada exitosamente.</p>
      
      <div className="reservation-details">
        <h4>Detalles de tu reserva:</h4>
        <p><strong>Código de reserva:</strong> {createdReservation?.id.slice(-8).toUpperCase()}</p>
        <p><strong>Fecha:</strong> {new Date(selectedDate).toLocaleDateString('es-CL')}</p>
        <p><strong>Hora:</strong> {selectedTime}</p>
        <p><strong>Mesa:</strong> {selectedTable}</p>
        <p><strong>Personas:</strong> {guests}</p>
      </div>

      <div className="success-actions">
        <button 
          onClick={() => {
            setShowSuccess(false);
            resetForm();
          }}
          className="btn-primary"
        >
          Hacer otra reserva
        </button>
      </div>
    </div>
  );

  if (showSuccess) {
    return (
      <div className="reservation-widget">
        {renderSuccess()}
      </div>
    );
  }

  return (
    <div className="reservation-widget">
      <div className="widget-header">
        <h2>Reservar Mesa</h2>
        {renderStepIndicator()}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="widget-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      <div className="widget-actions">
        {currentStep > 1 && (
          <button 
            onClick={previousStep}
            className="btn-secondary"
            disabled={loading}
          >
            Anterior
          </button>
        )}
        
        {currentStep < 4 ? (
          <button 
            onClick={() => nextStep(tenant?.id)}
            className="btn-primary"
            disabled={loading || !tenant?.id}
          >
            {loading ? 'Cargando...' : 'Siguiente'}
          </button>
        ) : (
          <button 
            onClick={handleSubmitReservation}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Confirmando...' : 'Confirmar Reserva'}
          </button>
        )}
      </div>
    </div>
  );
}