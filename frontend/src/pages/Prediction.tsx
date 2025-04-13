import React, { useState, useEffect } from 'react';
import { ModelVersion, getModelVersions, PredictionResponse } from '@/services/api';
import { PredictionForm } from '@/components/Prediction/PredictionForm';
import { PredictionResult } from '@/components/Prediction/PredictionResult';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

// Default empty model version to prevent undefined errors
const defaultModelVersion: ModelVersion = {
  version: '0.0.0',
  trained_on: new Date().toISOString(),
  feature_count: 0,
  features: [],
  metrics: {
    accuracy: 0,
    f1: 0
  },
  top_features: [],
  classification_report: {},
  saved_to: '',
  data_size: 0,
  training_duration: '0s',
  selected_features: []
};

export default function Prediction() {
  const [modelVersions, setModelVersions] = useState<ModelVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    const fetchModelVersions = async () => {
      try {
        console.log('🔄 Fetching model versions for prediction...');
        const models = await getModelVersions();
        console.log('✅ Model versions received:', models);
        setModelVersions(models);
        
        if (models.length > 0) {
          setSelectedVersion(models[0].version);
        }
      } catch (err) {
        console.error('❌ Error fetching models:', err);
        toast({
          title: "Error",
          description: "Failed to fetch model versions. Using empty list.",
          variant: "destructive",
        });
        // Keep using empty array instead of throwing
      } finally {
        setLoading(false);
      }
    };

    fetchModelVersions();
  }, []);

  // Safely find the selected model with a fallback
  const selectedModel = modelVersions.find(m => m?.version === selectedVersion) || defaultModelVersion;

  const handlePredictionResult = (result: PredictionResponse) => {
    setPrediction(result);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4 text-gray-600">Loading model data...</p>
        </div>
      </div>
    );
  }

  if (modelVersions.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <p className="text-xl text-red-600 mb-4">No models available</p>
          <p className="text-gray-600">Please train a model first before making predictions.</p>
          <a 
            href="/training" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Training
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Patient Risk Prediction</h1>

      {prediction && (
        <PredictionResult prediction={prediction} className="mb-8" />
      )}
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Select Model Version</h2>
          <div className="max-w-xs">
            <Select
              value={selectedVersion}
              onValueChange={(value) => {
                setSelectedVersion(value);
                setPrediction(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model version" />
              </SelectTrigger>
              <SelectContent>
                {modelVersions.map((model) => (
                  <SelectItem key={model?.version || 'unknown'} value={model?.version || ''}>
                    Version {model?.version || 'unknown'} ({((model?.metrics?.accuracy || 0) * 100).toFixed(1)}% accuracy)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {selectedModel && (
          <div className="mb-8 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Model Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Accuracy</p>
                <p className="font-medium">{((selectedModel?.metrics?.accuracy || 0) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Trained on</p>
                <p className="font-medium">{new Date(selectedModel?.trained_on || new Date()).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Features</p>
                <p className="font-medium">{selectedModel?.selected_features?.length || 0}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Required Features:</p>
              <div className="flex flex-wrap gap-2">
                {(selectedModel?.selected_features || []).map(feature => (
                  <Badge key={feature} variant="outline" className="bg-white">
                    {feature?.replace(/_/g, ' ') || 'Unknown'}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {selectedModel && (
          <div>
            <h2 className="text-lg font-medium mb-4">Enter Patient Data</h2>
            <PredictionForm 
              modelVersion={selectedVersion}
              features={selectedModel?.selected_features || []}
              onPredictionResult={handlePredictionResult}
            />
          </div>
        )}
      </div>
    </div>
  );
}
