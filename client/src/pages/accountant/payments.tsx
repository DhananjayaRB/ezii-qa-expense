import { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Payments() {
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

  const paymentOptions = [
    {
      title: "Initiate Payments",
      description: "Process and initiate payments for approved expense claims",
      icon: "fas fa-paper-plane",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/accountant/payments/initiate"
    },
    {
      title: "Release Bills",
      description: "Review and release bills for payment processing",
      icon: "fas fa-rupee-sign", 
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/accountant/payments/release-bills"
    },
    {
      title: "Add Card Statement",
      description: "Upload and manage credit card statements",
      icon: "fas fa-credit-card",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/accountant/payments/card-stmt"
    },
    {
      title: "Card Payments",
      description: "Process and manage card-based payments",
      icon: "fas fa-money-check-alt",
      color: "text-orange-600", 
      bgColor: "bg-orange-50",
      link: "/accountant/payments/card-payments"
    },
    {
      title: "Employee Bank Advice",
      description: "Manage employee bank payment instructions",
      icon: "fas fa-university",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      link: "/accountant/payments/emp-bank-advice"
    },
    {
      title: "Vendor Bank Advice", 
      description: "Manage vendor bank payment instructions",
      icon: "fas fa-handshake",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      link: "/accountant/payments/vendor-bank-advice"
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments & Processing</h1>
            <p className="text-gray-600">Manage all payment processes and financial transactions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentOptions.map((option, index) => (
              <Link key={index} href={option.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-lg ${option.bgColor} flex items-center justify-center mb-4`}>
                      <i className={`${option.icon} text-xl ${option.color}`}></i>
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {option.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-gray-600 text-sm leading-relaxed">
                      {option.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className={`text-sm font-medium ${option.color} flex items-center gap-1`}>
                        Access Module
                        <i className="fas fa-arrow-right text-xs"></i>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
