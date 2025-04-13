import React, { useState } from 'react';
import { PatientData, getPrediction, PredictionResponse } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PredictionFormProps {
  modelVersion: string;
  features: string[];
  onPredictionResult: (result: PredictionResponse) => void;
}

type RangeRule = {
  min: number;
  max: number;
  message: string;
  type: 'range';
};

type ValuesRule = {
  values: number[];
  message: string;
  type: 'values';
};

type ValidationRule = RangeRule | ValuesRule;

// Validation rules for clinical measurements
const validationRules: Record<string, ValidationRule> = {
  age: { type: 'range', min: 1, max: 199, message: "Age must be between 1 and 199 years old" },
  Body_Mass_Index: { type: 'range', min: 15, max: 40, message: "BMI must be between 15 and 40" },
  Mrs_admission: { type: 'range', min: 0, max: 5, message: "MRS admission score must be between 0 and 5" },
  NIHSS_admission: { type: 'range', min: 0, max: 42, message: "NIHSS admission score must be between 0 and 42" },
  Gender: { type: 'values', values: [1,2], message: "Gender must be 0 (Female) or 1 (Male)" }
};

export function PredictionForm({ modelVersion, features = [], onPredictionResult }: PredictionFormProps) {
  const [patientData, setPatientData] = useState<PatientData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name: string, value: string): boolean => {
    const numValue = parseFloat(value);
    const rules = validationRules[name];
    
    if (!rules) return true;

    if (rules.type === 'values') {
      if (!rules.values.includes(numValue)) {
        toast({
          title: "Invalid Value",
          description: rules.message,
          variant: "destructive",
        });
        return false;
      }
    } else {
      if (numValue < rules.min || numValue > rules.max) {
        toast({
          title: "Invalid Value",
          description: rules.message,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (value === '') {
      setPatientData(prev => ({
        ...prev,
        [name]: value
      }));
      return;
    }

    if (validateField(name, value)) {
      setPatientData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('🔄 Submitting prediction request...');
      console.log('📊 Patient data:', patientData);
      console.log('🔍 Model version:', modelVersion);
      
      // Validate all required fields are filled
      const missingFields = features.filter(f => !patientData[f]);
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      // Validate all fields
      for (const [field, value] of Object.entries(patientData)) {
        if (!validateField(field, value.toString())) {
          throw new Error(`Invalid value for ${field}`);
        }
      }

      const result = await getPrediction(modelVersion, patientData);
      console.log('✅ Prediction result:', result);
      
      onPredictionResult(result);
      toast({
        title: "Prediction Complete",
        description: `${result.prediction.class_label} predicted.`,
      });
    } catch (error) {
      console.error('❌ Prediction error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message.replace('Error: ', '')
        : "An error occurred during prediction";
      
      toast({
        title: "Prediction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group features by type for better organization with null checks
  const clinicalFeatures = features.filter(f => 
    f && ['age', 'Body_Mass_Index', 'Mrs_admission', 'NIHSS_admission'].includes(f)
  );
  
  const demographicFeatures = features.filter(f => 
    f && ['Gender', 'medical_insurance', 'payment_method', 'marital_status', 'occupation'].includes(f)
  );
  
  const medicalHistoryFeatures = features.filter(f => 
    f && !clinicalFeatures.includes(f) && !demographicFeatures.includes(f)
  );

  const getInputProps = (feature: string) => {
    const rules = validationRules[feature];
    const props: any = {
      id: feature,
      name: feature,
      type: "number",
      step: "any",
      value: patientData[feature] || '',
      onChange: handleInputChange,
      required: true
    };

    if (rules) {
      if (rules.type === 'range') {
        props.min = rules.min;
        props.max = rules.max;
        props.placeholder = `Enter ${feature.replace(/_/g, ' ')} (${rules.min}-${rules.max})`;
      } else {
        props.min = Math.min(...rules.values);
        props.max = Math.max(...rules.values);
        props.placeholder = `Enter ${feature.replace(/_/g, ' ')} (${rules.values.join(' or ')})`;
      }
    } else {
      props.placeholder = `Enter ${feature.replace(/_/g, ' ')}`;
    }

    return props;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {clinicalFeatures.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Clinical Measurements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinicalFeatures.map((feature) => (
              <div key={feature} className="space-y-2">
                <Label htmlFor={feature}>{feature?.replace(/_/g, ' ') || 'Unknown'}</Label>
                <Input {...getInputProps(feature)} />
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
                <Label htmlFor={feature}>{feature?.replace(/_/g, ' ') || 'Unknown'}</Label>
                <Input {...getInputProps(feature)} />
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
                <Label htmlFor={feature}>{feature?.replace(/_/g, ' ') || 'Unknown'}</Label>
                <Input {...getInputProps(feature)} />
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
