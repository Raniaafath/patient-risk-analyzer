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

// API base URL
const API_BASE_URL = 'http://localhost:5000';

// Debug helper function
async function debugFetch(url: string, options?: RequestInit): Promise<Response> {
  console.log(`🔍 API Request: ${options?.method || 'GET'} ${url}`);
  if (options?.body) {
    console.log('📦 Request Body:', options.body);
  }
  
  try {
    const response = await fetch(url, options);
    console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
    
    // Clone the response to log its body without consuming it
    const responseClone = response.clone();
    const responseText = await responseClone.text();
    console.log('📄 Response Body:', responseText);
    
    // Return the original response
    return response;
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
}

// Data validation helper
function validateDashboardData(data: any): DashboardData {
  console.log('🔍 Validating dashboard data:', data);
  
  // Create a safe default structure
  const defaultData: DashboardData = {
    total_patients: 0,
    numerical_stats: {
      age: { min: 0, max: 0, count: 0 },
      Body_Mass_Index: { min: 0, max: 0, count: 0 },
      Mrs_admission: { min: 0, max: 0, count: 0 },
      NIHSS_admission: { min: 0, max: 0, count: 0 }
    },
    categorical_stats: {
      Gender: { values: {}, count: 0 },
      medical_insurance: { values: {}, count: 0 },
      payment_method: { values: {}, count: 0 }
    },
    model_versions: [],
    last_updated: new Date().toISOString()
  };
  
  // If data is null or undefined, return default
  if (!data) {
    console.warn('⚠️ Received null or undefined data, using defaults');
    return defaultData;
  }
  
  try {
    // Merge received data with defaults to ensure all required fields exist
    const validatedData = {
      ...defaultData,
      ...data,
      numerical_stats: {
        ...defaultData.numerical_stats,
        ...(data.numerical_stats || {})
      },
      categorical_stats: {
        ...defaultData.categorical_stats,
        ...(data.categorical_stats || {})
      },
      model_versions: Array.isArray(data.model_versions) ? data.model_versions : []
    };
    
    console.log('✅ Data validation successful');
    return validatedData;
  } catch (error) {
    console.error('❌ Data validation error:', error);
    return defaultData;
  }
}

// API Functions
export async function getDataOverview(): Promise<DashboardData> {
  try {
    console.log('🔄 Fetching data overview...');
    const response = await debugFetch(`${API_BASE_URL}/api/data/overview`);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch data overview: ${response.status} ${response.statusText}`);
      // Return default data instead of throwing
      return validateDashboardData(null);
    }
    
    const data = await response.json();
    console.log('✅ Data overview fetched successfully');
    
    // Validate the data before returning
    return validateDashboardData(data);
  } catch (error) {
    console.error('❌ Error in getDataOverview:', error);
    // Return default data instead of throwing
    return validateDashboardData(null);
  }
}

export async function getModelVersions(): Promise<ModelVersion[]> {
  try {
    console.log('🔄 Fetching model versions...');
    const response = await debugFetch(`${API_BASE_URL}/api/models/versions`);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch model versions: ${response.status} ${response.statusText}`);
      // Return empty array instead of throwing
      return [];
    }
    
    const data = await response.json();
    console.log('✅ Model versions fetched successfully');
    
    // Ensure we return an array even if data.models is undefined
    return Array.isArray(data.models) ? data.models : [];
  } catch (error) {
    console.error('❌ Error in getModelVersions:', error);
    // Return empty array instead of throwing
    return [];
  }
}

export async function trainModel(selectedFeatures: string[]): Promise<{ version: string }> {
  try {
    console.log('🔄 Training model with features:', selectedFeatures);
    const response = await debugFetch(`${API_BASE_URL}/api/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected_features: selectedFeatures }),
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to train model: ${response.status} ${response.statusText}`);
      // Return a default version instead of throwing
      return { version: 'error' };
    }
    
    const data = await response.json();
    console.log('✅ Model trained successfully:', data);
    
    // Ensure we return an object with a version property
    return { version: data.version || 'unknown' };
  } catch (error) {
    console.error('❌ Error in trainModel:', error);
    // Return a default version instead of throwing
    return { version: 'error' };
  }
}

export async function getPrediction(modelVersion: string, patientData: PatientData): Promise<PredictionResponse> {
  try {
    console.log('🔄 Getting prediction for model version:', modelVersion);
    console.log('📊 Patient data:', patientData);
    
    const response = await debugFetch(`${API_BASE_URL}/api/predict/${modelVersion}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    
    if (!response.ok) {
      // Get the response text first
      const responseText = await response.text();
      let errorMessage = 'Unknown error occurred';
      
      try {
        // Try to parse as JSON
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorData.message || responseText;
      } catch {
        // If not JSON, use the raw text
        errorMessage = responseText;
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('✅ Prediction received:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error in getPrediction:', error);
    throw error;
  }
}
