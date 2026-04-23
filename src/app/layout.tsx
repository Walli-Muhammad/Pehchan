import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';
import CustomCursor from '@/components/Interactions/CustomCursor';
import Navbar from '@/components/Navbar/Navbar';
import CartDrawer from '@/components/Cart/CartDrawer';
import CheckoutModal from '@/components/Checkout/CheckoutModal';
import SearchModal from '@/components/Search/SearchModal';
import Footer from '@/components/Footer/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Built Different | Pehchan Store',
  description: 'A premium, interactive clothing e-commerce experience.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-zinc-950 text-zinc-50 antialiased selection:bg-indigo-500 selection:text-white`}>
        {/* 
          Global App Chrome — mounted OUTSIDE SmoothScrollProvider to guarantee 
          z-index supremacy and avoid transform/filter containing block clipping.
        */}
        <CustomCursor />
        <Navbar />
        <CartDrawer />
        <CheckoutModal />
        <SearchModal />

        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
        <Footer />
      </body>
    </html>
  );
}
