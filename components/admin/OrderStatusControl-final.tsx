import React, { useState } from 'react';
import { updateOrderStatusWithAudit, getOrderStatusHistory } from '../../app/actions/update-order-status-fixed';

interface OrderStatusControlProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', display: '⏳ Menunggu (Pending)', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ACCEPTED', display: '✅ Diterima (Accepted)', color: 'bg-blue-100 text-blue-800' },
  { value: 'READY', display: '🍲 Sedia di Kedai (Ready - Self Pickup)', color: 'bg-purple-100 text-purple-800' },
  { value: 'DELIVERING', display: '🚚 Sedang Dihantar (Delivering - Runner)', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'COMPLETED', display: '🎉 Selesai (Completed)', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', display: '❌ Batal (Cancelled)', color: 'bg-red-100 text-red-800' },
];

export default function OrderStatusControl({ orderId, currentStatus, onStatusUpdate }: OrderStatusControlProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const normalizedStatus = currentStatus?.toUpperCase() || 'PENDING';
  const currentOption = STATUS_OPTIONS.find(opt => opt.value === normalizedStatus);
  
  // Check if status is locked (COMPLETED or CANCELLED)
  const isStatusLocked = normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED';

  const updateStatus = async (status: string, notes: string) => {
    setIsUpdating(true);
    try {
      const upperStatus = status.toUpperCase();
      const result = await updateOrderStatusWithAudit(orderId, upperStatus, notes);
      if (result.success) {
        if (onStatusUpdate) onStatusUpdate(orderId, upperStatus);
        alert('✅ Status berjaya ditukar');
      } else {
        // Display specific error message from Server Action
        const errorMessage = result.error || 'Gagal menukar status';
        alert(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ralat berlaku ketika menukar status');
    } finally {
      setIsUpdating(false);
      setShowNotesModal(false);
      setNotes('');
    }
  };

  const loadStatusHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await getOrderStatusHistory(orderId);
      setStatusHistory(history);
      setShowHistoryModal(true);
    } catch (error) {
      alert('Gagal memuatkan sejarah status');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600">Status Semasa:</span>
            {currentOption && (
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${currentOption.color}`}>
                {currentOption.display}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadStatusHistory}
            disabled={loadingHistory}
            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-300 transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>📜</span>
            {loadingHistory ? 'Memuatkan...' : 'Lihat Sejarah'}
          </button>

          {!isStatusLocked && (
            <select
              value=""
              onChange={(e) => {
                const newStatus = e.target.value;
                if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
                  setTargetStatus(newStatus);
                  setShowNotesModal(true);
                  return;
                }
                updateStatus(newStatus, '');
              }}
              disabled={isUpdating}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Tukar Status...</option>
              {STATUS_OPTIONS
                .filter(opt => opt.value !== normalizedStatus)
                .map(option => (
                  <option key={option.value} value={option.value}>
                    {option.display}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {targetStatus === 'COMPLETED' ? 'Selesaikan Pesanan' : 'Batalkan Pesanan'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {targetStatus === 'COMPLETED' ? 'Status "Selesai" adalah muktamad.' : 'Pastikan anda mempunyai sebab yang sah.'}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Catatan:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={targetStatus === 'COMPLETED' 
                  ? 'Contoh: Pesanan telah diterima dan diselesaikan...' 
                  : 'Contoh: Pelanggan meminta batal kerana...'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                rows={3}
                required
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowNotesModal(false); setNotes(''); }} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-medium">Batal</button>
              <button onClick={() => updateStatus(targetStatus, notes)} disabled={isUpdating || !notes.trim()} className={`flex-1 py-2.5 rounded-lg transition font-medium ${targetStatus === 'COMPLETED' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'} disabled:opacity-50`}>
                {isUpdating ? 'Memproses...' : targetStatus === 'COMPLETED' ? 'Selesaikan' : 'Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Sejarah Status Pesanan</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            {statusHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Tiada sejarah status untuk pesanan ini.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {statusHistory.map((record) => (
                  <div key={record.id} className="border-l-4 border-gray-200 pl-4 pb-4 relative">
                    <div className="absolute -left-[10px] top-0 w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800`}>
                              {record.previous_status}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className={`px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800`}>
                              {record.new_status}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(record.created_at).toLocaleString('ms-MY')}</span>
                      </div>
                      {record.actor_name && (
                        <div className="text-sm text-gray-600 mb-1"><span className="font-medium">Oleh:</span> {record.actor_name}{record.actor_role && ` (${record.actor_role})`}</div>
                      )}
                      {record.notes && (
                        <div className="mt-2 p-2 bg-white border border-gray-200 rounded text-sm">
                          <span className="font-medium text-gray-700">Catatan:</span>
                          <p className="text-gray-600 mt-1">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 pt-6 border-t">
              <button onClick={() => setShowHistoryModal(false)} className="w-full bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition font-medium">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
