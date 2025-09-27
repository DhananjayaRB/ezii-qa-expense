import { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { TUTORIAL_CONFIG, Tutorial, TutorialStep, TutorialState, TutorialActionType } from './tutorialConfig';
import { checkTutorialPrerequisites, TutorialPrerequisite } from './tutorialPrerequisites';

// Tutorial State Reducer
function tutorialReducer(state: TutorialState, action: TutorialActionType): TutorialState {
  switch (action.type) {
    case 'START_TUTORIAL': {
      const tutorial = TUTORIAL_CONFIG[action.payload.tutorialId];
      if (!tutorial) return state;
      
      return {
        isActive: true,
        currentTutorial: tutorial,
        currentStepIndex: 0,
        currentStep: tutorial.steps[0],
        progress: Math.round((1 / tutorial.totalSteps) * 100)
      };
    }
    
    case 'NEXT_STEP': {
      if (!state.currentTutorial || !state.isActive) return state;
      
      const nextIndex = state.currentStepIndex + 1;
      
      // If we've reached the end, close the tutorial
      if (nextIndex >= state.currentTutorial.steps.length) {
        return {
          isActive: false,
          currentTutorial: null,
          currentStepIndex: 0,
          currentStep: null,
          progress: 0
        };
      }
      
      return {
        ...state,
        currentStepIndex: nextIndex,
        currentStep: state.currentTutorial.steps[nextIndex],
        progress: Math.round(((nextIndex + 1) / state.currentTutorial.totalSteps) * 100)
      };
    }
    
    case 'PREV_STEP': {
      if (!state.currentTutorial || !state.isActive || state.currentStepIndex === 0) return state;
      
      const prevIndex = state.currentStepIndex - 1;
      
      return {
        ...state,
        currentStepIndex: prevIndex,
        currentStep: state.currentTutorial.steps[prevIndex],
        progress: Math.round(((prevIndex + 1) / state.currentTutorial.totalSteps) * 100)
      };
    }
    
    case 'GO_TO_STEP': {
      if (!state.currentTutorial || !state.isActive) return state;
      
      const { stepIndex } = action.payload;
      if (stepIndex < 0 || stepIndex >= state.currentTutorial.steps.length) return state;
      
      return {
        ...state,
        currentStepIndex: stepIndex,
        currentStep: state.currentTutorial.steps[stepIndex],
        progress: Math.round(((stepIndex + 1) / state.currentTutorial.totalSteps) * 100)
      };
    }
    
    case 'SKIP_TUTORIAL':
    case 'END_TUTORIAL': {
      return {
        isActive: false,
        currentTutorial: null,
        currentStepIndex: 0,
        currentStep: null,
        progress: 0
      };
    }
    
    default:
      return state;
  }
}

// Initial State
const initialState: TutorialState = {
  isActive: false,
  currentTutorial: null,
  currentStepIndex: 0,
  currentStep: null,
  progress: 0
};

// Context Interface
interface TutorialContextType {
  state: TutorialState;
  startTutorial: (tutorialId: string) => Promise<boolean>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  skipTutorial: () => void;
  endTutorial: () => void;
  checkPrerequisites: (tutorialId: string) => Promise<{
    canStart: boolean;
    missingPrerequisites: TutorialPrerequisite[];
    allPrerequisites: TutorialPrerequisite[];
  }>;
}

// Create Context
const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Provider Component
interface TutorialProviderProps {
  children: ReactNode;
}

export function TutorialProvider({ children }: TutorialProviderProps) {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);
  const [, setLocation] = useLocation();
  
  const startTutorial = async (tutorialId: string): Promise<boolean> => {
    // Skip prerequisite check - allow all tours to be accessible
    // const prerequisiteCheck = await checkTutorialPrerequisites(tutorialId);
    // 
    // if (!prerequisiteCheck.canStart) {
    //   // Could show a modal here explaining missing prerequisites
    //   console.warn(`Tutorial ${tutorialId} cannot start. Missing prerequisites:`, prerequisiteCheck.missingPrerequisites);
    //   return false;
    // }
    
    dispatch({ type: 'START_TUTORIAL', payload: { tutorialId } });
    return true;
  };
  
  const checkPrerequisites = async (tutorialId: string) => {
    // Return success for all tours - no prerequisite checking
    return {
      canStart: true,
      missingPrerequisites: [],
      allPrerequisites: []
    };
  };
  
  const nextStep = () => {
    dispatch({ type: 'NEXT_STEP' });
  };
  
  const prevStep = () => {
    dispatch({ type: 'PREV_STEP' });
  };
  
  const goToStep = (stepIndex: number) => {
    dispatch({ type: 'GO_TO_STEP', payload: { stepIndex } });
  };
  
  const skipTutorial = () => {
    dispatch({ type: 'SKIP_TUTORIAL' });
  };
  
  const endTutorial = () => {
    dispatch({ type: 'END_TUTORIAL' });
  };

  // Handle navigation when tutorial step changes
  useEffect(() => {
    if (state.isActive && state.currentStep && state.currentStep.route) {
      // Navigate to the route specified in the tutorial step
      setLocation(state.currentStep.route);
    }
  }, [state.currentStep, state.isActive, setLocation]);
  
  const contextValue: TutorialContextType = {
    state,
    startTutorial,
    nextStep,
    prevStep,
    goToStep,
    skipTutorial,
    endTutorial,
    checkPrerequisites
  };
  
  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
    </TutorialContext.Provider>
  );
}

// Hook to use Tutorial Context
export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}