
import React from 'react';

interface StatItemProps {
  label: string;
  value: string | number;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-gray-600 text-sm">{label}:</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

interface StatisticsCardProps {
  title: string;
  items: { label: string; value: string | number }[];
}

export function StatisticsCard({ title, items }: StatisticsCardProps) {
  return (
    <div className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
      <h3 className="font-medium text-gray-800 mb-4 pb-2 border-b">{title}</h3>
      <div className="space-y-1">
        {items.map((item, index) => (
          <StatItem key={index} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
}
