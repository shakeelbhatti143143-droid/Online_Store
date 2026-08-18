import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import '@/styles/globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LUXE ATELIER | Curated Luxury E-Commerce Platform',
  description: 'Precision engineered Swiss horology, audiophile planar monitors, artisan leather goods, and minimalist luxury essentials.',
  keywords: ['luxury store', 'swiss watches', 'audiophile headphones', 'leather goods', 'high-end audio', 'premium fashion'],
  authors: [{ name: 'Luxe Atelier International' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="bg-background text-gray-100 min-h-screen flex flex-col antialiased selection:bg-gold-500 selection:text-black">
        <AppProviders>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <CartDrawer />
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
