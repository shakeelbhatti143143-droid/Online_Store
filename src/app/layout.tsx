import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import '@/styles/globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import PublicChatWidget from '@/components/chatbot/PublicChatWidget';

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
  description:
    'Precision engineered Swiss horology, audiophile planar monitors, artisan leather goods, and minimalist luxury essentials.',
  keywords: [
    'luxury store',
    'swiss watches',
    'audiophile headphones',
    'leather goods',
    'high-end audio',
    'premium fashion',
  ],
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${outfit.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedTheme = localStorage.getItem('luxe_theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-[#070B12] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased selection:bg-amber-500 selection:text-white transition-colors duration-300">
        <AppProviders>
          <Navbar />

          <main className="flex-1">
            {children}
          </main>

          <CartDrawer />

          {/* Public Chatbot Widget */}
          <PublicChatWidget />

          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}