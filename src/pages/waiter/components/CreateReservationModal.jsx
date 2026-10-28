import ReservationForm from '../../../components/reservations/ReservationForm'
import Modal from '../../../components/ui/Modal'

const CreateReservationModal = ({ tenant, onClose, onSuccess }) => {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Nueva Reserva"
      size="lg"
      bodyClassName=""
    >
      {/* Content */}
      <div className="p-6">
        <ReservationForm
          tenantId={tenant.id}
          tenantName={tenant.name}
          onSuccess={() => {
            onSuccess()
          }}
        />
      </div>
    </Modal>
  )
}

export default CreateReservationModal
