import { useState, useEffect, useRef, useCallback } from "react";
import './tour-styles.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { X, ArrowRight, ArrowLeft, SkipForward, CheckCircle, HelpCircle, Target } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector for the element to highlight
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action: 'click' | 'highlight' | 'navigate' | 'wait' | 'complete';
  route?: string; // For navigation steps
  requiredClick?: boolean; // Whether user must click the target element to proceed
  hint?: string;
  screenshot?: string; // Optional screenshot for complex steps
}

export interface TourFlow {
  id: string;
  name: string;
  title: string;
  description: string;
  category: 'admin' | 'employee' | 'manager' | 'all';
  estimatedTime: string;
  steps: TourStep[];
  completionReward?: string;
}

interface InteractiveProductTourProps {
  flow: TourFlow;
  onComplete?: () => void;
  onSkip?: () => void;
  onClose?: () => void;
}

export function InteractiveProductTour({ 
  flow, 
  onComplete, 
  onSkip, 
  onClose 
}: InteractiveProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isWaitingForClick, setIsWaitingForClick] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const clickListenerRef = useRef<((e: Event) => void) | null>(null);
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const currentStepData = flow.steps[currentStep];
  const isLastStep = currentStep === flow.steps.length - 1;
  const isFirstStep = currentStep === 0;
  const progress = ((currentStep + 1) / flow.steps.length) * 100;

  // Handle element click detection for interactive steps
  const handleElementClick = useCallback((e: Event) => {
    if (!isWaitingForClick || !currentStepData?.target) return;
    
    const target = e.target as HTMLElement;
    const expectedElement = document.querySelector(currentStepData.target);
    
    if (target === expectedElement || expectedElement?.contains(target)) {
      setIsWaitingForClick(false);
      setCompletedSteps(prev => [...prev, currentStepData.id]);
      
      // Small delay before advancing to next step
      setTimeout(() => {
        handleNext();
      }, 500);
    }
  }, [isWaitingForClick, currentStepData, currentStep]);

  // Position tooltip relative to target element or center it
  useEffect(() => {
    if (!currentStepData || !isVisible) return;

    const updatePosition = () => {
      // Handle navigation steps
      if (currentStepData.action === 'navigate' && currentStepData.route) {
        if (location !== currentStepData.route) {
          setLocation(currentStepData.route);
          return;
        }
      }

      // Handle center placement (no target element)
      if (currentStepData.placement === 'center' || !currentStepData.target) {
        setTooltipPosition({
          top: window.innerHeight / 2 - 200,
          left: window.innerWidth / 2 - 200
        });
        setTargetElement(null);
        return;
      }

      // Find target element
      let element = document.querySelector(currentStepData.target) as HTMLElement;
      
      // If element not found and it's the Employee Claim link, try expanding Employee section
      if (!element && currentStepData.target === '[data-testid="nav-claim"]') {
        // Find and click Employee section button to expand it
        const employeeButton = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent?.trim().toUpperCase() === 'EMPLOYEE');
        
        if (employeeButton) {
          employeeButton.click();
          // Wait a moment for the section to expand
          setTimeout(() => {
            element = document.querySelector(currentStepData.target!) as HTMLElement;
            if (element) {
              // Re-run the positioning logic
              updatePosition();
            }
          }, 200);
          return;
        }
      }
      
      if (!element || !tooltipRef.current) {
        // Element not found, center the tooltip
        setTooltipPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 200
        });
        setTargetElement(null);
        return;
      }

      setTargetElement(element);
      
      // Add highlight classes
      element.classList.add('tour-highlight', 'tour-pulse');
      
      const elementRect = element.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      switch (currentStepData.placement) {
        case 'top':
          top = elementRect.top + scrollY - tooltipRect.height - 16;
          left = elementRect.left + scrollX + (elementRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = elementRect.bottom + scrollY + 16;
          left = elementRect.left + scrollX + (elementRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = elementRect.top + scrollY + (elementRect.height / 2) - (tooltipRect.height / 2);
          left = elementRect.left + scrollX - tooltipRect.width - 16;
          break;
        case 'right':
          top = elementRect.top + scrollY + (elementRect.height / 2) - (tooltipRect.height / 2);
          left = elementRect.right + scrollX + 16;
          break;
      }

      // Ensure tooltip stays within viewport
      const padding = 16;
      top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));
      left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));

      setTooltipPosition({ top, left });

      // Scroll element into view
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(updatePosition, 100);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStepData, isVisible, location, setLocation]);

  // Set up click listener for interactive steps
  useEffect(() => {
    // Remove previous listener
    if (clickListenerRef.current) {
      document.removeEventListener('click', clickListenerRef.current, true);
    }

    if (currentStepData?.requiredClick && currentStepData.target) {
      setIsWaitingForClick(true);
      clickListenerRef.current = handleElementClick;
      document.addEventListener('click', clickListenerRef.current, true);
    }

    return () => {
      if (clickListenerRef.current) {
        document.removeEventListener('click', clickListenerRef.current, true);
      }
    };
  }, [currentStepData, handleElementClick]);

  // Cleanup highlights when step changes or component unmounts
  useEffect(() => {
    return () => {
      // Remove highlight classes from all elements
      document.querySelectorAll('.tour-highlight, .tour-pulse').forEach(el => {
        el.classList.remove('tour-highlight', 'tour-pulse');
      });
    };
  }, [currentStep]);

  const handleNext = async () => {
    if (isWaitingForClick) {
      // Don't show toast - the tooltip already displays the click guidance
      return;
    }

    if (isLastStep) {
      await handleComplete();
    } else {
      // Clean up current step
      if (targetElement) {
        targetElement.classList.remove('tour-highlight', 'tour-pulse');
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      // Clean up current step
      if (targetElement) {
        targetElement.classList.remove('tour-highlight', 'tour-pulse');
      }
      setCurrentStep(currentStep - 1);
      setIsWaitingForClick(false);
    }
  };

  const handleComplete = async () => {
    try {
      await apiRequest(`/api/tours/${flow.id}/complete`, {
        method: 'POST',
      });

      toast({
        title: "🎉 Tour Completed!",
        description: flow.completionReward || "You've successfully completed the product tour!",
        variant: "default",
      });

      setIsVisible(false);
      onComplete?.();
    } catch (error) {
      console.error('Error completing tour:', error);
      toast({
        title: "Tour Completed",
        description: "Great job completing the tour!",
        variant: "default",
      });
      setIsVisible(false);
      onComplete?.();
    }
  };

  const handleSkip = async () => {
    try {
      await apiRequest(`/api/tours/${flow.id}/skip`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error skipping tour:', error);
    }

    toast({
      title: "Tour Skipped",
      description: "You can restart the tour anytime from the Help menu.",
      variant: "default",
    });

    setIsVisible(false);
    onSkip?.();
  };

  const handleClose = () => {
    // Clean up highlights
    document.querySelectorAll('.tour-highlight, .tour-pulse').forEach(el => {
      el.classList.remove('tour-highlight', 'tour-pulse');
    });
    
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || !currentStepData) return null;

  return (
    <>
      {/* Enhanced Overlay with better backdrop */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 z-50 tour-backdrop"
        style={{ pointerEvents: isWaitingForClick ? 'none' : 'auto' }}
      />
      
      {/* Tour Tooltip with Arrow */}
      <div
        ref={tooltipRef}
        className="fixed z-[60] max-w-sm"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          pointerEvents: 'auto'
        }}
      >
        {/* Arrow pointing to target */}
        {currentStepData.placement !== 'center' && (
          <div 
            className={`absolute w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 transform rotate-45 z-[61] ${
              currentStepData.placement === 'top' ? '-bottom-2 left-1/2 -translate-x-1/2' :
              currentStepData.placement === 'bottom' ? '-top-2 left-1/2 -translate-x-1/2' :
              currentStepData.placement === 'left' ? '-right-2 top-1/2 -translate-y-1/2' :
              '-left-2 top-1/2 -translate-y-1/2'
            }`}
          />
        )}
        
        {/* Main Tooltip Card */}
        <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl overflow-hidden border border-blue-400/30 tour-tooltip">
          {/* Glossy overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          
          <div className="relative p-6 text-white">
            {/* Header with icon and close button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Dynamic Message Icon */}
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  {currentStepData.action === 'click' ? (
                    <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Target className="w-3 h-3 text-yellow-900" />
                    </div>
                  ) : currentStepData.action === 'navigate' ? (
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-3 h-3 text-green-900" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 bg-blue-400 rounded-full flex items-center justify-center">
                      <HelpCircle className="w-3 h-3 text-blue-900" />
                    </div>
                  )}
                </div>
                
                <div>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs mb-1">
                    Step {currentStep + 1} of {flow.steps.length}
                  </Badge>
                  <h3 className="font-semibold text-lg leading-tight">{currentStepData.title}</h3>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-white/80 hover:text-white hover:bg-white/20"
                data-testid="button-close-tour"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-white/80 mt-1">{Math.round(progress)}% complete</p>
            </div>
            {/* Content */}
            <div className="space-y-4">
              <p className="text-white/90 leading-relaxed">
                {currentStepData.content}
              </p>
              
              {currentStepData.hint && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-400/20 rounded-full flex items-center justify-center mt-0.5">
                      <HelpCircle className="w-3 h-3 text-yellow-200" />
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {currentStepData.hint}
                    </p>
                  </div>
                </div>
              )}

              {isWaitingForClick && (
                <div className="bg-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-orange-400/30">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    <p className="text-sm text-orange-100">
                      ⚡ Click the highlighted element to continue...
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-white/20">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className="text-white/70 hover:text-white hover:bg-white/10 border border-white/20"
                  data-testid="button-tour-previous"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  data-testid="button-tour-skip"
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip
                </Button>
              </div>

              <Button
                onClick={handleNext}
                disabled={isWaitingForClick}
                size="sm"
                className="bg-white text-blue-600 hover:bg-white/90 font-medium shadow-lg"
                data-testid="button-tour-next"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Tour
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}