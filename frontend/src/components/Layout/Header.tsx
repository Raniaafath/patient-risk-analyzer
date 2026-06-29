import React from 'react';
import { Brain, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/prediction': 'Prediction',
  '/training': 'Training',
  '/models': 'Models',
};

export function Header() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] ?? 'Patient Risk Analyzer';

  return (
    <header className="bg-card shadow-sm py-3 px-6 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Brain className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>

      <div className="flex items-center space-x-3">
        <span className="hidden md:inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
          Ischemic Stroke LOS Predictor
        </span>
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
}
