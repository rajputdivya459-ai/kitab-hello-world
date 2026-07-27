import { ReactNode } from 'react';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { FloatingWhatsApp } from '@/components/public/FloatingWhatsApp';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/[0.03] via-background to-primary/[0.05]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
