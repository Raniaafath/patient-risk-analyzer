import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Colorful accent strip at the top of the page - visible on mobile */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-secondary md:hidden"></div>

      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Colorful accent strip at the top of the content section - visible on desktop */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-secondary hidden md:block"></div>
        
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="container mx-auto animate-fade-in">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
