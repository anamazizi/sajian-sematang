'use client';

import { useState } from 'react';

interface OrderStatusControlProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => Promise<void>;
}

const STATUS_FLOW = ['PENDING', 'ACCEPTED', 'READY', 'DELIVERING', 'COMPLETED'];

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

  const getAvailableStatuses = () => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    
    if (currentStatus === 'COMPLETED') {
      return [{ value: 'COMPLETED', label: 'Completed' }];
    }
    
    if (currentStatus === 'CANCELLED') {
      return [
        { value: 'CANCELLED', label: 'Cancelled' },
        { value: 'PENDING', label: 'Reactivate to Pending' },
      ];
    }

    const available = [];
    const statusLabels = {
      PENDING: 'Pending',
      ACCEPTED: 'Accepted',
      READY: 'Ready',
      DELIVERING: 'Delivering',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancel Order'
    };

    available.push({ value: currentStatus, label: statusLabels[currentStatus as keyof typeof statusLabels] });

    if (currentIndex < STATUS_FLOW.length - 1) {
      const nextStatus = STATUS_FLOW[currentIndex + 1];
      available.push({ value: nextStatus, label: statusLabels[nextStatus as keyof typeof statusLabels] });
    }
    
    if (currentIndex > 0) {
      const prevStatus = STATUS_FLOW[currentIndex - 1];
      available.push({ value: prevStatus, label: `Revert to ${statusLabels[prevStatus as keyof typeof statusLabels]}` });
    }
    
    if (currentStatus !== 'CANCELLED') {
      available.push({ value: 'CANCELLED', label: 'Cancel Order' });
    }

    return available;
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
          {currentStatus}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {availableStatuses.map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            disabled={isUpdating || status.value === currentStatus}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              status.value === currentStatus
                ? 'bg-gray-100 text-gray-500 cursor-default'
                : 'bg-green-500 text-white hover:bg-green-600'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {status.label}
          </button>
        ))}
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