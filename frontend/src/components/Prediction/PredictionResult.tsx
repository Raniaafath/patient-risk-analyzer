import React from 'react';
import { AlertCircle, CheckCircle, Info, Clock, BarChart3, List, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PredictionResponse } from '@/services/api';

interface PredictionResultProps {
  prediction: PredictionResponse;
  className?: string;
}

export function PredictionResult({ prediction, className }: PredictionResultProps) {
  // Configuration for each LOS class
  const classConfig = {
    0: {
      label: 'Short Stay (≤7 days)',
      description: 'This patient is predicted to have a short length of stay (7 days or fewer).',
      color: 'green',
      icon: CheckCircle,
      recommendations: [
        'Prepare for early discharge planning',
        'Focus on immediate post-stroke care',
        'Schedule follow-up outpatient appointments',
        'Review home care requirements'
      ],
      distribution: '22.8% of cases in dataset'
    },
    1: {
      label: 'Medium Stay (8–14 days)',
      description: 'This patient is predicted to have a medium length of stay (8 to 14 days).',
      color: 'yellow',
      icon: Clock,
      recommendations: [
        'Monitor recovery milestones closely',
        'Assess rehabilitation progress',
        'Plan for intermediate care needs',
        'Coordinate with rehabilitation team'
      ],
      distribution: '64% of cases in dataset'
    },
    2: {
      label: 'Long Stay (>14 days)',
      description: 'This patient is predicted to have a long length of stay (more than 14 days).',
      color: 'red',
      icon: AlertCircle,
      recommendations: [
        'Develop a comprehensive long-term care plan',
        'Initiate early rehabilitation assessment',
        'Consider social support needs and resources',
        'Plan for potential complications management'
      ],
      distribution: '13.2% of cases in dataset'
    }
  };

  const config = classConfig[prediction.prediction.class as keyof typeof classConfig];

  const colorStyles = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      recommendIcon: CheckCircle,
      recommendIconColor: 'text-green-500',
      barColor: 'bg-green-500'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      recommendIcon: Clock,
      recommendIconColor: 'text-yellow-500',
      barColor: 'bg-yellow-500'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      recommendIcon: AlertCircle,
      recommendIconColor: 'text-red-500',
      barColor: 'bg-red-500'
    }
  };

  const style = colorStyles[config.color as keyof typeof colorStyles];
  const RecommendIcon = style.recommendIcon;

  // Get all features and their importance
  const allFeatures = prediction.explanation.features.map((feature, index) => ({
    name: feature,
    importance: prediction.explanation?.feature_importance?.[feature] ?? 0,
    shapValue: prediction.explanation?.shap_values?.[prediction.prediction?.class]?.[index] ?? 0
  }));

  // Sort features by importance
  const sortedFeatures = allFeatures
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 5); // Show top 5 features

  return (
    <div 
      className={cn(
        "p-6 rounded-lg border animation-fade-in",
        style.bg,
        style.border,
        className
      )}
    >
      <div className="flex items-center">
        <div className="mr-4">
          <div className={cn("p-2 rounded-full", style.iconBg)}>
            <config.icon className={cn("h-8 w-8", style.iconColor)} />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">{config.label}</h2>
          <p className="text-gray-600">{config.description}</p>
          <p className="text-sm text-gray-500 mt-1">{config.distribution}</p>
          <p className="text-xs text-gray-400 mt-1">Model Version: {prediction.model_version}</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
        <h3 className="font-medium mb-4 flex items-center">
          <BarChart3 className="h-4 w-4 mr-2 text-gray-500" />
          Prediction Confidence
        </h3>
        <div className="space-y-3">
          {prediction.prediction.probabilities.map((prob, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{classConfig[idx as keyof typeof classConfig].label}</span>
                <span className="font-medium">{(prob * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all",
                    idx === prediction.prediction.class ? style.barColor : "bg-gray-300"
                  )}
                  style={{ width: `${prob * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
        <h3 className="font-medium mb-4 flex items-center">
          <Activity className="h-4 w-4 mr-2 text-gray-500" />
          Feature Impact Analysis
        </h3>
        <div className="space-y-3">
          {sortedFeatures.map((feature) => {
            const isPositive = feature.shapValue > 0;
            return (
              <div key={feature.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{feature.name.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {isPositive ? "↑" : "↓"} {Math.abs(feature.shapValue).toFixed(2)}
                    </span>
                    <span className="font-medium">{(feature.importance * 100).toFixed(1)}% impact</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full",
                      isPositive ? "bg-green-500" : "bg-red-500"
                    )}
                    style={{ width: `${feature.importance * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
        <h3 className="font-medium mb-3 flex items-center">
          <List className="h-4 w-4 mr-2 text-gray-500" />
          All Features Used ({prediction.explanation.features.length})
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {prediction.explanation.features.map((feature, index) => (
            <div key={index} className="flex items-center">
              <span className="text-gray-600">{feature.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
        <h3 className="font-medium mb-3 flex items-center">
          <Info className="h-4 w-4 mr-2 text-gray-500" />
          Recommended Actions
        </h3>
        
        <ul className="space-y-2 text-sm">
          {config.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start">
              <RecommendIcon className={cn("h-4 w-4 mr-2 mt-0.5 shrink-0", style.recommendIconColor)} />
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p className="flex items-center">
          <Info className="h-4 w-4 mr-2" />
          <span>This prediction is meant to support clinical decision-making and should not replace clinical judgment.</span>
        </p>
      </div>
    </div>
  );
}
