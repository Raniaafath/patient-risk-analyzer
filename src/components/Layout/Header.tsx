import React from 'react';
import { Bell, Search, BarChart3, Brain, User } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-card shadow-sm py-3 px-6 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-semibold text-foreground flex items-center">
          <Brain className="h-5 w-5 text-primary mr-2" />
          Patient Risk Analyzer
        </h1>
        <span className="hidden md:inline-flex items-center rounded-full bg-accent/15 px-2 py-1 text-xs font-medium text-accent">
          Alpha
        </span>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input 
            type="text" 
            placeholder="Search patients..." 
            className="pl-10 pr-4 py-2 rounded-full text-sm border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-48 transition-all duration-200 focus:w-64"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors">
            <BarChart3 className="h-5 w-5" />
          </button>
          
          <button className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
              3
            </span>
          </button>
          
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
