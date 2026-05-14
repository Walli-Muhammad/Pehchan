import Link from 'next/link';
import { getOrders } from '@/actions/admin';
import { ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, string> = {
  pending:          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  pending_payment:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  payment_received: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  processing:       'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  shipped:          'bg-purple-500/10 text-purple-400 border-purple-500/20',
  delivered:        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled:        'bg-red-500/10 text-red-400 border-red-500/20',
  refunded:         'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const GATEWAY_LABELS: Record<string, string> = {
  cod:       '💵 COD',
  whatsapp:  '💬 JazzCash/EasyPaisa',
  safepay:   '🔒 Safepay',
};

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-indigo-400" />
            Orders
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            {orders.length} total order{orders.length !== 1 ? 's' : ''}. Click any row to view the invoice.
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-500">No orders yet. Orders will appear here once customers place them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950/50 text-zinc-400 uppercase tracking-widest text-[10px] border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Order</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Payment</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {orders.map((order) => {
                  const shortId = order.id.slice(0, 8).toUpperCase();
                  const statusStyle = STATUS_STYLES[order.status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700';
                  const date = new Date(order.created_at).toLocaleDateString('en-PK', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  });
                  return (
                    <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-zinc-300">#{shortId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{order.customer_name}</p>
                        <p className="text-xs text-zinc-500">{order.customer_phone}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        Rs. {Number(order.total_pkr).toLocaleString('en-PK')}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {GATEWAY_LABELS[order.gateway] ?? order.gateway}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${statusStyle}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-500">{date}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/orders/${order.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors">
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
