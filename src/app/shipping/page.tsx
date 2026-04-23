import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Information | Pehchan',
  description: 'Shipping rates, delivery timeframes, and tracking information for Pehchan orders.',
};

const SHIPPING_RATES = [
  { zone: 'Lahore (same city)', time: '1–2 business days', rate: 'Rs 150' },
  { zone: 'Major Cities (Karachi, Islamabad, Rawalpindi)', time: '2–3 business days', rate: 'Rs 250' },
  { zone: 'Rest of Pakistan', time: '3–5 business days', rate: 'Rs 350' },
  { zone: 'Remote Areas (AJK, GB, FATA)', time: '5–8 business days', rate: 'Rs 500' },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 mb-3">Support</p>
        <h1 className="text-4xl font-black text-white mb-2">Shipping Information</h1>
        <p className="text-zinc-500 text-sm mb-12">Everything you need to know about how we get your order to you.</p>

        <div className="space-y-10 text-sm leading-7">

          <section>
            <h2 className="text-white font-bold text-lg mb-4">Delivery Rates &amp; Timeframes</h2>
            <p className="text-zinc-500 mb-5">Production takes 3–5 business days before your item ships. The following times are post-dispatch estimates.</p>
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900/60">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-zinc-500">Zone</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-zinc-500">Est. Delivery</th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-widest text-zinc-500">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {SHIPPING_RATES.map((row) => (
                    <tr key={row.zone} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="px-5 py-3.5 text-zinc-300">{row.zone}</td>
                      <td className="px-5 py-3.5 text-zinc-400">{row.time}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-white">{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-zinc-600 text-xs mt-3">* Free shipping on orders above Rs 10,000.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">Order Tracking</h2>
            <p className="text-zinc-400">Once your order ships, you will receive an SMS and email with a tracking number from our courier partner (TCS / Leopards). You can also track your order from your <a href="/profile" className="text-indigo-400 hover:underline">Wardrobe dashboard</a> or the <a href="/track-order" className="text-indigo-400 hover:underline">Order Tracking</a> page.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">Important Notes</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Orders are processed on business days (Monday–Saturday, excluding public holidays).</li>
              <li>Pehchan is not responsible for delays caused by the courier or natural events beyond our control.</li>
              <li>Ensure your shipping address is accurate at checkout — we cannot reroute packages once dispatched.</li>
              <li>For international shipping inquiries, email <a href="mailto:shipping@pehchan.pk" className="text-indigo-400 hover:underline">shipping@pehchan.pk</a>.</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
