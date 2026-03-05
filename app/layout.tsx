import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/NavBar';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SunshineTracker — Public Records Case Research',
  description: 'Track and analyze court cases involving FOIA, sunshine laws, and public records access',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body>
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
