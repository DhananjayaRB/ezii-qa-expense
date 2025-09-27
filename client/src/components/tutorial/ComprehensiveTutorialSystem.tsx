import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, ArrowLeft, Play, SkipForward, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TUTORIAL_WORKFLOWS, type TutorialWorkflow, type WorkflowStep } from "./TutorialWorkflows";

interface ComprehensiveTutorialProps {
  workflowId: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function ComprehensiveTutorial({ workflowId, onComplete, onSkip }: ComprehensiveTutorialProps) {
  // DEBUG: Log when component mounts
  console.log('🎯🎯🎯 ComprehensiveTutorial component loaded with workflowId:', workflowId);
  
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the workflow for this tutorial
  const workflow = TUTORIAL_WORKFLOWS[workflowId];

  console.log('🎯🎯🎯 Workflow found:', !!workflow, workflow?.name);
  console.log('🎯🎯🎯 isActive state:', isActive);

  if (!workflow) {
    console.log('❌❌❌ No workflow found for:', workflowId);
    return null;
  }

  // Component logic continues here
  const currentStep = workflow.steps[currentStepIndex];

  const handleNextStep = () => {
    if (currentStepIndex < workflow.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
    // NO AUTO-CLOSE - let user manually close even after last step
  };

  const handleSkip = () => {
    // Only close if user clicks the X button or Skip button
    onSkip?.();
    setIsActive(false);
  };

  // Auto-activate when workflow is provided
  useEffect(() => {
    if (workflowId && workflow) {
      console.log('🎯 Auto-activating tutorial:', workflowId);
      setIsActive(true);
    }
  }, [workflowId, workflow]);

  // Highlight target element for current step
  useEffect(() => {
    if (!currentStep?.element || !isActive) return;

    const element = document.querySelector(currentStep.element) as HTMLElement;
    if (!element) return;

    // Add highlight class to target element
    element.classList.add('tutorial-highlight');
    
    // Scroll element into view smoothly
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'center'
    });
    
    return () => {
      element.classList.remove('tutorial-highlight');
    };
  }, [currentStepIndex, currentStep, isActive]);

  return isActive ? (
    <>
      {/* Blurred backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]" onClick={handleSkip} />
      
      {/* Tutorial Card */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" data-testid="tutorial-popup">
        <Card className="w-full max-w-md shadow-xl border-2 border-purple-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <Play className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{currentStep.title}</h3>
                  <p className="text-xs text-purple-600 font-medium">
                    Step {currentStepIndex + 1} of {workflow.steps.length} • {workflow.name}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSkip}
                className="h-8 w-8 p-0 hover:bg-gray-100"
                data-testid="button-close-tutorial"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${((currentStepIndex + 1) / workflow.steps.length) * 100}%` }}
              />
            </div>
            
            {/* Step content */}
            <div className="space-y-3">
              <p className="text-gray-700 text-sm leading-relaxed">
                {currentStep.description}
              </p>
              
              {currentStep.hint && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-purple-800 text-xs font-medium flex items-start gap-2">
                    💡 <span>{currentStep.hint}</span>
                  </p>
                </div>
              )}
            </div>
            
            {/* Navigation buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                  disabled={currentStepIndex === 0}
                  className="flex-1"
                  data-testid="button-previous"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <Button
                  onClick={handleNextStep}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  data-testid="button-next"
                >
                  {currentStepIndex === workflow.steps.length - 1 ? (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Finish Reading
                    </>
                  ) : (
                    <>
                      Next Step
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full text-gray-600 hover:text-gray-800"
                data-testid="button-skip"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip This Tour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  ) : null;
}

// Hook for tutorial suggestions
export function useTutorialSuggestions() {
  return {
    activeTutorial: null,
    setActiveTutorial: () => {},
    clearTutorial: () => {}
  };
}

// Export the tutorial workflows
export { TUTORIAL_WORKFLOWS };