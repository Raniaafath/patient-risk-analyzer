import React, { useState, useEffect, useRef } from 'react';
import { Feature, FeatureCard } from '@/components/Training/FeatureCard';
import {
  trainModel,
  getTrainingStatus,
  TrainInitiationResponse,
  TrainingStatus,
} from '@/services/api'; // Import new types and function
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, CheckCircle, Search, Loader2 } from 'lucide-react'; // Added Loader2
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress'; // Import Progress component

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
  { name: 'respiratory_tract_infection', type: 'categorical', description: 'History of respiratory tract infection' },
  { name: 'dizziness', type: 'categorical', description: 'History of dizziness' },
  { name: 'trauma', type: 'categorical', description: 'History of trauma' },
  { name: 'hemiplegia', type: 'categorical', description: 'Presence of hemiplegia' },
  { name: 'aphasia', type: 'categorical', description: 'Presence of aphasia' },
  { name: 'marital_status', type: 'categorical', description: 'Marital status' },
  { name: 'occupation', type: 'categorical', description: 'Patient occupation category' },
  { name: 'critical', type: 'categorical', description: 'Whether the patient condition is critical' },
  { name: 'operation', type: 'categorical', description: 'Whether the patient underwent an operation' },
];

// Map status strings to progress percentages (approximation)
const statusProgressMap: { [key: string]: number } = {
  QUEUED: 5,
  STARTING: 10,
  SETUP_COMPLETE: 15,
  LOADING_DATA: 20,
  PREPROCESSING: 30,
  SPLITTING_DATA: 40,
  SAVING_DATA: 45,
  TRAINING_MODEL: 60,
  EVALUATING_MODEL: 80,
  SAVING_MODEL: 85,
  ANALYZING_FEATURES: 90,
  SAVING_METADATA: 95,
  COMPLETED: 100,
  FAILED: 0, // Indicate failure clearly
};

export default function Training() {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [currentTrainingStatus, setCurrentTrainingStatus] = useState<TrainingStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollingIntervalId = useRef<NodeJS.Timeout | null>(null); // Use ref to avoid issues with state in interval
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { toast } = useToast();

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalId.current) {
        clearInterval(pollingIntervalId.current);
        console.log("Cleared polling interval on unmount.");
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollingIntervalId.current) {
      clearInterval(pollingIntervalId.current);
      pollingIntervalId.current = null;
      console.log("Stopped polling.");
    }
  };

  const startPolling = (currentTaskId: string) => {
    stopPolling(); // Ensure no duplicate intervals

    pollingIntervalId.current = setInterval(async () => {
      if (!currentTaskId) {
        stopPolling();
        return;
      }
      try {
        console.log(`Polling status for task: ${currentTaskId}`);
        const status = await getTrainingStatus(currentTaskId);
        setCurrentTrainingStatus(status);

        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          stopPolling();
          // Optionally show a final toast message
          if (status.status === 'COMPLETED') {
             toast({
               title: "Training Complete",
               description: `Model version ${status.version} is ready.`,
               className: "bg-green-100 border-green-300"
             });
          } else {
             toast({
               title: "Training Failed",
               description: status.error || "An unknown error occurred.",
               variant: "destructive",
             });
          }
        }
      } catch (error) {
        console.error('Error fetching training status:', error);
        setErrorMessage(`Error fetching training status: ${error instanceof Error ? error.message : String(error)}`);
        stopPolling(); // Stop polling on error
      }
    }, 5000); // Poll every 5 seconds
    console.log(`Started polling for task: ${currentTaskId}`);
  };

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

    // Reset state before starting new training
    setTaskId(null);
    setCurrentTrainingStatus(null);
    setErrorMessage(null);
    stopPolling(); // Clear any existing interval

    // Set initial status immediately
     setCurrentTrainingStatus({ status: 'INITIATING', message: 'Sending training request...' });

    try {
      console.log("Initiating training...");
      const result: TrainInitiationResponse = await trainModel(selectedFeatures);
      console.log("Training initiated, Task ID:", result.task_id);
      setTaskId(result.task_id);
      setCurrentTrainingStatus({ status: 'QUEUED', message: 'Training task is queued.' }); // Update status
      startPolling(result.task_id); // Start polling
    } catch (err) {
      console.error('Training initiation error:', err);
      const errorMsg = err instanceof Error ? err.message : "Failed to initiate training task";
      setErrorMessage(errorMsg);
       setCurrentTrainingStatus(null); // Clear initiating status on error
      toast({
        title: "Initiation Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  // Determine if training is actively running (polling)
  const isTrainingActive = pollingIntervalId.current !== null;
  const progressValue = currentTrainingStatus?.status ? statusProgressMap[currentTrainingStatus.status] ?? 0 : 0;

  const filteredFeatures = AVAILABLE_FEATURES.filter(feature =>
    feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feature.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const numericalFeatures = filteredFeatures.filter(feature => feature.type === 'numerical');
  const categoricalFeatures = filteredFeatures.filter(feature => feature.type === 'categorical');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Train New Model</h1>

      {/* --- Status Display Area --- */}
      {taskId && currentTrainingStatus && (
        <div className={`border rounded-lg p-4 ${currentTrainingStatus.status === 'FAILED' ? 'bg-red-50 border-red-200' : currentTrainingStatus.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-start">
            {currentTrainingStatus.status === 'COMPLETED' && <CheckCircle className="text-green-500 h-6 w-6 mt-0.5 mr-3 flex-shrink-0" />}
            {currentTrainingStatus.status === 'FAILED' && <AlertCircle className="text-red-500 h-6 w-6 mt-0.5 mr-3 flex-shrink-0" />}
            {isTrainingActive && currentTrainingStatus.status !== 'COMPLETED' && currentTrainingStatus.status !== 'FAILED' && <Loader2 className="text-blue-500 h-6 w-6 mt-0.5 mr-3 flex-shrink-0 animate-spin" />}

            <div>
              <h3 className={`font-medium ${currentTrainingStatus.status === 'FAILED' ? 'text-red-800' : currentTrainingStatus.status === 'COMPLETED' ? 'text-green-800' : 'text-blue-800'}`}>
                Training Status: {currentTrainingStatus.status}
              </h3>
              {currentTrainingStatus.message && <p className={`mt-1 ${currentTrainingStatus.status === 'FAILED' ? 'text-red-700' : currentTrainingStatus.status === 'COMPLETED' ? 'text-green-700' : 'text-blue-700'}`}>{currentTrainingStatus.message}</p>}
              {currentTrainingStatus.status === 'FAILED' && currentTrainingStatus.error && <p className="text-red-700 mt-1">Error: {currentTrainingStatus.error}</p>}

              {/* Progress Bar */}
              {isTrainingActive && currentTrainingStatus.status !== 'COMPLETED' && currentTrainingStatus.status !== 'FAILED' && (
                 <div className="mt-3">
                   <Progress value={progressValue} className="w-full h-2" />
                   <p className="text-xs text-blue-600 mt-1">{progressValue}% complete (estimated)</p>
                 </div>
              )}

              {/* Completion Details & Links */}
              {currentTrainingStatus.status === 'COMPLETED' && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-green-700">Model Version: <strong>{currentTrainingStatus.version}</strong></p>
                  {/* Add more details if needed: metrics, duration etc. */}
                   <div className="flex space-x-4">
                     <Button size="sm" variant="default" asChild>
                       <a href="/prediction">Make Predictions</a>
                     </Button>
                     <Button size="sm" variant="outline" asChild>
                       <a href="/models">View All Models</a>
                     </Button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Display Initiation Error --- */}
       {errorMessage && !currentTrainingStatus && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="text-red-500 h-6 w-6 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-red-700 mt-1">{errorMessage}</p>
            </div>
          </div>
       )}


      {/* --- Feature Selection Area (Only show if not completed) --- */}
      {currentTrainingStatus?.status !== 'COMPLETED' && (
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
                    disabled={isTrainingActive} // Disable search while training
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
                     disabled={isTrainingActive} // Disable clear while training
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
                    onToggle={() => !isTrainingActive && handleFeatureToggle(feature.name)} // Disable toggle while training
                    disabled={isTrainingActive}
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
                    onToggle={() => !isTrainingActive && handleFeatureToggle(feature.name)} // Disable toggle while training
                    disabled={isTrainingActive}
                  />
                ))}
              </div>
            </div>

          <div className="pt-6 border-t border-gray-100">
            <Button
              onClick={handleTrainModel}
              disabled={isTrainingActive || selectedFeatures.length === 0}
              className="min-w-[150px]"
            >
              {isTrainingActive ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Training...
                </>
              ) : (
                'Train Model'
              )}
            </Button>
            <p className="mt-2 text-sm text-gray-500">
               {isTrainingActive ? "Training is in progress. You can navigate away, the process will continue." : "Training may take several minutes."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
