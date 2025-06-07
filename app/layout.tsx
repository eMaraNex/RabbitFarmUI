import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import NotistackProvider from '@/lib/snackbar';
import { JSX, ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Karagani Farming Management',
  description: 'Software created to help manage Karagani farming operations.',
};

/**
 * Root layout component for the Next.js app.
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} HTML structure with providers
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NotistackProvider>
            {children}
          </NotistackProvider>
        </AuthProvider>
      </body>
    </html>
  );
}