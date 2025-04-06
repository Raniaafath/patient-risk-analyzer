
import React from 'react';
import { ModelVersion } from '@/services/api';

interface ModelCardProps {
  model: ModelVersion;
}

export function ModelCard({ model }: ModelCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Model {model.version}</h3>
          <span className="text-xs text-gray-500">
            {new Date(model.trained_on).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center flex-1">
            <div className="text-xs text-gray-500 uppercase">Accuracy</div>
            <div className="mt-1 text-xl font-semibold">
              {(model.metrics.accuracy * 100).toFixed(1)}%
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="text-center flex-1">
            <div className="text-xs text-gray-500 uppercase">F1 Score</div>
            <div className="mt-1 text-xl font-semibold">
              {(model.metrics.f1 * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Training Details</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div className="text-gray-500">Data Size:</div>
              <div className="text-gray-900">{model.data_size.toLocaleString()} records</div>
              
              <div className="text-gray-500">Duration:</div>
              <div className="text-gray-900">{model.training_duration}</div>
              
              <div className="text-gray-500">Features:</div>
              <div className="text-gray-900">{model.feature_count}</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Top Features</h4>
            <div className="space-y-1">
              {model.top_features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{feature.feature}</span>
                  <span className="text-sm font-medium">{(feature.importance * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-md transition-colors w-full">
            View Complete Details
          </button>
        </div>
      </div>
    </div>
  );
}
