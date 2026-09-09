'use client';

import { useState } from 'react';

interface OrderStatusControlProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => Promise<void>;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Preparing' },
  { value: 'READY', label: 'Ready' },
  { value: 'DELIVERING', label: 'Delivering' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Preparing',
  READY: 'Ready',
  DELIVERING: 'Delivering',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function OrderStatusControl({
  orderId,
  currentStatus,
  onStatusUpdate,
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

  // Determine which status options are available based on current status
  const getAvailableStatuses = () => {
    // If order is COMPLETED, lock it (only show COMPLETED)
    if (currentStatus === 'COMPLETED') {
      return STATUS_OPTIONS.filter(opt => opt.value === 'COMPLETED');
    }

    // If order is CANCELLED, allow reactivation to PENDING
    if (currentStatus === 'CANCELLED') {
      return [
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'PENDING', label: 'Reactivate to Pending' },
      ];
    }

    // For other statuses, allow all status options except maybe restrict some illogical transitions?
    // We'll allow all options for simplicity; server-side validation will enforce business rules
    return STATUS_OPTIONS;
  };

  const availableStatuses = getAvailableStatuses();

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
          {STATUS_LABELS[currentStatus] || currentStatus}
        </span>
      </div>

      {/* Dropdown for status selection */}
      <div className="space-y-2">
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isUpdating || currentStatus === 'COMPLETED'}
          className="bg-white border border-slate-300 text-slate-900 font-semibold rounded-lg p-2 w-full focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {availableStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          Pilih status baru dari dropdown di atas. Status <strong>Completed</strong> dan <strong>Cancelled</strong> memerlukan nota.
        </p>
      </div>

      {showNotes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Masukkan nota (wajib untuk Completed/Cancelled)..."
            className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm mb-2"
            rows={2}
            required
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNotes(false)}
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