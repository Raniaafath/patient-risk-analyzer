import React from 'react';
import { Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-4 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center text-muted-foreground text-sm">
          <div className="flex items-center">
            <span>&copy; {currentYear} Patient Risk Analyzer.</span>
            <span className="hidden md:inline-flex items-center ml-2">
              Made with <Heart className="h-3 w-3 text-destructive mx-1 animate-pulse-light" /> for better healthcare
            </span>
          </div>
          <div className="flex space-x-6 mt-2 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
