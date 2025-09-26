import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { 
  FileText, 
  Users, 
  TrendingUp, 
  CreditCard, 
  DollarSign, 
  BarChart3,
  PieChart,
  Calendar
} from "lucide-react";

export default function Reports() {
  const reportCards = [
    {
      title: "User Report",
      description: "Comprehensive expense analytics and insights for individual users",
      icon: FileText,
      link: "/reports/user",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200"
    },
    {
      title: "Receipt Report",
      description: "Receipt management and tracking analysis",
      icon: FileText,
      link: "/reports/receipt",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200"
    },
    {
      title: "Control Reports",
      description: "Management control and oversight reports",
      icon: BarChart3,
      link: "/reports/control",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200"
    },
    {
      title: "Accountant Report",
      description: "Financial reports for accounting and audit purposes",
      icon: DollarSign,
      link: "/reports/accountant",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200"
    },
    {
      title: "Efficient Folks Report",
      description: "Performance and efficiency tracking reports",
      icon: TrendingUp,
      link: "/reports/efficient-folks",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      borderColor: "border-red-200"
    },
    {
      title: "Department Report",
      description: "Analysis of expenses by department and cost centers",
      icon: Users,
      link: "/reports/department",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      borderColor: "border-indigo-200"
    },
    {
      title: "Card Statement Analysis",
      description: "Corporate card usage and reconciliation reports",
      icon: CreditCard,
      link: "/reports/card-analysis",
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600",
      borderColor: "border-teal-200"
    },
    {
      title: "Compliance Report",
      description: "Policy compliance and exception tracking",
      icon: PieChart,
      link: "/reports/compliance",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      borderColor: "border-yellow-200"
    },
    {
      title: "Custom Reports",
      description: "Access and manage all custom reports created with Report Builder",
      icon: FileText,
      link: "/reports/custom",
      bgColor: "bg-gray-50",
      iconColor: "text-gray-600",
      borderColor: "border-gray-200"
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600">Choose from various expense reports and analytics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {reportCards.map((report, index) => {
                const IconComponent = report.icon;
                return (
                  <Link key={index} href={report.link}>
                    <Card 
                      className={`${report.bgColor} ${report.borderColor} border-2 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105`}
                      data-testid={`card-report-${report.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <CardHeader className="pb-3">
                        <div className={`w-12 h-12 ${report.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                          <IconComponent className={`w-6 h-6 ${report.iconColor}`} />
                        </div>
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {report.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {report.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}