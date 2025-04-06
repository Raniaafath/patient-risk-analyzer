
// API service for communicating with the backend

// Types
export interface NumericalStats {
  min: number;
  max: number;
  count: number;
}

export interface CategoricalStats {
  values: { [key: string]: number };
  count: number;
}

export interface ModelVersion {
  version: string;
  trained_on: string;
  feature_count: number;
  features: string[];
  metrics: {
    accuracy: number;
    f1: number;
  };
  top_features: Array<{
    feature: string;
    importance: number;
  }>;
  classification_report: Record<string, any>;
  saved_to: string;
  data_size: number;
  training_duration: string;
  selected_features: string[];
}

export interface DashboardData {
  total_patients: number;
  numerical_stats: {
    age: NumericalStats;
    Body_Mass_Index: NumericalStats;
    Mrs_admission: NumericalStats;
    NIHSS_admission: NumericalStats;
  };
  categorical_stats: {
    Gender: CategoricalStats;
    medical_insurance: CategoricalStats;
    payment_method: CategoricalStats;
  };
  model_versions: ModelVersion[];
  last_updated: string;
}

export interface PatientData {
  [key: string]: string | number;
}

// Mock data for development
const mockDashboardData: DashboardData = {
  total_patients: 1567,
  numerical_stats: {
    age: { min: 25, max: 92, count: 1567 },
    Body_Mass_Index: { min: 17.9, max: 42.1, count: 1432 },
    Mrs_admission: { min: 0, max: 5, count: 1567 },
    NIHSS_admission: { min: 1, max: 28, count: 1459 }
  },
  categorical_stats: {
    Gender: {
      values: { "0": 842, "1": 725 },
      count: 1567
    },
    medical_insurance: {
      values: { "0": 421, "1": 498, "2": 648 },
      count: 1567
    },
    payment_method: {
      values: { "0": 876, "1": 691 },
      count: 1567
    }
  },
  model_versions: [
    {
      version: "1.0.3",
      trained_on: "2025-03-15T15:30:00Z",
      feature_count: 7,
      features: ["age", "Mrs_admission", "NIHSS_admission", "Gender", "hypertension", "diabetes", "atrial_fibrillation"],
      metrics: {
        accuracy: 0.87,
        f1: 0.85
      },
      top_features: [
        { feature: "NIHSS_admission", importance: 0.35 },
        { feature: "age", importance: 0.22 },
        { feature: "Mrs_admission", importance: 0.18 },
        { feature: "atrial_fibrillation", importance: 0.12 },
        { feature: "diabetes", importance: 0.08 }
      ],
      classification_report: {
        "0": { precision: 0.88, recall: 0.86, "f1-score": 0.87, support: 278 },
        "1": { precision: 0.85, recall: 0.87, "f1-score": 0.86, support: 221 }
      },
      saved_to: "models/risk_model_v103.pkl",
      data_size: 1250,
      training_duration: "3m 42s",
      selected_features: ["age", "Mrs_admission", "NIHSS_admission", "Gender", "hypertension", "diabetes", "atrial_fibrillation"]
    },
    {
      version: "1.0.2",
      trained_on: "2025-02-28T09:45:00Z",
      feature_count: 5,
      features: ["age", "NIHSS_admission", "hypertension", "diabetes", "atrial_fibrillation"],
      metrics: {
        accuracy: 0.82,
        f1: 0.8
      },
      top_features: [
        { feature: "NIHSS_admission", importance: 0.41 },
        { feature: "age", importance: 0.25 },
        { feature: "atrial_fibrillation", importance: 0.17 },
        { feature: "diabetes", importance: 0.1 }
      ],
      classification_report: {
        "0": { precision: 0.83, recall: 0.81, "f1-score": 0.82, support: 256 },
        "1": { precision: 0.8, recall: 0.82, "f1-score": 0.81, support: 203 }
      },
      saved_to: "models/risk_model_v102.pkl",
      data_size: 1100,
      training_duration: "2m 58s",
      selected_features: ["age", "NIHSS_admission", "hypertension", "diabetes", "atrial_fibrillation"]
    }
  ],
  last_updated: "2025-04-05T08:30:00Z"
};

// API Functions
export async function getDataOverview(): Promise<DashboardData> {
  // In a real app, this would fetch from the actual API
  // return fetch('http://localhost:5000/data/overview').then(res => res.json());
  
  // For now, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDashboardData);
    }, 600); // Simulate network delay
  });
}

export async function getModelVersions(): Promise<ModelVersion[]> {
  // In a real app, this would fetch from the actual API
  // return fetch('http://localhost:5000/models/versions').then(res => res.json()).then(data => data.models);
  
  // For now, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDashboardData.model_versions);
    }, 500);
  });
}

export async function trainModel(selectedFeatures: string[]): Promise<{ version: string }> {
  // In a real app, this would post to the actual API
  // return fetch('http://localhost:5000/train', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ selected_features: selectedFeatures }),
  // }).then(res => res.json());
  
  // For now, simulate training
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ version: `1.0.${Math.floor(Math.random() * 100)}` });
    }, 2000);
  });
}

export async function getPrediction(modelVersion: string, patientData: PatientData): Promise<{ prediction: number }> {
  // In a real app, this would post to the actual API
  // return fetch(`http://localhost:5000/predict/${modelVersion}`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(patientData),
  // }).then(res => res.json());
  
  // For now, simulate prediction based on input (simplified)
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate prediction logic
      const age = parseFloat(patientData.age as string) || 0;
      const nihss = parseFloat(patientData.NIHSS_admission as string) || 0;
      
      // Simple rule: high NIHSS or older age means higher risk
      const isHighRisk = (nihss > 15) || (age > 75 && nihss > 10);
      
      resolve({ prediction: isHighRisk ? 1 : 0 });
    }, 1000);
  });
}
