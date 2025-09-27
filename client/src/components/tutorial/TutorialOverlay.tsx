import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, SkipForward, ArrowRight } from 'lucide-react';
import { useTutorial } from './TutorialContext';

interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TutorialOverlay() {
  // Guard against missing provider during hot reload or initialization
  let tutorialContext;
  try {
    tutorialContext = useTutorial();
  } catch (error) {
    // Provider not available - likely during hot reload
    return null;
  }
  
  const { state, nextStep, prevStep, skipTutorial, endTutorial } = tutorialContext;
  const [targetPosition, setTargetPosition] = useState<ElementPosition | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Track the highlighted element position with retry logic
  useEffect(() => {
    if (!state.isActive || !state.currentStep) return;

    let retryCount = 0;
    const maxRetries = 10;

    const updatePosition = () => {
      const element = document.querySelector(state.currentStep!.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      } else {
        setTargetPosition(null);
        
        // If waiting for element and it's not found, retry
        if (state.currentStep?.waitForElement && retryCount < maxRetries) {
          retryCount++;
          setTimeout(updatePosition, 300); // Retry every 300ms
        }
      }
    };

    updatePosition();
    
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(document.body);
    
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [state.currentStep, state.isActive]);

  if (!state.isActive || !state.currentStep || !state.currentTutorial) {
    return null;
  }

  const currentStepNumber = state.currentStepIndex + 1;
  const totalSteps = state.currentTutorial.totalSteps;
  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === state.currentTutorial.steps.length - 1;

  const handleContinue = () => {
    // Special handling for step 2 (navigate-claims) - trigger New Claim button click
    if (state.currentStep?.id === 'create-claim') {
      // Trigger the New Claim button click
      const newClaimButton = document.querySelector('[data-testid="button-new-claim"]');
      if (newClaimButton) {
        (newClaimButton as HTMLButtonElement).click();
      }
    }

    if (isLastStep) {
      endTutorial();
    } else {
      nextStep();
    }
  };

  const tutorialContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
      {/* Subtle Dark Backdrop - No Blur */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Element Highlight */}
      {targetPosition && (
        <div 
          className="absolute border-4 border-yellow-400 rounded-lg shadow-lg shadow-yellow-400/50 pointer-events-none animate-pulse"
          style={{
            top: targetPosition.top - 4,
            left: targetPosition.left - 4,
            width: targetPosition.width + 8,
            height: targetPosition.height + 8,
          }}
        />
      )}

      {/* Tutorial Card - Smaller and More Beautiful */}
      <div 
        ref={overlayRef}
        className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 rounded-xl shadow-2xl w-[380px] max-w-[85vw] text-white overflow-hidden animate-in fade-in-0 slide-in-from-bottom-4 duration-300 pointer-events-auto"
      >
        {/* Compact Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-gray-800 font-bold text-sm">{currentStepNumber}</span>
              </div>
              <span className="text-blue-100 font-medium text-sm">
                Step {currentStepNumber} of {totalSteps}
              </span>
            </div>
            <button 
              onClick={endTutorial}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Compact Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-blue-100 text-xs font-medium">{state.progress}% complete</span>
            </div>
            <div className="w-full bg-blue-400/30 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>

          {/* Compact Title */}
          <h2 className="text-xl font-bold mb-3">{state.currentStep.headline}</h2>
          
          {/* Compact Description */}
          <p className="text-blue-100 text-sm leading-relaxed mb-4">
            {state.currentStep.body}
          </p>
        </div>

        {/* Compact Action Boxes */}
        <div className="px-6 pb-4 space-y-3">
          {state.currentStep.actions.map((action, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${
                index === 0 
                  ? 'bg-blue-500/30 border-blue-300/50' 
                  : 'bg-purple-600/30 border-purple-400/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  {action.icon ? (
                    <span className="text-xs">{action.icon}</span>
                  ) : (
                    <span className="text-white font-bold text-xs">{action.number}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1 text-sm">{action.title}</h4>
                  <p className="text-blue-100 text-xs leading-relaxed">{action.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Navigation Footer */}
        <div className="px-6 py-4 bg-black/20 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back</span>
          </button>

          <button
            onClick={skipTutorial}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            <SkipForward className="w-4 h-4" />
            <span className="font-medium">Skip</span>
          </button>

          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-blue-600 hover:bg-blue-50 transition-colors font-semibold text-sm"
          >
            <span>{isLastStep ? 'Finish' : 'Continue'}</span>
            {!isLastStep && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  // Render to document.body using Portal
  return createPortal(tutorialContent, document.body);
}