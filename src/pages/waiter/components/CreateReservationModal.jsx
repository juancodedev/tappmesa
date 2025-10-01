import { X } from 'lucide-react'
import ReservationForm from '../../../components/reservations/ReservationForm'

const CreateReservationModal = ({ tenant, onClose, onSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Nueva Reserva</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <ReservationForm
            tenantId={tenant.id}
            tenantName={tenant.name}
            onSuccess={(reservation) => {
              console.log('Reserva creada:', reservation)
              onSuccess()
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default CreateReservationModal
