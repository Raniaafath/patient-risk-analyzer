
import React, { useState } from 'react';
import { Feature, FeatureCard } from '@/components/Training/FeatureCard';
import { trainModel } from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Define available features
const AVAILABLE_FEATURES: Feature[] = [
  // Numerical Features
  { name: 'age', type: 'numerical', description: 'Patient age in years' },
  { name: 'Body_Mass_Index', type: 'numerical', description: 'Body Mass Index (BMI)' },
  { name: 'Mrs_admission', type: 'numerical', description: 'Modified Rankin Scale at admission' },
  { name: 'NIHSS_admission', type: 'numerical', description: 'NIH Stroke Scale at admission' },
  { name: 'cognitive_disorder', type: 'numerical', description: 'Cognitive Disorder Score' },

  // Categorical Features (Binary/Ordinal)
  { name: 'Gender', type: 'categorical', description: 'Patient gender' },
  { name: 'medical_insurance', type: 'categorical', description: 'Type of medical insurance' },
  { name: 'payment_method', type: 'categorical', description: 'Payment method' },
  { name: 'hypertension', type: 'categorical', description: 'History of hypertension' },
  { name: 'coronary_heart_disease', type: 'categorical', description: 'History of coronary heart disease' },
  { name: 'diabetes', type: 'categorical', description: 'History of diabetes' },
  { name: 'transient_ischemic_attack', type: 'categorical', description: 'History of transient ischemic attack' },
  { name: 'peripheral_arterial_disease', type: 'categorical', description: 'History of peripheral arterial disease' },
  { name: 'Postoperative_sequelae', type: 'categorical', description: 'Postoperative complications' },
  { name: 'atrial_fibrillation', type: 'categorical', description: 'History of atrial fibrillation' },
  { name: 'hyperlipidemia', type: 'categorical', description: 'History of hyperlipidemia' },
  { name: 'hyperhomocysteinemia', type: 'categorical', description: 'History of hyperhomocysteinemia' },
  { name: 'epilepsy', type: 'categorical', description: 'History of epilepsy' },
];

export default function Training() {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'completed' | 'error'>('idle');
  const [modelVersion, setModelVersion] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { toast } = useToast();

  const filteredFeatures = AVAILABLE_FEATURES.filter(feature => 
    feature.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    feature.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const numericalFeatures = filteredFeatures.filter(feature => feature.type === 'numerical');
  const categoricalFeatures = filteredFeatures.filter(feature => feature.type === 'categorical');

  const handleFeatureToggle = (featureName: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(featureName)) {
        return prev.filter(f => f !== featureName);
      } else {
        return [...prev, featureName];
      }
    });
  };

  const handleTrainModel = async () => {
    if (selectedFeatures.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one feature to train the model.",
        variant: "destructive",
      });
      return;
    }

    setTrainingStatus('training');

    try {
      const result = await trainModel(selectedFeatures);
      setModelVersion(result.version);
      setTrainingStatus('completed');
      toast({
        title: "Training Complete",
        description: `Model version ${result.version} has been successfully trained.`,
      });
    } catch (err) {
      console.error('Training error:', err);
      setTrainingStatus('error');
      toast({
        title: "Training Failed",
        description: err instanceof Error ? err.message : "An error occurred during model training",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Train New Model</h1>

      {trainingStatus === 'completed' && modelVersion && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="text-green-500 h-6 w-6 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-800">Training Completed Successfully</h3>
            <p className="text-green-700 mt-1">
              Model version {modelVersion} has been trained and is now available for predictions.
            </p>
            <div className="mt-4 flex space-x-4">
              <Button size="sm" variant="default" asChild>
                <a href="/prediction">Make Predictions</a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href="/models">View All Models</a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {trainingStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="text-red-500 h-6 w-6 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Training Failed</h3>
            <p className="text-red-700 mt-1">
              There was an error during the training process. Please try again with different features.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Select Features for Model Training</h2>
          <p className="text-gray-600 mb-6">
            Choose the features you want to use for training the model. Select features that you believe are most
            relevant for predicting patient risk outcomes.
          </p>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search features..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Selected Features: {selectedFeatures.length}
            </h3>
            {selectedFeatures.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedFeatures([])}
              >
                Clear Selection
              </Button>
            )}
          </div>

          <h3 className="font-medium text-gray-800 mb-3">Numerical Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {numericalFeatures.map((feature) => (
              <FeatureCard
                key={feature.name}
                feature={feature}
                selected={selectedFeatures.includes(feature.name)}
                onToggle={() => handleFeatureToggle(feature.name)}
              />
            ))}
          </div>

          <h3 className="font-medium text-gray-800 mb-3">Categorical Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoricalFeatures.map((feature) => (
              <FeatureCard
                key={feature.name}
                feature={feature}
                selected={selectedFeatures.includes(feature.name)}
                onToggle={() => handleFeatureToggle(feature.name)}
              />
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <Button
            onClick={handleTrainModel}
            disabled={trainingStatus === 'training' || selectedFeatures.length === 0}
            className="min-w-[150px]"
          >
            {trainingStatus === 'training' ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></span>
                Training...
              </>
            ) : (
              'Train Model'
            )}
          </Button>
          <p className="mt-2 text-sm text-gray-500">
            Training a model may take several minutes depending on the selected features.
          </p>
        </div>
      </div>
    </div>
  );
}
