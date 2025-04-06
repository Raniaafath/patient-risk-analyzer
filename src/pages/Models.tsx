
import React, { useState, useEffect } from 'react';
import { ModelVersion, getModelVersions } from '@/services/api';
import { ModelCard } from '@/components/Models/ModelCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Search } from 'lucide-react';

export default function Models() {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await getModelVersions();
        setModels(data);
      } catch (err) {
        console.error('Error fetching models:', err);
        toast({
          title: "Error",
          description: "Failed to fetch model data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [toast]);

  const filteredModels = models.filter(model => 
    model.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.selected_features.some(feature => 
      feature.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Model Repository</h1>
        
        <div className="flex w-full sm:w-auto gap-4">
          <div className="relative flex-1 sm:flex-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text" 
              placeholder="Search models..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="default" asChild>
            <a href="/training">Train New Model</a>
          </Button>
        </div>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-600 mb-2">No models available yet</h3>
          <p className="text-gray-500 mb-6">Start by training a new model with selected features</p>
          <Button asChild>
            <a href="/training">Train First Model</a>
          </Button>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-600">No models match your search</h3>
          <p className="text-gray-500 mt-2">Try using different search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <ModelCard key={model.version} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}
