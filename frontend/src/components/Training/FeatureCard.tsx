import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Feature {
  name: string;
  type: 'numerical' | 'categorical';
  description: string;
}

interface FeatureCardProps {
  feature: Feature;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function FeatureCard({ feature, selected, onToggle, disabled = false }: FeatureCardProps) {
  
  const handleToggle = () => {
    if (!disabled) {
      onToggle();
    }
  };
  
  return (
    <div 
      className={cn(
        "bg-white rounded-lg border p-4 transition-all duration-200",
        disabled 
          ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
          : [
              selected 
                ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50 cursor-pointer" 
                : "border-gray-200 hover:border-blue-300 cursor-pointer"
            ]
      )}
      onClick={handleToggle}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={cn("font-medium", disabled ? "text-gray-500" : "text-gray-900")}>
          {feature.name.replace(/_/g, ' ')}
        </h3>
        {selected && (
          <div className={cn(
              "rounded-full p-0.5",
              disabled ? "bg-gray-400" : "bg-blue-500"
          )}>
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      
      <p className={cn("text-sm mb-3", disabled ? "text-gray-400" : "text-gray-600")}>{feature.description}</p>
      
      <span className={cn(
        "text-xs font-medium px-2 py-1 rounded-full",
        disabled
          ? "bg-gray-200 text-gray-500"
          : feature.type === 'numerical' 
            ? "bg-purple-100 text-purple-800" 
            : "bg-indigo-100 text-indigo-800"
      )}>
        {feature.type}
      </span>
    </div>
  );
}
