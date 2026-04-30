import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Pehchan',
  description: 'The terms governing your use of the Pehchan platform and purchases.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 mb-3">Legal</p>
        <h1 className="text-4xl font-black text-white mb-2">Terms &amp; Conditions</h1>
        <p className="text-zinc-500 text-sm mb-12">Last updated: April 23, 2025</p>

        <div className="space-y-10 text-sm leading-7">

          <section>
            <h2 className="text-white font-bold text-lg mb-3">1. Acceptance of Terms</h2>
            <p className="text-zinc-400">By accessing or purchasing from Pehchan (&quot;the Store&quot;), you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use the Store.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">2. Products &amp; Print-on-Demand</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>All products are made to order. Production begins immediately after payment confirmation.</li>
              <li>Custom-designed (POD) items are <strong className="text-zinc-200">non-refundable</strong> unless there is a manufacturing defect.</li>
              <li>Pehchan reserves the right to refuse any design that is offensive, violates copyright, or breaches Pakistani law.</li>
              <li>Color representation may vary slightly from screen to print due to monitor calibration.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">3. Pricing &amp; Payments</h2>
            <p className="text-zinc-400">All prices are listed in Pakistani Rupees (PKR). We accept JazzCash, EasyPaisa, and XPay. Prices include applicable taxes unless stated otherwise. Pehchan reserves the right to update pricing without prior notice.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">4. Order Processing</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Standard production time is 3–5 business days after payment verification.</li>
              <li>Delivery within Pakistan takes an additional 2–4 business days.</li>
              <li>Orders are confirmed via email. If you do not receive a confirmation within 24 hours, contact us.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">5. Intellectual Property</h2>
            <p className="text-zinc-400">By uploading designs to our studio, you confirm that you own the rights to the artwork or have permission to use it commercially. You grant Pehchan a limited, non-exclusive license to print and fulfill your order. Pehchan retains all rights to platform software, branding, and original designs.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">6. Limitation of Liability</h2>
            <p className="text-zinc-400">Pehchan&apos;s total liability for any claim arising from these terms shall not exceed the value of the disputed order. We are not liable for indirect, consequential, or incidental damages arising from use of the platform.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">7. Governing Law</h2>
            <p className="text-zinc-400">These Terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes shall be resolved in the courts of Lahore, Punjab.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">8. Contact</h2>
            <p className="text-zinc-400">Legal queries: <a href="mailto:Pehchan.help@gmail.com" className="text-indigo-400 hover:underline">Pehchan.help@gmail.com</a></p>
          </section>

        </div>
      </div>
    </div>
  );
}
