import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Returns & Exchanges | Pehchan' };

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 mb-3">Support</p>
        <h1 className="text-4xl font-black text-white mb-2">Returns &amp; Exchanges</h1>
        <p className="text-zinc-500 text-sm mb-12">We stand behind our quality. Here&apos;s how we handle issues.</p>
        <div className="space-y-10 text-sm leading-7">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '✅', title: 'Eligible', desc: 'Manufacturing defects, wrong item shipped, or significantly incorrect print.' },
              { icon: '❌', title: 'Not Eligible', desc: 'Custom POD orders without a defect, sizing errors after delivery, or buyer\'s remorse.' },
              { icon: '🕐', title: 'Time Window', desc: 'Report issues within 7 days of delivery with photo evidence.' },
            ].map((c) => (
              <div key={c.title} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                <div className="text-2xl mb-2">{c.icon}</div>
                <h3 className="font-bold text-white mb-1">{c.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
          <section>
            <h2 className="text-white font-bold text-lg mb-3">How to Request a Return</h2>
            <ol className="list-decimal pl-5 space-y-2 text-zinc-400">
              <li>Email <a href="mailto:Pehchan.help@gmail.com" className="text-indigo-400 hover:underline">Pehchan.help@gmail.com</a> within 7 days of receiving your order.</li>
              <li>Include your order number, description of the issue, and clear photos.</li>
              <li>Our team will review within 2 business days and respond with next steps.</li>
              <li>If approved, we will provide a return label or arrange a courier pickup.</li>
              <li>Upon receiving the item, we dispatch a replacement or issue a refund within 5 business days.</li>
            </ol>
          </section>
          <section>
            <h2 className="text-white font-bold text-lg mb-3">Refunds</h2>
            <p className="text-zinc-400">Approved refunds are processed to the original payment method (JazzCash / EasyPaisa / XPay) within 5–7 business days.</p>
          </section>
          <section>
            <h2 className="text-white font-bold text-lg mb-3">Size Exchanges</h2>
            <p className="text-zinc-400">Size exchanges on standard catalogue items are accepted within 7 days — unworn, unwashed, original packaging. Custom POD items are not eligible for size exchanges.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
