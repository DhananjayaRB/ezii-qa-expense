import { Bell, Shield, User, Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRoleToggle } from "@/hooks/useRoleToggle";
import { usePlanStatus } from "@/hooks/usePlanStatus";
import { useMobileMenu } from "@/contexts/MobileMenuContext";
import { useTheme } from "@/contexts/ThemeContext";
import { NewHelpMenu } from "./NewHelpMenu";
import eziiLogo from "@assets/image_1758275052648.png";
import payLogo from "@/assets/pay-logo.png";

export default function Header() {
  const { user } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { currentRole, toggleRole, isAdmin } = useRoleToggle();
  const { data: planStatus } = usePlanStatus();
  const { toggleMobileMenu } = useMobileMenu();
  const { sidebarTheme, toggleSidebarTheme } = useTheme();

  // Determine which logo to use based on isSaas flag
  const logoSrc = planStatus?.isSaas === false ? payLogo : eziiLogo;
  const logoAlt = planStatus?.isSaas === false ? "PAY - Convenient & Compliant" : "eziiexpense";

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="glass backdrop-blur-xl bg-gradient-to-r from-white/95 to-white/90 dark:from-gray-900/95 dark:to-gray-800/90 border-b border-white/20 dark:border-gray-700/30 px-4 lg:px-8 py-4 shadow-lg shadow-black/5 dark:shadow-black/20 animate-fade-in sticky top-0 z-[1100]">
      <div className="flex items-center justify-between max-w-full">
        {/* Left Section - Logo & Mobile Menu */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Beautiful Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-3 rounded-xl hover:bg-primary/10 hover:scale-105 transition-all duration-200 group"
            onClick={toggleMobileMenu}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors" />
          </Button>
          
          {/* Enhanced Logo Container */}
          <div className="h-12 flex items-center hover-lift transition-all duration-300">
            <img 
              src={logoSrc} 
              alt={logoAlt} 
              className="h-full object-contain filter drop-shadow-md hover:drop-shadow-lg transition-all duration-300" 
              data-testid="header-logo" 
            />
          </div>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Action Buttons with Modern Design */}
          <div className="flex items-center gap-2">
            {/* Notification Bell with Badge Effect & Accessibility */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-3 rounded-xl hover:bg-primary/10 hover:scale-105 transition-all duration-200 group focus-ring interactive"
              title="Notifications"
              aria-label="View notifications (3 unread)"
              aria-describedby="notification-status"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors" aria-hidden="true" />
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full border-2 border-white dark:border-gray-900 shadow-lg animate-pulse" 
                aria-hidden="true"
              />
              <span id="notification-status" className="sr-only">You have 3 unread notifications</span>
            </Button>
            
            {/* Beautiful Theme Toggle with Accessibility */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleSidebarTheme}
              className="p-3 rounded-xl hover:bg-primary/10 hover:scale-105 transition-all duration-200 group focus-ring interactive"
              title={sidebarTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={`Switch to ${sidebarTheme === 'dark' ? 'light' : 'dark'} mode`}
              aria-pressed={sidebarTheme === 'dark' ? 'true' : 'false'}
              data-testid="button-theme-toggle-header"
            >
              {sidebarTheme === 'dark' ? 
                <Sun className="h-5 w-5 text-amber-500 group-hover:text-amber-400 transition-colors" aria-hidden="true" /> : 
                <Moon className="h-5 w-5 text-indigo-600 group-hover:text-indigo-500 transition-colors" aria-hidden="true" />
              }
              <span className="sr-only">{sidebarTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </Button>
            
            <NewHelpMenu />
          </div>

          {/* Enhanced User Profile Section */}
          <div className="flex items-center gap-3 lg:gap-4">
            {/* User Info with Better Typography */}
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight" data-testid="text-user-name">
                {userProfile?.employer_name || userProfile?.data?.employer_name || 
                 (user ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || (user as any).email : "User")}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium" data-testid="text-user-email">
                {userProfile?.email || userProfile?.data?.email || (user as any)?.email || "user@example.com"}
              </div>
            </div>
            
            {/* Stunning Avatar with Gradient & Accessibility */}
            <button
              className="w-11 h-11 bg-gradient-to-br from-primary via-primary-600 to-primary-700 rounded-xl flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-105 hover:shadow-colored transition-all duration-200 shadow-lg ring-2 ring-white/50 dark:ring-gray-700/50 focus-ring interactive"
              onClick={handleLogout}
              title="User menu - Click to logout"
              aria-label={`User menu for ${userProfile?.employer_name || userProfile?.data?.employer_name || 'User'} - Click to logout`}
              data-testid="avatar-user"
            >
              {getInitials(
                (userProfile?.employer_name || userProfile?.data?.employer_name)?.split(' ')[0] || (user as any)?.firstName, 
                (userProfile?.employer_name || userProfile?.data?.employer_name)?.split(' ')[1] || (user as any)?.lastName
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
