'use client';

import { useState } from 'react';

interface OrderStatusControlProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => Promise<void>;
  showTimeline?: boolean;
  onToggleTimeline?: (orderId: string) => void;
}

const STATUS_FLOW = ['PENDING', 'ACCEPTED', 'READY', 'DELIVERING', 'COMPLETED'];
const ALL_STATUSES = ['PENDING', 'ACCEPTED', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED'];

export default function OrderStatusControl({
  orderId,
  currentStatus,
  onStatusUpdate,
  showTimeline = false,
  onToggleTimeline,
}: OrderStatusControlProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [error, setError] = useState('');

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    setError('');
    
    try {
      if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
        setTargetStatus(newStatus);
        setShowNotes(true);
        setIsUpdating(false);
        return;
      }

      await onStatusUpdate(orderId, newStatus);
      
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Gagal mengemaskini status. Sila cuba lagi.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitWithNotes = async () => {
    if (!targetStatus) return;
    
    setIsUpdating(true);
    setError('');
    
    try {
      await onStatusUpdate(orderId, targetStatus, notes.trim());
      setShowNotes(false);
      setNotes('');
      setTargetStatus('');
    } catch (error) {
      console.error('Error updating status with notes:', error);
      setError('Gagal mengemaskini status. Sila cuba lagi.');
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelNotes = () => {
    setShowNotes(false);
    setNotes('');
    setTargetStatus('');
  };

  const statusLabels = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    READY: 'Ready',
    DELIVERING: 'Delivering',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
  };

  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    
    // Special handling for COMPLETED/CANCELLED
    if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
      setTargetStatus(newStatus);
      setShowNotes(true);
      return;
    }
    
    await handleStatusChange(newStatus);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Status:</span>
        <span className={`px-2 py-1 rounded text-sm font-medium ${
          currentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          currentStatus === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
          currentStatus === 'READY' ? 'bg-purple-100 text-purple-800' :
          currentStatus === 'DELIVERING' ? 'bg-orange-100 text-orange-800' :
          currentStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {currentStatus}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label htmlFor={`status-select-${orderId}`} className="text-sm font-medium text-gray-700">
            Tukar Status:
          </label>
          <select
            id={`status-select-${orderId}`}
            value={showNotes ? targetStatus || currentStatus : currentStatus}
            onChange={handleSelectChange}
            disabled={isUpdating}
            className={`px-3 py-1.5 text-sm border rounded-lg w-full max-w-xs ${
              isUpdating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {ALL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status as keyof typeof statusLabels]}
              </option>
            ))}
          </select>
        </div>

        {onToggleTimeline && (
          <button
            onClick={() => onToggleTimeline(orderId)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {showTimeline ? '▼' : '▶'} Lihat Sejarah Pesanan / Timeline
          </button>
        )}
      </div>

      {showNotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Masukkan nota..."
            className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm mb-2"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelNotes}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
            >
              Batal
            </button>
            <button
              onClick={handleSubmitWithNotes}
              disabled={!notes.trim()}
              className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-lg"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}