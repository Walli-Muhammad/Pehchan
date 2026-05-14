'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatus } from '@/actions/admin';

const ORDER_STATUSES = [
  { value: 'pending',          label: 'Pending' },
  { value: 'pending_payment',  label: 'Pending Payment' },
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'processing',       label: 'Processing' },
  { value: 'shipped',          label: 'Shipped' },
  { value: 'delivered',        label: 'Delivered' },
  { value: 'cancelled',        label: 'Cancelled' },
  { value: 'refunded',         label: 'Refunded' },
];

export default function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setSaved(false);
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus);
      setSaved(true);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        onChange={handleChange}
        disabled={isPending}
        className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      {isPending && <span className="text-zinc-500 text-xs">Saving…</span>}
      {saved && !isPending && <span className="text-emerald-400 text-xs">✓ Saved</span>}
    </div>
  );
}
