
import React, { useState, useEffect } from 'react';
import { DashboardData, getDataOverview } from '@/services/api';
import { StatCard } from '@/components/Dashboard/StatCard';
import { StatisticsCard } from '@/components/Dashboard/StatisticsCard';
import { ModelCard } from '@/components/Models/ModelCard';
import { Users, Scale, Activity, FileBarChart, Brain } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getDataOverview();
        setData(response);
      } catch (err) {
        console.error('Error details:', err);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data.",
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

  if (!data) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">No data available</p>
        </div>
      </div>
    );
  }

  // Helper function to calculate percentages
  const calculatePercentage = (value: number, total: number): string => {
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Medical Risk Dashboard</h1>
        <p className="text-sm text-gray-500">
          Last updated: {new Date(data.last_updated).toLocaleString()}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Patients" 
          value={data.total_patients.toLocaleString()}
          icon={<Users className="h-5 w-5 text-blue-600" />}
        />
        <StatCard 
          title="Age Range" 
          value={`${data.numerical_stats.age.min} - ${data.numerical_stats.age.max} years`}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          trend={{ value: 2.5, isPositive: true }}
        />
        <StatCard 
          title="BMI Range" 
          value={`${data.numerical_stats.Body_Mass_Index.min.toFixed(1)} - ${data.numerical_stats.Body_Mass_Index.max.toFixed(1)}`}
          icon={<Scale className="h-5 w-5 text-blue-600" />}
        />
        <StatCard 
          title="Active Models" 
          value={data.model_versions.length}
          icon={<Brain className="h-5 w-5 text-blue-600" />}
        />
      </div>

      {/* Patient Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-4">Patient Demographics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatisticsCard 
              title="Gender Distribution"
              items={Object.entries(data.categorical_stats.Gender.values).map(([gender, count]) => ({
                label: `Gender ${gender}`,
                value: `${count} (${calculatePercentage(count, data.categorical_stats.Gender.count)}%)`
              }))}
            />
            <StatisticsCard 
              title="Insurance Types"
              items={Object.entries(data.categorical_stats.medical_insurance.values).map(([insurance, count]) => ({
                label: `Type ${insurance}`,
                value: `${count} (${calculatePercentage(count, data.categorical_stats.medical_insurance.count)}%)`
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
                { label: "Range", value: `${data.numerical_stats.NIHSS_admission.min} - ${data.numerical_stats.NIHSS_admission.max}` },
                { label: "Patients with scores", value: data.numerical_stats.NIHSS_admission.count }
              ]}
            />
            <StatisticsCard 
              title="mRS Scores"
              items={[
                { label: "Range", value: `${data.numerical_stats.Mrs_admission.min} - ${data.numerical_stats.Mrs_admission.max}` },
                { label: "Patients with scores", value: data.numerical_stats.Mrs_admission.count }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Latest Models */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Latest Models</h2>
          <a href="/models" className="text-blue-600 text-sm hover:underline">View all models</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.model_versions.slice(0, 3).map((model) => (
            <ModelCard key={model.version} model={model} />
          ))}
        </div>
      </div>
    </div>
  );
}
