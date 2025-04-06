
import React from 'react';
import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-gray-800">Patient Risk Analyzer</h1>
      
      <div className="flex items-center space-x-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 rounded-full text-sm border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <button className="relative text-gray-600 hover:text-gray-900">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
            3
          </span>
        </button>
        
      </div>
    </header>
  );
}
