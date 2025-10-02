import React from "react";

interface LoadingStateProps {
  title?: string;
  description?: string;
  showShimmer?: boolean;
}

export const LoadingState = ({ 
  title = "Loading...", 
  description = "Please wait while we fetch the data...",
  showShimmer = true 
}: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-brand-green/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-brand-green rounded-full animate-spin"></div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      {/* Shimmer Effect */}
      {showShimmer && (
        <div className="w-full max-w-md mt-8">
          <div className="glassmorphic dark:glassmorphic-dark rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-shimmer-gradient bg-[length:200%_100%] rounded animate-shimmer"></div>
                <div className="h-3 bg-shimmer-gradient bg-[length:200%_100%] rounded w-2/3 animate-shimmer"></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="h-3 bg-shimmer-gradient bg-[length:200%_100%] rounded animate-shimmer"></div>
              <div className="h-3 bg-shimmer-gradient bg-[length:200%_100%] rounded animate-shimmer"></div>
              <div className="h-3 bg-shimmer-gradient bg-[length:200%_100%] rounded w-1/2 animate-shimmer"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
