'use client';

interface OrderStatusControlProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => Promise<void>;
}

export default function OrderStatusControl({
  orderId,
  currentStatus,
  onStatusUpdate,
}: OrderStatusControlProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="font-medium text-gray-700 mb-2">Order Status Control</h3>
      <p className="text-sm text-gray-500">Current status: {currentStatus}</p>
      <p className="text-xs text-gray-400 mt-2">Component under development</p>
    </div>
  );
}