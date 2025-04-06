
import React, { useState } from 'react';
import { PatientData, getPrediction } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PredictionFormProps {
  modelVersion: string;
  features: string[];
  onPredictionResult: (result: number) => void;
}

export function PredictionForm({ modelVersion, features, onPredictionResult }: PredictionFormProps) {
  const [patientData, setPatientData] = useState<PatientData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPatientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate all required fields are filled
      const missingFields = features.filter(f => !patientData[f]);
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      const result = await getPrediction(modelVersion, patientData);
      onPredictionResult(result.prediction);
      toast({
        title: "Prediction Complete",
        description: "The patient risk analysis has been completed.",
      });
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: "Prediction Failed",
        description: error instanceof Error ? error.message : "An error occurred during prediction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group features by type for better organization
  const clinicalFeatures = features.filter(f => 
    ['age', 'Body_Mass_Index', 'Mrs_admission', 'NIHSS_admission'].includes(f)
  );
  
  const demographicFeatures = features.filter(f => 
    ['Gender', 'medical_insurance', 'payment_method', 'marital_status', 'occupation'].includes(f)
  );
  
  const medicalHistoryFeatures = features.filter(f => 
    !clinicalFeatures.includes(f) && !demographicFeatures.includes(f)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {clinicalFeatures.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Clinical Measurements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinicalFeatures.map((feature) => (
              <div key={feature} className="space-y-2">
                <Label htmlFor={feature}>{feature.replace(/_/g, ' ')}</Label>
                <Input
                  id={feature}
                  name={feature}
                  type="number"
                  step="any"
                  value={patientData[feature] || ''}
                  onChange={handleInputChange}
                  placeholder={`Enter ${feature.replace(/_/g, ' ')}`}
                  required
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {demographicFeatures.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Demographics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demographicFeatures.map((feature) => (
              <div key={feature} className="space-y-2">
                <Label htmlFor={feature}>{feature.replace(/_/g, ' ')}</Label>
                <Input
                  id={feature}
                  name={feature}
                  type="number"
                  value={patientData[feature] || ''}
                  onChange={handleInputChange}
                  placeholder={`Enter ${feature.replace(/_/g, ' ')}`}
                  required
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {medicalHistoryFeatures.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Medical History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medicalHistoryFeatures.map((feature) => (
              <div key={feature} className="space-y-2">
                <Label htmlFor={feature}>{feature.replace(/_/g, ' ')}</Label>
                <Input
                  id={feature}
                  name={feature}
                  type="number"
                  value={patientData[feature] || ''}
                  onChange={handleInputChange}
                  placeholder={`Enter ${feature.replace(/_/g, ' ')} (0/1)`}
                  required
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Analyze Patient Risk'}
        </Button>
      </div>
    </form>
  );
}
