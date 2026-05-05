'use client';

import { Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/form-components';

interface DashboardEmptyStateProps {
  onStartData: () => void;
}

export function DashboardEmptyState({ onStartData }: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Eye className="w-12 h-12 text-primary" />
      </div>

      <h2 className="text-3xl font-bold text-foreground text-center mb-3">
        No Prediction Yet
      </h2>

      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Start by logging your screen time data. Our AI-powered system will analyze your habits and provide personalized recommendations for better eye health.
      </p>

      <div className="space-y-4 text-sm text-muted-foreground mb-8">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-primary">1</span>
          </div>
          <p>Log your daily screen time hours</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-primary">2</span>
          </div>
          <p>Record any eye strain symptoms you experience</p>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
            <span className="text-xs font-bold text-primary">3</span>
          </div>
          <p>Get AI-powered risk assessment and recommendations</p>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onStartData}
        className="flex items-center gap-2"
      >
        <span>Start Logging Data</span>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
