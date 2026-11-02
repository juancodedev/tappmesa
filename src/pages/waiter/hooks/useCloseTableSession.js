import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useToast } from '../../../hooks/useToast'
import { useConfirm } from '../../../hooks/useConfirm'

// Waiter "Cerrar sesión": closes the table session and frees the table.
// Shared by the TablesGrid list view and the order modal so both behave the same.
export function useCloseTableSession(onClosed) {
  const confirm = useConfirm()
  const toast = useToast()
  const [closingTableId, setClosingTableId] = useState(null)

  const closeSession = async (session) => {
    if (!await confirm(`¿Cerrar la sesión de la Mesa ${session.table.number}?`, { confirmLabel: 'Cerrar sesión', tone: 'danger' })) {
      return
    }

    setClosingTableId(session.table_id)
    try {
      const { error } = await supabase
        .from('table_sessions')
        .update({ status: 'closed', ended_at: new Date().toISOString() })
        .eq('id', session.id)

      if (error) throw error

      // Free the table; a failure here must not block closing the session.
      await supabase
        .from('tables')
        .update({ status: 'available' })
        .eq('id', session.table_id)

      onClosed?.()
    } catch (error) {
      toast.error('Error al cerrar la sesión: ' + error.message)
    } finally {
      setClosingTableId(null)
    }
  }

  return { closeSession, closingTableId }
}
