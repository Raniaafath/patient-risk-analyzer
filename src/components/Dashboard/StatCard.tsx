
import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon, className, trend }: StatCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          
          {trend && (
            <div className={`mt-1 flex items-center text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span className="ml-1">{trend.value}% from previous</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="p-2 bg-blue-50 rounded-md">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
