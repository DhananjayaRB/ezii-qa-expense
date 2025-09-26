import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FundTransfer() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // REMOVED ROLE FILTERING FOR DEVELOPMENT - All users can access all pages

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Fund Transfer</h1>
            <p className="text-gray-600">Manage internal fund transfers and receipts</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fund Transfer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <i className="fas fa-exchange-alt text-4xl mb-4"></i>
                <h3 className="text-lg font-medium mb-2">Fund Transfer Module</h3>
                <p>This feature will be implemented to manage fund transfers.</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}