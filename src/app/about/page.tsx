import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'About Us | Pehchan', description: 'The story behind Pehchan — Pakistan\'s premium print-on-demand streetwear brand.' };

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-400 mb-3">Company</p>
        <h1 className="text-4xl font-black text-white mb-6">About Pehchan</h1>

        <div className="space-y-8 text-sm leading-7">
          <p className="text-zinc-300 text-base leading-8">
            <span className="text-white font-bold">Pehchan</span> — Urdu for &ldquo;Identity&rdquo; — was founded in Lahore with one belief: your clothes should speak before you do.
          </p>
          <p className="text-zinc-400">
            We started as a small screen-printing workshop in DHA. Today we run Pakistan&apos;s most advanced print-on-demand platform, letting anyone — from artists to athletes to entrepreneurs — design premium streetwear in minutes and have it delivered to their door.
          </p>

          <div className="grid grid-cols-3 gap-4 my-8">
            {[
              { stat: '10,000+', label: 'Custom Designs Printed' },
              { stat: '50+ Cities', label: 'Across Pakistan' },
              { stat: '4.9 ★', label: 'Average Customer Rating' },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 text-center">
                <p className="text-2xl font-black text-white mb-1">{s.stat}</p>
                <p className="text-zinc-500 text-xs">{s.label}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">Our Mission</h2>
            <p className="text-zinc-400">To democratize fashion design in Pakistan — giving every creative the tools to build their brand without a minimum order quantity, without a massive upfront cost, and without compromise on quality.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">What We Stand For</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong className="text-zinc-200">Quality first.</strong> We use 180–220 GSM ring-spun cotton and professional DTG printers.</li>
              <li><strong className="text-zinc-200">Made in Pakistan.</strong> Every item is produced locally, supporting Pakistani craftspeople.</li>
              <li><strong className="text-zinc-200">No minimums.</strong> Order 1 piece or 1,000 — same great price per unit.</li>
              <li><strong className="text-zinc-200">Transparent pricing.</strong> No hidden fees. What you see is what you pay.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">The Team</h2>
            <p className="text-zinc-400">We are a passionate team of designers, engineers, and operations specialists based in Lahore. We are always looking for talented people — check our <a href="/careers" className="text-indigo-400 hover:underline">Careers</a> page if you want to build the future of fashion tech in Pakistan.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
