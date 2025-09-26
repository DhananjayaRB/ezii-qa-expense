import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useLocation } from "wouter";
import { 
  Building2, 
  Settings, 
  CreditCard, 
  Users, 
  FileText, 
  Calculator,
  MapPin,
  DollarSign,
  Briefcase,
  Shield,
  Clock,
  Workflow,
  UserCheck,
  Landmark,
  Coins,
  Receipt,
  AlertTriangle,
  UserPlus,
  Archive,
  Target,
  BookOpen,
  Gavel,
  PieChart,
  FileBarChart,
  Wrench,
  BarChart3
} from "lucide-react";

export default function Configuration() {
  const [, setLocation] = useLocation();
  
  const configSections = [
    {
      title: "Organization Master",
      description: "Settings, Masters, Integration",
      icon: Building2,
      bgColor: "bg-blue-500",
      items: [
        { name: "Employees", icon: Users, link: "/config/employees" },
        { name: "Locations", icon: MapPin, link: "/config/locations" },
        { name: "Departments", icon: Briefcase, link: "/config/departments" },
        { name: "Programs", icon: Target, link: "/config/programs" },
        { name: "Divisions", icon: Archive, link: "/config/divisions" },
        { name: "Projects", icon: FileBarChart, link: "/config/projects" }
      ]
    },
    {
      title: "Settings",
      description: "Core system configuration",
      icon: Settings,
      bgColor: "bg-orange-500",
      items: [
        { name: "Admin Accounts", icon: Shield, link: "/config/admin-accounts" },
        { name: "User Roles", icon: UserCheck, link: "/config/user-roles" },
        { name: "Access Rights", icon: Shield, link: "/config/access-rights" },
        { name: "Financial Period Cycle", icon: Clock, link: "/config/financial-periods" },
        { name: "Workflow", icon: Workflow, link: "/config/workflow" },
        { name: "Expense User's", icon: UserPlus, link: "/config/expense-users" },
        { name: "GST Config", icon: Calculator, link: "/config/gst-config" }
      ]
    },
    {
      title: "Reports & Analytics",
      description: "Report generation and data analytics tools",
      icon: BarChart3,
      bgColor: "bg-amber-500",
      items: [
        { name: "Report Builder", icon: Wrench, link: "/config/report-builder" }
      ]
    },
    {
      title: "Cash and Bank Masters",
      description: "Financial instruments management",
      icon: CreditCard,
      bgColor: "bg-green-500", 
      items: [
        { name: "Cash Box", icon: Archive, link: "/config/cash-box" },
        { name: "Bank Operators", icon: UserCheck, link: "/config/bank-operators" },
        { name: "Bank Accounts", icon: Landmark, link: "/config/bank-accounts" },
        { name: "Foreign Currencies", icon: Coins, link: "/config/foreign-currencies" },
        { name: "Company Cards", icon: CreditCard, link: "/config/company-cards" },
        { name: "Bill Hold Reason", icon: AlertTriangle, link: "/config/bill-hold-reasons" },
        { name: "Bill Master", icon: FileText, link: "/config/bill-master" },
        { name: "Account Supervisors", icon: Shield, link: "/config/account-supervisors" },
        { name: "User Bank Account", icon: Landmark, link: "/config/user-bank-accounts" }
      ]
    },
    {
      title: "Expense Master",
      description: "Expense categories and policies",
      icon: FileText,
      bgColor: "bg-purple-500",
      items: [
        { name: "Expense Groups", icon: Archive, link: "/config/expense-groups" },
        { name: "Purpose Master", icon: Target, link: "/config/purpose-master" },
        { name: "Expense Heads", icon: FileText, link: "/config/expense-heads" },
        { name: "Expense Policy", icon: Gavel, link: "/config/expense-policy" },
        { name: "Expense Head Classes", icon: Archive, link: "/config/expense-head-classes" },
        { name: "Exception Rule", icon: AlertTriangle, link: "/config/exception-rules" },
        { name: "Cost Center", icon: PieChart, link: "/configuration/cost-center" }
      ]
    },
    {
      title: "Party Master",
      description: "External entities management",
      icon: Users,
      bgColor: "bg-teal-500",
      items: [
        { name: "Party Type", icon: Archive, link: "/config/party-types" },
        { name: "Party Master", icon: Users, link: "/party-master" }
      ]
    },
    {
      title: "Accounting Interface",
      description: "Financial system integration",
      icon: Calculator,
      bgColor: "bg-indigo-500",
      items: [
        { name: "Tally ERP", icon: Calculator, link: "/config/tally-erp" },
        { name: "Tax Masters", icon: Receipt, link: "/config/tax-masters" },
        { name: "TDS Master", icon: Receipt, link: "/config/tds-master" },
        { name: "Control Accounts", icon: Landmark, link: "/config/control-accounts" }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
                <p className="text-gray-600">Settings, Masters, Integration</p>
              </div>
              <span className="text-sm text-gray-500 flex items-center">
                <Settings className="w-4 h-4 mr-1" />
                Configuration
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {configSections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <Card key={index} className="border-0 shadow-md">
                    <CardHeader className={`${section.bgColor} text-white rounded-t-lg`}>
                      <CardTitle className="flex items-center text-lg font-semibold">
                        <IconComponent className="w-6 h-6 mr-3" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-2 gap-0">
                        {section.items.map((item, itemIndex) => {
                          const ItemIcon = item.icon;
                          return (
                            <div
                              key={itemIndex}
                              className="p-4 border-b border-r border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-200 last:border-b-0 odd:border-r-0 group"
                              data-testid={`config-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                              onClick={() => {
                                if (item.link) {
                                  setLocation(item.link);
                                }
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <ItemIcon className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                                  {item.name}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Configuration Overview</h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                This configuration system manages all master data that drives the expense management workflow. 
                Each section contains critical settings that control business logic, approval chains, and financial processing. 
                Changes to these configurations directly impact system behavior, reporting, and compliance requirements.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}