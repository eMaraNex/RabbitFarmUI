import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import NotistackProvider from '@/lib/snackbar';
import { ThemeProvider } from '@/lib/theme-context';
import { CurrencyProvider } from '@/lib/currency-context';
import { JSX, ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Farming Management',
  description: 'Software created to help manage farming operations.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NotistackProvider>
            <CurrencyProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </CurrencyProvider>
          </NotistackProvider>
        </AuthProvider>
      </body>
    </html>
  );
}