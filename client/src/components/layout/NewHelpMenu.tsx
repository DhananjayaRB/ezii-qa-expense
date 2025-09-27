import { useState } from 'react';
import { TutorialLauncher } from '../tutorial/TutorialLauncher';
import { TutorialOverlay } from '../tutorial/TutorialOverlay';
import { 
  HelpCircle, 
  BookOpen, 
  Play, 
  FileText, 
  MessageSquare, 
  ExternalLink,
  User,
  Presentation,
  Download,
  ChevronRight
} from 'lucide-react';

export function NewHelpMenu() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isDocumentationOpen, setIsDocumentationOpen] = useState(false);

  const startTutorial = () => {
    setIsTutorialOpen(true);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleDocumentation = () => {
    setIsDocumentationOpen(!isDocumentationOpen);
  };

  const openUserManual = () => {
    // Open user manual in new window
    window.open('/user-manual', '_blank');
    setIsDropdownOpen(false);
  };

  const openPresentationDemo = () => {
    // Open PowerPoint demo in new window
    window.open('/demo-presentation', '_blank');
    setIsDropdownOpen(false);
  };

  const downloadUserManual = () => {
    // Download user manual as PDF
    const link = document.createElement('a');
    link.href = '/api/download/user-manual.pdf';
    link.download = 'expense-management-user-manual.pdf';
    link.click();
    setIsDropdownOpen(false);
  };

  return (
    <>
      <div className="relative">
        {/* Help Button - Beautiful Purple Design */}
        <button
          onClick={toggleDropdown}
          className="group relative p-3 rounded-xl bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          data-testid="help-menu-button"
          aria-label="Help & Support"
        >
          <HelpCircle className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
          
          {/* Notification Badge for New Features */}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white animate-pulse" />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-3 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-[10000] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4 text-white">
              <h3 className="font-semibold text-lg">Help & Support</h3>
              <p className="text-purple-100 text-sm">Get started with interactive guides</p>
            </div>

            <div className="p-2">
              {/* Interactive Tours */}
              <button
                onClick={startTutorial}
                className="w-full flex items-start gap-3 p-3 hover:bg-purple-50 rounded-lg cursor-pointer group transition-colors"
                data-testid="start-tutorial-button"
              >
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    Product Tours & Guides
                  </div>
                  <div className="text-sm text-gray-600">
                    Interactive tutorial popup
                  </div>
                </div>
                <div className="px-2 py-1 bg-purple-100 rounded-full text-xs font-medium text-purple-700">
                  📚
                </div>
              </button>
              
              {/* Separator */}
              <div className="h-px bg-gray-200 my-2" />
              
              {/* Documentation Section */}
              <div className="relative">
                <button 
                  onClick={toggleDocumentation}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer group transition-colors"
                  data-testid="documentation-menu-button"
                >
                  <BookOpen className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">Documentation</div>
                    <div className="text-sm text-gray-600">User guides & client demos</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isDocumentationOpen ? 'rotate-90' : ''}`} />
                </button>

                {/* Documentation Submenu */}
                {isDocumentationOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-purple-200 pl-3">
                    <button 
                      onClick={openUserManual}
                      className="w-full flex items-center gap-3 p-2 hover:bg-purple-50 rounded-lg cursor-pointer group transition-colors"
                      data-testid="user-manual-button"
                    >
                      <User className="w-3 h-3 text-purple-500" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-gray-900">User Manual</div>
                        <div className="text-xs text-gray-600">Complete step-by-step guide</div>
                      </div>
                    </button>

                    <button 
                      onClick={openPresentationDemo}
                      className="w-full flex items-center gap-3 p-2 hover:bg-purple-50 rounded-lg cursor-pointer group transition-colors"
                      data-testid="demo-presentation-button"
                    >
                      <Presentation className="w-3 h-3 text-purple-500" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-gray-900">Demo Presentation</div>
                        <div className="text-xs text-gray-600">PowerPoint for client demos</div>
                      </div>
                    </button>

                    <button 
                      onClick={downloadUserManual}
                      className="w-full flex items-center gap-3 p-2 hover:bg-purple-50 rounded-lg cursor-pointer group transition-colors"
                      data-testid="download-manual-button"
                    >
                      <Download className="w-3 h-3 text-purple-500" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-gray-900">Download Manual</div>
                        <div className="text-xs text-gray-600">PDF format</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer group transition-colors">
                <FileText className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">Knowledge Base</div>
                  <div className="text-sm text-gray-600">FAQs & troubleshooting</div>
                </div>
              </button>
              
              {/* Separator */}
              <div className="h-px bg-gray-200 my-2" />
              
              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer group transition-colors">
                <MessageSquare className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">Contact Support</div>
                  <div className="text-sm text-gray-600">Get help from our team</div>
                </div>
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer group transition-colors">
                <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-purple-600 transition-colors" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">Feature Requests</div>
                  <div className="text-sm text-gray-600">Suggest improvements</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Click outside to close */}
        {isDropdownOpen && (
          <div 
            className="fixed inset-0 z-[9999]" 
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </div>

      {/* Tutorial System */}
      <TutorialLauncher 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
      />
      <TutorialOverlay />
    </>
  );
}