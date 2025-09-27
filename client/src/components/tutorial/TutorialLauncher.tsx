import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, User, BookOpen, Clock, X } from 'lucide-react';
import { TUTORIAL_CONFIG } from './tutorialConfig';
import { useTutorial } from './TutorialContext';

interface TutorialLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialLauncher({ isOpen, onClose }: TutorialLauncherProps) {
  // Guard against missing provider during hot reload or initialization
  let tutorialContext;
  try {
    tutorialContext = useTutorial();
  } catch (error) {
    // Provider not available - likely during hot reload
    return null;
  }
  
  const { startTutorial, checkPrerequisites } = tutorialContext;

  const handleStartTutorial = async (tutorialId: string) => {
    // Check prerequisites before starting
    // Skip prerequisite check - allow all tours to be accessible
    // const prerequisiteCheck = await checkPrerequisites(tutorialId);
    // 
    // if (!prerequisiteCheck.canStart) {
    //   // Show alert about missing prerequisites
    //   alert(`This tutorial requires some system configuration first.\n\nMissing setup:\n${prerequisiteCheck.missingPrerequisites.map(p => `• ${p.name}: ${p.description}`).join('\n')}\n\nPlease complete the Configuration Setup tutorial first or set up these items manually.`);
    //   return;
    // }
    
    const success = await startTutorial(tutorialId);
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const tutorials = Object.values(TUTORIAL_CONFIG);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Beautiful Product Tours Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">📚 Product Tours & Guides</h2>
              <p className="text-blue-100">
                Choose a guided tour to learn how to use your expense management system effectively. 
                Tours are interactive and will guide you step-by-step through key features.
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              aria-label="Close tutorials"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tutorial Categories */}
        <div className="p-6 space-y-6">
          {/* Employee Tours */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Employee Tours</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">For end users</span>
            </div>
            <div className="space-y-3">
              {tutorials.filter(t => ['employeeClaims', 'expenseRequest'].includes(t.id)).map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} onStart={handleStartTutorial} checkPrerequisites={checkPrerequisites} />
              ))}
            </div>
          </div>

          {/* Vendor Management Tours */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Vendor Management</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">For vendor operations</span>
            </div>
            <div className="space-y-3">
              {tutorials.filter(t => ['vendorOnboarding', 'vendorClaim'].includes(t.id)).map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} onStart={handleStartTutorial} checkPrerequisites={checkPrerequisites} />
              ))}
            </div>
          </div>

          {/* System Configuration Tours */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="w-5 h-5 text-orange-600 font-bold text-lg">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">System Setup</h3>
              <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded font-medium">⚠️ Setup required first</span>
            </div>
            <div className="space-y-3">
              {tutorials.filter(t => t.id === 'configurationSetup').map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} onStart={handleStartTutorial} isSetupRequired checkPrerequisites={checkPrerequisites} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal directly in document.body
  return createPortal(modalContent, document.body);
}

// Separate Tutorial Card Component for cleaner code
interface TutorialCardProps {
  tutorial: any;
  onStart: (tutorialId: string) => Promise<void>;
  isSetupRequired?: boolean;
  checkPrerequisites?: (tutorialId: string) => Promise<{
    canStart: boolean;
    missingPrerequisites: any[];
    allPrerequisites: any[];
  }>;
}

function TutorialCard({ tutorial, onStart, isSetupRequired = false, checkPrerequisites }: TutorialCardProps) {
  const getIcon = (tutorialId: string) => {
    switch(tutorialId) {
      case 'employeeClaims': return <User className="w-6 h-6 text-blue-600" />;
      case 'expenseRequest': return <Clock className="w-6 h-6 text-green-600" />;
      case 'vendorOnboarding': return <BookOpen className="w-6 h-6 text-purple-600" />;
      case 'vendorClaim': return <span className="w-6 h-6 text-orange-600 font-bold text-lg">💼</span>;
      case 'configurationSetup': return <span className="w-6 h-6 text-red-600 font-bold text-lg">⚙️</span>;
      default: return <User className="w-6 h-6 text-gray-600" />;
    }
  };

  const getCategory = (tutorialId: string) => {
    switch(tutorialId) {
      case 'employeeClaims': return { label: 'Employee', color: 'text-blue-600 bg-blue-50' };
      case 'expenseRequest': return { label: 'Employee', color: 'text-blue-600 bg-blue-50' };
      case 'vendorOnboarding': return { label: 'Vendor', color: 'text-purple-600 bg-purple-50' };
      case 'vendorClaim': return { label: 'Vendor', color: 'text-purple-600 bg-purple-50' };
      case 'configurationSetup': return { label: 'Admin Setup', color: 'text-orange-600 bg-orange-50' };
      default: return { label: 'General', color: 'text-gray-600 bg-gray-50' };
    }
  };

  const getEstimatedTime = (totalSteps: number) => {
    return Math.ceil(totalSteps * 0.5) + '-' + Math.ceil(totalSteps * 0.7) + ' minutes';
  };

  const getCompletionReward = (tutorialId: string) => {
    switch(tutorialId) {
      case 'employeeClaims': return '📊 Expense Pro - Ready to manage expense claims!';
      case 'expenseRequest': return '✨ Request Master - Pre-approval expert!';
      case 'vendorOnboarding': return '🏢 Vendor Pro - Onboarding specialist!';
      case 'vendorClaim': return '💼 Claims Expert - Vendor management pro!';
      case 'configurationSetup': return '🎯 System Admin - Full setup mastery!';
      default: return '🏆 Tutorial Complete!';
    }
  };

  const category = getCategory(tutorial.id);

  return (
    <div 
      className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
        isSetupRequired 
          ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:border-orange-300' 
          : 'bg-gradient-to-r from-gray-50 to-white border-gray-200 hover:border-blue-300'
      }`}
      data-testid={`tutorial-card-${tutorial.id}`}
    >
      <div className="flex items-start justify-between">
        {/* Left Content */}
        <div className="flex-1 mr-4">
          <div className="flex items-start gap-3 mb-3">
            {/* Icon */}
            <div className={`p-2 ${isSetupRequired ? 'bg-orange-50' : 'bg-blue-50'} rounded-lg`}>
              {getIcon(tutorial.id)}
            </div>
            
            {/* Title & Tags */}
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-1">
                {tutorial.title}
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-medium px-2 py-1 rounded ${category.color}`}>
                  {category.label}
                </span>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {getEstimatedTime(tutorial.totalSteps)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            {tutorial.description}
          </p>
          
          {/* Steps Info */}
          <div className="flex items-center text-xs text-gray-600 mb-3">
            <span className="font-medium">{tutorial.totalSteps} steps</span>
            <span className="mx-2">•</span>
            <span>Interactive guide</span>
          </div>
          
          {/* Completion Reward */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <div className="flex items-center text-xs">
              <span className="text-green-700 font-medium mr-1">🏆 Reward:</span>
              <span className="text-green-600">
                {getCompletionReward(tutorial.id)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Right - Start Button */}
        <div className="flex-shrink-0">
          <button
            onClick={async () => {
              await onStart(tutorial.id);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md text-sm ${
              isSetupRequired 
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            data-testid={`start-tour-${tutorial.id}`}
          >
            <Play className="w-3 h-3" />
            Start Tour
          </button>
        </div>
      </div>
    </div>
  );
}