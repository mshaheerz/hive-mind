import './globals.css';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata = /** @type {Metadata} */ ({
  title: 'PR Review Hub',
  description: 'Aggregate GitHub pull requests across repositories',
});

export default function RootLayout({ children, session }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
