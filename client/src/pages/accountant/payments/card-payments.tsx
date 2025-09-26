import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CardPayments() {
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-60">
        <Header />
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Card Payments</h1>
            <p className="text-gray-600">Process and manage card-based payments</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Card Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <i className="fas fa-money-check-alt text-4xl mb-4"></i>
                <h3 className="text-lg font-medium mb-2">Card Payments Module</h3>
                <p>This feature will be implemented to manage card payments.</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}