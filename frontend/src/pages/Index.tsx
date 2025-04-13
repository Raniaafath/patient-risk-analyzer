
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  // Automatically redirect to dashboard
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  // This won't be shown as it redirects, but just in case:
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Patient Risk Analyzer</h1>
        <p className="text-gray-600 mb-4">Redirecting to dashboard...</p>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    </div>
  );
};

export default Index;
