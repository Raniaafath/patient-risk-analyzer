
import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PredictionResultProps {
  prediction: number;
  className?: string;
}

export function PredictionResult({ prediction, className }: PredictionResultProps) {
  const isHighRisk = prediction === 1;

  return (
    <div 
      className={cn(
        "p-6 rounded-lg border animation-fade-in",
        isHighRisk 
          ? "bg-red-50 border-red-200" 
          : "bg-green-50 border-green-200",
        className
      )}
    >
      <div className="flex items-center">
        <div className="mr-4">
          {isHighRisk ? (
            <div className="bg-red-100 p-2 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          ) : (
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold mb-1">
            {isHighRisk ? 'High Risk Patient' : 'Low Risk Patient'}
          </h2>
          <p className="text-gray-600">
            {isHighRisk 
              ? 'This patient is predicted to have a high risk of adverse outcomes.' 
              : 'This patient is predicted to have a low risk of adverse outcomes.'}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
        <h3 className="font-medium mb-3 flex items-center">
          <Info className="h-4 w-4 mr-2 text-gray-500" />
          Recommended Actions
        </h3>
        
        <ul className="space-y-2 text-sm">
          {isHighRisk ? (
            <>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 mr-2 text-red-500 mt-0.5 shrink-0" />
                <span>Consider more frequent monitoring and follow-up visits</span>
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 mr-2 text-red-500 mt-0.5 shrink-0" />
                <span>Review medication regimen for potential adjustments</span>
              </li>
              <li className="flex items-start">
                <XCircle className="h-4 w-4 mr-2 text-red-500 mt-0.5 shrink-0" />
                <span>Consider additional diagnostic tests or specialist referrals</span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 shrink-0" />
                <span>Continue with standard follow-up schedule</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 shrink-0" />
                <span>Maintain current treatment plan</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-0.5 shrink-0" />
                <span>Educate patient on maintaining healthy lifestyle</span>
              </li>
            </>
          )}
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
