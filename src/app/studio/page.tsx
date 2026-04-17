import type { Metadata } from 'next';
import CanvasEditor from '@/components/Studio/CanvasEditor';

export const metadata: Metadata = {
  title: 'Studio | Pehchan',
  description: 'Design your own premium wear with our native POD studio.',
};

export default function StudioPage() {
  return (
    <main className="w-full h-screen bg-[#09090b] selection:bg-white selection:text-black">
      <CanvasEditor />
    </main>
  );
}