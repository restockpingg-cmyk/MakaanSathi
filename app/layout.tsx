import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'BrokerBook', template: '%s | BrokerBook' },
  description: 'CRM for independent real estate brokers in Mumbai',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
