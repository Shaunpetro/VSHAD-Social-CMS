// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './components/providers';
import { SplashScreen } from './components/splash-screen';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'VSHAD RoboSocial',
  description: 'Automated AI-powered Social Media & Blog Posts content creation and calendar scheduler',
  icons: {
    icon: [
      { url: '/assets/icons/app-icon.png', sizes: '512x512' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SplashScreen>{children}</SplashScreen>
        </ThemeProvider>
      </body>
    </html>
  );
}