import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Contact Us | Pehchan', description: 'Get in touch with the Pehchan team.' };

const FAQS = [
  { q: 'How long does production take?', a: 'Custom POD orders take 3–5 business days to produce, then 2–4 days to deliver.' },
  { q: 'Can I cancel my order?', a: 'Cancellations are accepted within 2 hours of ordering. After production begins, cancellations are not possible.' },
  { q: 'What file format should I upload?', a: 'PNG with a transparent background gives the best print quality. JPEG is also accepted.' },
  { q: 'Do you ship internationally?', a: 'Currently we ship within Pakistan only. International shipping is on our roadmap — email us to register your interest.' },
  { q: 'How do I track my order?', a: 'Once shipped, you receive an SMS/email with a tracking number. You can also check your Wardrobe dashboard.' },
  { q: 'What payment methods do you accept?', a: 'JazzCash, EasyPaisa, and XPay. We do not accept cash on delivery for custom POD orders.' },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 mb-3">Get in Touch</p>
        <h1 className="text-4xl font-black text-white mb-2">Contact &amp; FAQ</h1>
        <p className="text-zinc-500 text-sm mb-12">We&apos;re a small team and we care. Expect a reply within 24 hours.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-white font-bold text-lg mb-6">Contact Details</h2>
            <div className="flex flex-col gap-5">
              {[
                { icon: '📍', label: 'Address', value: 'Plot 12-B, DHA Phase 6, Lahore, Pakistan' },
                { icon: '💬', label: 'WhatsApp', value: '+92 349 7839492', href: 'https://wa.me/923497839492' },
                { icon: '✉️', label: 'General', value: 'Pehchan.help@gmail.com', href: 'mailto:Pehchan.help@gmail.com' },
                { icon: '↩️', label: 'Returns', value: 'Pehchan.help@gmail.com', href: 'mailto:Pehchan.help@gmail.com' },
                { icon: '🔒', label: 'Privacy', value: 'Pehchan.help@gmail.com', href: 'mailto:Pehchan.help@gmail.com' },
                { icon: '🕒', label: 'Hours', value: 'Mon–Sat, 10:00am – 7:00pm PKT' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <span className="text-xl mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-600 mb-0.5">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-zinc-300 hover:text-white transition-colors text-sm">{item.value}</a>
                    ) : (
                      <p className="text-zinc-300 text-sm">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div>
            <h2 className="text-white font-bold text-lg mb-6">Frequently Asked Questions</h2>
            <div className="flex flex-col gap-5">
              {FAQS.map((faq) => (
                <div key={faq.q} className="border-b border-zinc-800/60 pb-5">
                  <h3 className="text-zinc-200 font-semibold mb-1.5 text-sm">{faq.q}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
