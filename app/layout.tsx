import type { Metadata, Viewport } from 'next';
import '@/styles/tailwind.css';
import '@/styles/global.css';
import '@/styles/landing.css';

export const metadata: Metadata = {
  title: 'Kitsunova | Web moderna',
  description:
    'Nueva base de WebKitsunova en Next.js, TypeScript, Prisma y PostgreSQL.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
