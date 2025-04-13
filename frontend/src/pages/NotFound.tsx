
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileWarning } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <FileWarning className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-6">
          Oops! The page you're looking for isn't available.
        </p>
        <Button asChild className="w-full">
          <a href="/">Return to Dashboard</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
