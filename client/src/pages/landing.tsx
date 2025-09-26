import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Building, Users, TrendingUp } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Landing() {
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Receipt className="h-12 w-12 text-blue-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                EZII Smart Expenses
              </h1>
              <p className="text-xl text-gray-600">
                Expenses
              </p>
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Streamline your expense management process with our comprehensive platform. Submit, approve, and track expenses with ease.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-6 w-6 text-blue-600" />
                Enterprise Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Built for businesses of all sizes with role-based access control and comprehensive reporting.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                Multi-Role Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Designed for employees, accountants, and administrators with tailored workflows for each role.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                Advanced Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Gain insights into spending patterns with detailed reports and customizable dashboards.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            className="px-8 py-4 text-lg"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
