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

export interface PredictionResponse {
  prediction: {
    class: number;
    probabilities: number[];
    class_label: string;
  };
  features_used: string[];
  explanation: {
    feature_importance: Record<string, number>;
    shap_values: number[][];
    features: string[];
  };
  model_version: string;
}

export interface TrainInitiationResponse {
  message: string;
  task_id: string;
}

export interface TrainingStatus {
  status: string;
  message?: string;
  error?: string;
  details?: string;
  version?: string;
  metrics?: Record<string, number>;
  classification_report?: Record<string, any>;
  top_features?: Array<{ feature: string; importance: number }>;
  training_duration?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const defaultDashboardData: DashboardData = {
  total_patients: 0,
  numerical_stats: {
    age: { min: 0, max: 0, count: 0 },
    Body_Mass_Index: { min: 0, max: 0, count: 0 },
    Mrs_admission: { min: 0, max: 0, count: 0 },
    NIHSS_admission: { min: 0, max: 0, count: 0 },
  },
  categorical_stats: {
    Gender: { values: {}, count: 0 },
    medical_insurance: { values: {}, count: 0 },
    payment_method: { values: {}, count: 0 },
  },
  model_versions: [],
  last_updated: new Date().toISOString(),
};

function validateDashboardData(data: any): DashboardData {
  if (!data) return defaultDashboardData;
  return {
    ...defaultDashboardData,
    ...data,
    numerical_stats: { ...defaultDashboardData.numerical_stats, ...(data.numerical_stats || {}) },
    categorical_stats: { ...defaultDashboardData.categorical_stats, ...(data.categorical_stats || {}) },
    model_versions: Array.isArray(data.model_versions) ? data.model_versions : [],
  };
}

export async function getDataOverview(): Promise<DashboardData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/overview`);
    if (!response.ok) return validateDashboardData(null);
    return validateDashboardData(await response.json());
  } catch (error) {
    console.error('Failed to fetch data overview:', error);
    return validateDashboardData(null);
  }
}

export async function getModelVersions(): Promise<ModelVersion[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/models/versions`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.models) ? data.models : [];
  } catch (error) {
    console.error('Failed to fetch model versions:', error);
    return [];
  }
}

export async function trainModel(selectedFeatures: string[]): Promise<TrainInitiationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selected_features: selectedFeatures }),
  });

  const responseText = await response.text();

  if (response.status !== 202) {
    let errorMessage = `Failed to initiate training: ${response.status} ${response.statusText}`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch { /* use default */ }
    throw new Error(errorMessage);
  }

  return JSON.parse(responseText);
}

export async function getTrainingStatus(taskId: string): Promise<TrainingStatus> {
  const response = await fetch(`${API_BASE_URL}/api/train/status/${taskId}`);
  const responseText = await response.text();

  if (!response.ok) {
    let errorMessage = `Failed to fetch training status: ${response.status}`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch { /* use default */ }
    throw new Error(errorMessage);
  }

  return JSON.parse(responseText);
}

export async function getPrediction(modelVersion: string, patientData: PatientData): Promise<PredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/predict/${modelVersion}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData),
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorMessage = 'Unknown error occurred';
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorData.message || responseText;
    } catch {
      errorMessage = responseText;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
