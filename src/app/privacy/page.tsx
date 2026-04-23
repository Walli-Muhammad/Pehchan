import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Pehchan',
  description: 'Learn how Pehchan collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 mb-3">Legal</p>
        <h1 className="text-4xl font-black text-white mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-12">Last updated: April 23, 2025</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-10 text-sm leading-7">

          <section>
            <h2 className="text-white font-bold text-lg mb-3">1. Who We Are</h2>
            <p>Pehchan (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a print-on-demand clothing brand based in Lahore, Pakistan. Our registered address is Plot 12-B, DHA Phase 6, Lahore. You can reach our privacy team at <a href="mailto:privacy@pehchan.pk" className="text-indigo-400 hover:underline">privacy@pehchan.pk</a>.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong className="text-zinc-200">Account Data:</strong> Your name, email address, and hashed password when you create a Wardrobe account.</li>
              <li><strong className="text-zinc-200">Order Data:</strong> Billing name, shipping address, phone number, and payment reference (we never store card details — payments are handled by JazzCash / EasyPaisa / XPay).</li>
              <li><strong className="text-zinc-200">Design Data:</strong> Canvas snapshots you choose to save to your Wardrobe.</li>
              <li><strong className="text-zinc-200">Usage Data:</strong> Pages visited, browser type, device, and IP address via server logs and optional analytics.</li>
              <li><strong className="text-zinc-200">Cookies:</strong> Session tokens and optional preference cookies. See our Cookie Policy for details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>To process and fulfill your orders and send shipping updates.</li>
              <li>To maintain and secure your account.</li>
              <li>To personalize your experience and remember saved designs.</li>
              <li>To send marketing emails if you have opted in (unsubscribe any time).</li>
              <li>To comply with Pakistani law and prevent fraud.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">4. Data Sharing</h2>
            <p className="text-zinc-400">We do not sell your personal data. We share it only with trusted service providers strictly for operating our platform: Supabase (database), Cloudinary (image storage), and payment gateways (JazzCash, EasyPaisa, XPay). All providers are contractually bound to data confidentiality.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">5. Data Retention</h2>
            <p className="text-zinc-400">Order data is retained for 7 years to comply with Pakistani tax and commerce regulations. Account data is retained until you request deletion. Saved designs are deleted when you delete them or close your account.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">6. Your Rights</h2>
            <p className="text-zinc-400">You may request access to, correction of, or deletion of your personal data at any time by emailing <a href="mailto:privacy@pehchan.pk" className="text-indigo-400 hover:underline">privacy@pehchan.pk</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">7. Security</h2>
            <p className="text-zinc-400">We use industry-standard encryption (TLS 1.2+) for data in transit and row-level security in our database. Authentication is handled by Supabase Auth with bcrypt password hashing.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">8. Changes to This Policy</h2>
            <p className="text-zinc-400">We may update this policy periodically. We will notify registered users via email of material changes. Continued use of the platform after the effective date constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">9. Contact</h2>
            <p className="text-zinc-400">For any privacy-related questions: <a href="mailto:privacy@pehchan.pk" className="text-indigo-400 hover:underline">privacy@pehchan.pk</a> | +92 300 123 4567</p>
          </section>

        </div>
      </div>
    </div>
  );
}
