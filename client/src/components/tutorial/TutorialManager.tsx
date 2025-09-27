import { ReactNode } from 'react';

interface TutorialManagerProps {
  page: 'dashboard' | 'expense-claim' | 'ocr-upload' | 'other';
  children: ReactNode;
}

/**
 * Simplified Tutorial Manager
 * 
 * The tutorial system has been completely rebuilt with a new approach.
 * Tutorials are now managed through the Help Menu in the header with:
 * - Beautiful purple cards
 * - Element highlighting
 * - Interactive guided tours
 * 
 * This component now simply passes through children since tutorial
 * functionality is handled by the NewHelpMenu component.
 */
export function TutorialManager({ page, children }: TutorialManagerProps) {
  // Simply pass through children - tutorials are now handled via Help Menu
  return <>{children}</>;
}

// Simplified hook that does nothing (kept for compatibility)
export function useLegacyTutorialTrigger() {
  return {
    triggerTutorial: () => {
      console.log('Legacy tutorial system replaced. Use Help Menu for tutorials.');
    },
    closeTutorial: () => {},
    currentTutorial: null,
  };
}