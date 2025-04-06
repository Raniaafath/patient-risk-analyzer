
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
}

export function FeatureCard({ feature, selected, onToggle }: FeatureCardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-lg border p-4 cursor-pointer transition-all duration-200",
        selected 
          ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50" 
          : "border-gray-200 hover:border-blue-300"
      )}
      onClick={onToggle}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">
          {feature.name.replace(/_/g, ' ')}
        </h3>
        {selected && (
          <div className="bg-blue-500 rounded-full p-0.5">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
      
      <span className={cn(
        "text-xs font-medium px-2 py-1 rounded-full",
        feature.type === 'numerical' 
          ? "bg-purple-100 text-purple-800" 
          : "bg-indigo-100 text-indigo-800"
      )}>
        {feature.type}
      </span>
    </div>
  );
}
