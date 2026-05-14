import { getOrderById } from '@/actions/admin';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import OrderStatusUpdater from './OrderStatusUpdater';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

const GATEWAY_LABELS: Record<string, string> = {
  cod:      'Cash on Delivery',
  whatsapp: 'JazzCash / EasyPaisa (WhatsApp)',
  safepay:  'Safepay',
};

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

export default async function OrderInvoicePage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) notFound();

  const shortId = order.id.slice(0, 8).toUpperCase();
  const date = new Date(order.created_at).toLocaleString('en-PK', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const statusStyle = STATUS_STYLES[order.status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700';

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <Link href="/admin/orders" className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1 mb-6">
        ← Back to Orders
      </Link>

      {/* Invoice Card */}
      <div id="invoice-content" className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900/40 to-zinc-900 px-8 py-6 border-b border-zinc-800 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 mb-1">Invoice</p>
            <h1 className="text-2xl font-black text-white">Order #{shortId}</h1>
            <p className="text-zinc-500 text-xs mt-1">{date}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${statusStyle} shrink-0`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Customer + Shipping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-zinc-800">
          <div className="px-8 py-6 border-r border-zinc-800">
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Customer</p>
            <p className="text-white font-semibold">{order.customer_name}</p>
            <p className="text-zinc-400 text-sm">{order.customer_email}</p>
            <p className="text-zinc-400 text-sm">{order.customer_phone}</p>
          </div>
          <div className="px-8 py-6">
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Ship To</p>
            <p className="text-zinc-300 text-sm">{order.address_line1}</p>
            <p className="text-zinc-300 text-sm">{order.city}, {order.province}</p>
            <p className="text-zinc-400 text-sm mt-2">
              Payment: <span className="text-white">{GATEWAY_LABELS[order.gateway] ?? order.gateway}</span>
            </p>
          </div>
        </div>

        {/* Line Items */}
        <div className="px-8 py-6 border-b border-zinc-800">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Items</p>
          <div className="space-y-3">
            {(order.order_items ?? []).map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 relative shrink-0 overflow-hidden">
                  {item.product_image_url ? (
                    <Image src={item.product_image_url} alt={item.product_title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">IMG</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.product_title}</p>
                  {item.is_pod && item.pod_customization && (
                    <p className="text-zinc-500 text-xs truncate">
                      POD: {Object.entries(item.pod_customization)
                        .filter(([k]) => !k.startsWith('_'))
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-zinc-400 text-xs">× {item.quantity}</p>
                  <p className="text-white text-sm font-semibold">
                    Rs. {(item.unit_price_pkr * item.quantity).toLocaleString('en-PK')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="px-8 py-6 border-b border-zinc-800">
          <div className="space-y-2 max-w-xs ml-auto text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>Rs. {Number(order.subtotal_pkr).toLocaleString('en-PK')}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Shipping</span>
              <span>Rs. {Number(order.shipping_pkr).toLocaleString('en-PK')}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-base border-t border-zinc-700 pt-2 mt-2">
              <span>Total</span>
              <span>Rs. {Number(order.total_pkr).toLocaleString('en-PK')}</span>
            </div>
          </div>
        </div>

        {/* Status Updater + Print */}
        <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Update Status</p>
            <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
          </div>
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
