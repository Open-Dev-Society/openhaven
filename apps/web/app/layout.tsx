import type { Metadata } from 'next';
import { Outfit, Sixtyfour } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { SocketProvider } from '@/context/SocketContext';
import { Toaster } from 'sonner';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

const sixtyfour = Sixtyfour({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-logo',
});

export const metadata: Metadata = {
  title: 'OPENHAVEN - Code Snippet Manager',
  description: 'Share and discover code snippets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${sixtyfour.variable}`}>
      <head>
        {/* Removed manual Google Fonts links in favor of next/font */}
      </head>
      <body className="bg-slate-50 dark:bg-[#0a0a0a] font-sans antialiased text-slate-900 dark:text-slate-100">
        <Providers>
          <SocketProvider>
            {children}
            <Toaster position="bottom-right" theme="system" />
          </SocketProvider>
        </Providers>
        {/* Refined Grid Background Overlay */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            zIndex: -1,
            maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
          }}
        />
        <div className="fixed inset-0 pointer-events-none opacity-20 dark:opacity-10"
          style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(120, 119, 198, 0.3), transparent 50%)'
          }}
        />
      </body>
    </html>
  );
}
