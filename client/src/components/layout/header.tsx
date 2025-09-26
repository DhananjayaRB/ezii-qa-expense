import { Bell, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRoleToggle } from "@/hooks/useRoleToggle";
import eziiLogo from "@assets/image_1758275052648.png";

export default function Header() {
  const { user } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { currentRole, toggleRole, isAdmin } = useRoleToggle();

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-16 flex items-center">
            <img src={eziiLogo} alt="eziiexpense" className="h-full object-contain" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800" data-testid="text-user-name">
                {userProfile?.employer_name || userProfile?.data?.employer_name || 
                 (user ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || (user as any).email : "User")}
              </div>
              <div className="text-xs text-gray-500" data-testid="text-user-email">
                {userProfile?.email || userProfile?.data?.email || (user as any)?.email || "user@example.com"}
              </div>
            </div>
            <div 
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
              onClick={handleLogout}
              title="Click to logout"
              data-testid="avatar-user"
            >
              {getInitials(
                (userProfile?.employer_name || userProfile?.data?.employer_name)?.split(' ')[0] || (user as any)?.firstName, 
                (userProfile?.employer_name || userProfile?.data?.employer_name)?.split(' ')[1] || (user as any)?.lastName
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
