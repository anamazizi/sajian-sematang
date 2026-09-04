'use client';

import React, { useState } from 'react';
import { updateOrderStatusWithAudit, getOrderStatusHistory } from '../../app/actions/update-order-status';

interface OrderStatusControlProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

// Normalize status
const normalizeStatus = (status: string): string => {
  if (!status) return 'PENDING';
  const upper = status.toUpperCase().trim();
  const map: Record<string, string> = {
    'NEW': 'PENDING', 'BARU': 'PENDING', 'PENDING': 'PENDING',
    'ACCEPTED': 'ACCEPTED', 'DITERIMA': 'ACCEPTED',
    'READY': 'READY', 'SEDIA': 'READY',
    'DELIVERING': 'DELIVERING', 'DELIVERY': 'DELIVERING', 'PREPARING': 'DELIVERING',
    'COMPLETED': 'COMPLETED', 'SELESAI': 'COMPLETED',
    'CANCELLED': 'CANCELLED', 'BATAL': 'CANCELLED',
  };
  return map[upper] || 'PENDING';
};

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

  const normalizedStatus = normalizeStatus(currentStatus);
  const currentOption = STATUS_OPTIONS.find(opt => opt.value === normalizedStatus);
  
  // Show ALL status options (flat dropdown) except current status is locked (COMPLETED/CANCELLED)
  const allOptions = STATUS_OPTIONS;

  const handleStatusChange = async (newStatus: string) => {
    const upperStatus = newStatus.toUpperCase();
    if (upperStatus === 'COMPLETED' || upperStatus === 'CANCELLED') {
      setTargetStatus(upperStatus);
      setShowNotesModal(true);
      return;
    }
    await updateStatus(upperStatus, '');
  };

  const updateStatus = async (status: string, notes: string) => {
    setIsUpdating(true);
    try {
      const upperStatus = status.toUpperCase();
      const result = await updateOrderStatusWithAudit(orderId, upperStatus, notes);
      if (result.success) {
        if (onStatusUpdate) onStatusUpdate(orderId, upperStatus);
        alert('✅ Status berjaya ditukar');
      } else {
        alert('❌ Gagal menukar status');
      }
    } catch (error) {
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

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  const getDisplayLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.display || status;
  };

  const isStatusLocked = normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED';

  return (
    <div className="space-y-4">
      {/* Current Status Display */}
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(normalizedStatus)}`}>
          {currentOption?.display || normalizedStatus}
        </span>
        {!isStatusLocked && (
          <button 
            onClick={loadStatusHistory}
            disabled={loadingHistory}
            className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50"
          >
            {loadingHistory ? 'Memuatkan...' : 'Lihat Sejarah'}
          </button>
        )}
      </div>

      {/* Status Dropdown */}
      {!isStatusLocked && (
        <div className="space-y-2">
          <label className="block text-slate-900 font-semibold text-sm">Tukar Status:</label>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mb-1 p-1 bg-gray-50 rounded">
              Debug: Raw="{currentStatus}" → Normalized="{normalizedStatus}"
            </div>
          )}
          
          <select
            value={normalizedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className="text-slate-900 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-green-500 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {allOptions.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
              >
                {option.display}
              </option>
            ))}
          </select>
          
          <div className="text-xs text-gray-500 mt-1">
            Status "Selesai" dan "Batal" memerlukan catatan dan adalah muktamad.
          </div>
        </div>
      )}

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
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.previous_status)}`}>{getDisplayLabel(record.previous_status)}</span>
                            <span className="text-gray-400">→</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(record.new_status)}`}>{getDisplayLabel(record.new_status)}</span>
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
