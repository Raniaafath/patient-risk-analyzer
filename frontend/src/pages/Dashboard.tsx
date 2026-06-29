import React, { useState, useEffect } from 'react';
import {
  DashboardData,
  getDataOverview,
  ModelVersion,
  getModelVersions
} from '@/services/api';
import { StatCard } from '@/components/Dashboard/StatCard';
import { StatisticsCard } from '@/components/Dashboard/StatisticsCard';
import { ModelCard } from '@/components/Models/ModelCard';
import { Users, Scale, Activity, Brain } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Default data structure to prevent undefined errors
const defaultDashboardData: DashboardData = {
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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(defaultDashboardData);
  const [modelDetails, setModelDetails] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewResponse, modelsResponse] = await Promise.all([
          getDataOverview(),
          getModelVersions()
        ]);

        setData(overviewResponse);
        setModelDetails(modelsResponse);
        
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data or model details. Displaying defaults.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const calculatePercentage = (value: number, total: number): string => {
    if (!total) return '0.0';
    return ((value / total) * 100).toFixed(1);
  };

  const safeGet = (obj: any, path: string, defaultValue: any = 0) => {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : defaultValue), obj);
  };

  const genderLabel: Record<string, string> = { '0': 'Female', '1': 'Male' };
  const insuranceLabel: Record<string, string> = { '0': 'None', '1': 'Public', '2': 'Private', '3': 'Other' };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Medical Risk Dashboard</h1>
        <p className="text-sm text-gray-500">
          Last updated: {new Date(data.last_updated).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={data.total_patients.toLocaleString()}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Age Range"
          value={`${safeGet(data, 'numerical_stats.age.min')}–${safeGet(data, 'numerical_stats.age.max')} yrs`}
          icon={<Activity className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="BMI Range"
          value={`${Number(safeGet(data, 'numerical_stats.Body_Mass_Index.min', 0)).toFixed(1)}–${Number(safeGet(data, 'numerical_stats.Body_Mass_Index.max', 0)).toFixed(1)}`}
          icon={<Scale className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50"
        />
        <StatCard
          title="Active Models"
          value={modelDetails?.length || data.model_versions?.length || 0}
          icon={<Brain className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-4">Patient Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatisticsCard
              title="Gender Distribution"
              items={Object.entries(safeGet(data, 'categorical_stats.Gender.values', {})).map(([gender, count]) => ({
                label: genderLabel[gender] ?? `Gender ${gender}`,
                value: `${count} (${calculatePercentage(count as number, safeGet(data, 'categorical_stats.Gender.count', 0))}%)`
              }))}
            />
            <StatisticsCard
              title="Insurance Types"
              items={Object.entries(safeGet(data, 'categorical_stats.medical_insurance.values', {})).map(([insurance, count]) => ({
                label: insuranceLabel[insurance] ?? `Type ${insurance}`,
                value: `${count} (${calculatePercentage(count as number, safeGet(data, 'categorical_stats.medical_insurance.count', 0))}%)`
              }))}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Clinical Measurements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatisticsCard 
              title="NIHSS Scores"
              items={[
                { label: "Range", value: `${safeGet(data, 'numerical_stats.NIHSS_admission.min')} - ${safeGet(data, 'numerical_stats.NIHSS_admission.max')}` },
                { label: "Patients with scores", value: safeGet(data, 'numerical_stats.NIHSS_admission.count') }
              ]}
            />
            <StatisticsCard 
              title="mRS Scores"
              items={[
                { label: "Range", value: `${safeGet(data, 'numerical_stats.Mrs_admission.min')} - ${safeGet(data, 'numerical_stats.Mrs_admission.max')}` },
                { label: "Patients with scores", value: safeGet(data, 'numerical_stats.Mrs_admission.count') }
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Available Models</h2>
          <a href="/models" className="text-blue-600 text-sm hover:underline">View all models</a>
        </div>
        {(modelDetails && modelDetails.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modelDetails.slice(0, 3).map((model: ModelVersion) => (
              <ModelCard key={model.version} model={model} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg">
            <p>No models available yet. Train a model to see it here.</p>
            <a href="/training" className="mt-2 inline-block text-blue-600 hover:underline">Go to Training</a>
          </div>
        )}
      </div>
    </div>
  );
}
