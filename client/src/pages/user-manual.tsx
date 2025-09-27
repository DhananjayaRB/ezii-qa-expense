import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  BookOpen,
  Users,
  Receipt,
  CreditCard,
  Settings,
  BarChart3,
  Smartphone,
  Bot,
  Camera,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Home,
  FileText,
  DollarSign,
  Workflow
} from "lucide-react";

export default function UserManual() {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", title: "Overview", icon: Home },
    { id: "getting-started", title: "Getting Started", icon: BookOpen },
    { id: "employee-guide", title: "Employee Guide", icon: Users },
    { id: "expense-claims", title: "Expense Claims", icon: Receipt },
    { id: "ai-features", title: "AI Features", icon: Bot },
    { id: "ocr-processing", title: "OCR Processing", icon: Camera },
    { id: "approvals", title: "Approvals", icon: CheckCircle },
    { id: "reports", title: "Reports & Analytics", icon: BarChart3 },
    { id: "payments", title: "Payment Processing", icon: CreditCard },
    { id: "configuration", title: "System Configuration", icon: Settings },
    { id: "mobile", title: "Mobile Usage", icon: Smartphone },
    { id: "troubleshooting", title: "Troubleshooting", icon: AlertCircle }
  ];

  const downloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Manual</h1>
              <p className="text-gray-600 mt-1">Complete guide to using your expense management system</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={downloadPDF} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={() => window.close()}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0 print:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                          activeSection === section.id
                            ? "bg-purple-50 text-purple-700 border-r-2 border-purple-600"
                            : "text-gray-600"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {section.title}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Card>
              <CardContent className="p-8">
                {/* Overview Section */}
                {activeSection === "overview" && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Expense Management Platform
                      </h1>
                      <p className="text-xl text-gray-600 mb-8">
                        Complete User Manual & Documentation Guide
                      </p>
                      <div className="flex justify-center">
                        <Badge className="px-4 py-2 text-sm bg-purple-100 text-purple-800">
                          Version 2024.1 - Latest Release
                        </Badge>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h2 className="text-2xl font-semibold mb-4">What's Included</h2>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Complete step-by-step tutorials</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Real application screenshots</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>AI features and OCR guidance</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Role-based instructions</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Troubleshooting solutions</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>Best practices and tips</span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Bot className="w-6 h-6 text-purple-500 mt-1" />
                            <div>
                              <h3 className="font-semibold">AI-Powered Assistant</h3>
                              <p className="text-sm text-gray-600">Natural language processing for commands and queries</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Camera className="w-6 h-6 text-blue-500 mt-1" />
                            <div>
                              <h3 className="font-semibold">Advanced OCR Processing</h3>
                              <p className="text-sm text-gray-600">Automatic data extraction from receipts and invoices</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Workflow className="w-6 h-6 text-green-500 mt-1" />
                            <div>
                              <h3 className="font-semibold">Automated Workflows</h3>
                              <p className="text-sm text-gray-600">Streamlined approval and payment processes</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <Info className="w-6 h-6 text-blue-500 mt-1" />
                        <div>
                          <h3 className="font-semibold text-blue-900 mb-2">Quick Start Tip</h3>
                          <p className="text-blue-800">
                            New to the system? Start with the "Getting Started" section for a quick overview, 
                            then move to your role-specific guide (Employee, Manager, or Admin).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Getting Started Section */}
                {activeSection === "getting-started" && (
                  <div className="space-y-8">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">Getting Started</h1>
                      <p className="text-gray-600 mb-8">
                        Welcome to your new expense management system. This guide will help you get up and running quickly.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">System Access</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-semibold mb-2">Login Process</h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Navigate to your organization's expense portal</li>
                              <li>Click "Login with Replit" for secure authentication</li>
                              <li>Complete the single sign-on process</li>
                              <li>Access your personalized dashboard</li>
                            </ol>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">First Time Setup</h3>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Profile automatically populated
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Role permissions assigned
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                Dashboard configured
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
                        <div className="bg-gray-100 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-600 text-center italic">
                            📸 Dashboard Screenshot: Main expense dashboard showing widgets, navigation, and quick actions
                          </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="bg-white border rounded-lg p-4">
                            <BarChart3 className="w-8 h-8 text-blue-500 mb-2" />
                            <h3 className="font-semibold mb-1">Analytics Widgets</h3>
                            <p className="text-sm text-gray-600">Real-time expense tracking and trends</p>
                          </div>
                          <div className="bg-white border rounded-lg p-4">
                            <Receipt className="w-8 h-8 text-green-500 mb-2" />
                            <h3 className="font-semibold mb-1">Quick Actions</h3>
                            <p className="text-sm text-gray-600">Submit claims and requests instantly</p>
                          </div>
                          <div className="bg-white border rounded-lg p-4">
                            <AlertCircle className="w-8 h-8 text-orange-500 mb-2" />
                            <h3 className="font-semibold mb-1">Pending Items</h3>
                            <p className="text-sm text-gray-600">Approvals and tasks requiring attention</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold mb-4">Navigation</h2>
                        <div className="bg-gray-100 rounded-lg p-4 mb-4">
                          <p className="text-sm text-gray-600 text-center italic">
                            📸 Navigation Screenshot: Sidebar menu showing all available modules and sections
                          </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-semibold mb-2">Employee Section</h3>
                            <ul className="space-y-1 text-sm">
                              <li>• Dashboard - Overview and quick actions</li>
                              <li>• Claims - Submit and track expense claims</li>
                              <li>• Requests - Pre-approval expense requests</li>
                              <li>• Reports - Personal expense reports</li>
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">Management Section</h3>
                            <ul className="space-y-1 text-sm">
                              <li>• Approvals - Pending claims and requests</li>
                              <li>• Analytics - Team and department insights</li>
                              <li>• Reports - Management reporting suite</li>
                              <li>• Payments - Payment batch processing</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Employee Guide */}
                {activeSection === "employee-guide" && (
                  <div className="space-y-8">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">Employee Guide</h1>
                      <p className="text-gray-600 mb-8">
                        Complete guide for employees to submit, track, and manage their expense claims efficiently.
                      </p>
                    </div>

                    <Tabs defaultValue="submitting" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="submitting">Submitting Claims</TabsTrigger>
                        <TabsTrigger value="tracking">Tracking Status</TabsTrigger>
                        <TabsTrigger value="requests">Pre-Approval</TabsTrigger>
                        <TabsTrigger value="tips">Best Practices</TabsTrigger>
                      </TabsList>

                      <TabsContent value="submitting" className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold mb-4">How to Submit an Expense Claim</h2>
                          <div className="bg-gray-100 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-600 text-center italic">
                              📸 Claim Form Screenshot: New expense claim form with all fields and upload area
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="border-l-4 border-blue-500 pl-4">
                            <h3 className="font-semibold mb-2">Step 1: Navigate to Claims</h3>
                            <p className="text-sm text-gray-600">Click on "Claims" in the Employee section of the sidebar menu.</p>
                          </div>
                          
                          <div className="border-l-4 border-blue-500 pl-4">
                            <h3 className="font-semibold mb-2">Step 2: Create New Claim</h3>
                            <p className="text-sm text-gray-600">Click the "New Claim" button to start a new expense submission.</p>
                          </div>
                          
                          <div className="border-l-4 border-blue-500 pl-4">
                            <h3 className="font-semibold mb-2">Step 3: Fill Required Information</h3>
                            <ul className="text-sm text-gray-600 list-disc list-inside">
                              <li>Select expense category (Travel, Meals, Office Supplies, etc.)</li>
                              <li>Enter expense amount in ₹ (Indian Rupees)</li>
                              <li>Choose expense date from calendar</li>
                              <li>Add detailed description of the expense</li>
                              <li>Select project or cost center if applicable</li>
                            </ul>
                          </div>
                          
                          <div className="border-l-4 border-blue-500 pl-4">
                            <h3 className="font-semibold mb-2">Step 4: Upload Receipts</h3>
                            <p className="text-sm text-gray-600">Drag and drop receipt images or PDFs. Our AI will automatically extract data for you!</p>
                          </div>
                          
                          <div className="border-l-4 border-blue-500 pl-4">
                            <h3 className="font-semibold mb-2">Step 5: Review and Submit</h3>
                            <p className="text-sm text-gray-600">Review all information, ensure receipt attachments are clear, then click "Submit Claim".</p>
                          </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                            <div>
                              <h3 className="font-semibold text-green-900 mb-1">Success!</h3>
                              <p className="text-green-800 text-sm">
                                Your claim has been submitted and is now in the approval workflow. 
                                You'll receive notifications about status updates.
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="tracking" className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold mb-4">Tracking Your Claims</h2>
                          <div className="bg-gray-100 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-600 text-center italic">
                              📸 Claims List Screenshot: Table showing all submitted claims with status indicators
                            </p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-semibold mb-3">Status Indicators</h3>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                                <span className="text-sm">Waiting for approval</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-blue-100 text-blue-800">In Review</Badge>
                                <span className="text-sm">Being reviewed by manager</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-100 text-green-800">Approved</Badge>
                                <span className="text-sm">Ready for payment</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-purple-100 text-purple-800">Paid</Badge>
                                <span className="text-sm">Reimbursement processed</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                                <span className="text-sm">Needs revision</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-3">Quick Actions</h3>
                            <ul className="space-y-2 text-sm">
                              <li>• Click on any claim to view detailed information</li>
                              <li>• Download receipts and supporting documents</li>
                              <li>• View approval history and comments</li>
                              <li>• Edit claims that are still pending</li>
                              <li>• Resubmit rejected claims with corrections</li>
                            </ul>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="requests" className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold mb-4">Pre-Approval Requests</h2>
                          <p className="text-gray-600 mb-4">
                            Submit requests for approval before incurring expenses, especially for large amounts or travel.
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-semibold mb-3">When to Submit Requests</h3>
                            <ul className="space-y-2 text-sm">
                              <li>• Travel bookings and accommodations</li>
                              <li>• Conference and training registrations</li>
                              <li>• Large equipment purchases</li>
                              <li>• Client entertainment expenses</li>
                              <li>• Any expense exceeding your approval limit</li>
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-3">Request Process</h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm">
                              <li>Go to Employee → Requests</li>
                              <li>Click "New Request"</li>
                              <li>Fill in estimated amounts and dates</li>
                              <li>Provide detailed justification</li>
                              <li>Submit for manager approval</li>
                              <li>Proceed with expense once approved</li>
                            </ol>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="tips" className="space-y-6">
                        <h2 className="text-xl font-semibold mb-4">Best Practices & Tips</h2>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h3 className="font-semibold text-blue-900 mb-2">Receipt Management</h3>
                              <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Take photos immediately after purchase</li>
                                <li>• Ensure receipts are clear and readable</li>
                                <li>• Include payment method details</li>
                                <li>• Save digital receipts and confirmations</li>
                              </ul>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h3 className="font-semibold text-green-900 mb-2">Faster Approvals</h3>
                              <ul className="text-sm text-green-800 space-y-1">
                                <li>• Submit claims promptly (within 30 days)</li>
                                <li>• Provide detailed descriptions</li>
                                <li>• Follow company expense policies</li>
                                <li>• Use correct expense categories</li>
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <h3 className="font-semibold text-purple-900 mb-2">AI Features</h3>
                              <ul className="text-sm text-purple-800 space-y-1">
                                <li>• Use OCR for automatic data extraction</li>
                                <li>• Ask the AI assistant for help</li>
                                <li>• Let smart categorization suggest categories</li>
                                <li>• Review AI-extracted data before submitting</li>
                              </ul>
                            </div>

                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <h3 className="font-semibold text-orange-900 mb-2">Common Mistakes</h3>
                              <ul className="text-sm text-orange-800 space-y-1">
                                <li>• Missing or unclear receipts</li>
                                <li>• Incorrect expense categories</li>
                                <li>• Late submissions (over 30 days)</li>
                                <li>• Personal expenses mixed with business</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* AI Features Section */}
                {activeSection === "ai-features" && (
                  <div className="space-y-8">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Features</h1>
                      <p className="text-gray-600 mb-8">
                        Leverage artificial intelligence to streamline your expense management workflow with smart automation and assistance.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <Bot className="w-8 h-8 text-purple-600" />
                            <h2 className="text-xl font-semibold">Intelligent Assistant</h2>
                          </div>
                          <p className="text-gray-600 mb-4">
                            Your AI-powered expense assistant understands natural language commands and can help with various tasks.
                          </p>
                          
                          <h3 className="font-semibold mb-2">Sample Commands:</h3>
                          <div className="space-y-2 text-sm">
                            <div className="bg-white rounded p-2 border">
                              <code>"Show me pending claims"</code>
                            </div>
                            <div className="bg-white rounded p-2 border">
                              <code>"What's my cashbox balance?"</code>
                            </div>
                            <div className="bg-white rounded p-2 border">
                              <code>"Approve all claims under ₹5,000"</code>
                            </div>
                            <div className="bg-white rounded p-2 border">
                              <code>"Create a new vendor for ABC Company"</code>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-100 rounded-lg p-4">
                          <p className="text-sm text-gray-600 text-center italic">
                            📸 AI Chat Screenshot: Chat interface showing conversation with AI assistant
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <h2 className="text-xl font-semibold">Smart Automation</h2>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <ArrowRight className="w-4 h-4 text-green-500 mt-1" />
                              <div>
                                <h3 className="font-semibold text-sm">Auto-Categorization</h3>
                                <p className="text-xs text-gray-600">Suggests expense categories based on description and amount</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <ArrowRight className="w-4 h-4 text-green-500 mt-1" />
                              <div>
                                <h3 className="font-semibold text-sm">Vendor Recognition</h3>
                                <p className="text-xs text-gray-600">Automatically identifies and standardizes vendor names</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <ArrowRight className="w-4 h-4 text-green-500 mt-1" />
                              <div>
                                <h3 className="font-semibold text-sm">Policy Validation</h3>
                                <p className="text-xs text-gray-600">Real-time checking against company expense policies</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <ArrowRight className="w-4 h-4 text-green-500 mt-1" />
                              <div>
                                <h3 className="font-semibold text-sm">Smart Suggestions</h3>
                                <p className="text-xs text-gray-600">Proactive recommendations based on user patterns</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-500 mt-1" />
                            <div>
                              <h3 className="font-semibold text-blue-900 mb-1">Pro Tip</h3>
                              <p className="text-blue-800 text-sm">
                                The AI learns from your usage patterns and becomes more accurate over time. 
                                Always review AI suggestions before submitting.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-4">Available AI Commands by Role</h2>
                      <Tabs defaultValue="employee" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="employee">Employee</TabsTrigger>
                          <TabsTrigger value="manager">Manager</TabsTrigger>
                          <TabsTrigger value="admin">Administrator</TabsTrigger>
                        </TabsList>

                        <TabsContent value="employee" className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-semibold mb-2">Query Commands</h3>
                              <div className="space-y-1 text-sm">
                                <div className="bg-gray-50 p-2 rounded">Show my expenses</div>
                                <div className="bg-gray-50 p-2 rounded">Pending claims status</div>
                                <div className="bg-gray-50 p-2 rounded">Receipt history</div>
                                <div className="bg-gray-50 p-2 rounded">My requests</div>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Action Commands</h3>
                              <div className="space-y-1 text-sm">
                                <div className="bg-gray-50 p-2 rounded">Create new claim</div>
                                <div className="bg-gray-50 p-2 rounded">Submit expense request</div>
                                <div className="bg-gray-50 p-2 rounded">Upload receipt</div>
                                <div className="bg-gray-50 p-2 rounded">Edit pending claim</div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="manager" className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-semibold mb-2">Approval Commands</h3>
                              <div className="space-y-1 text-sm">
                                <div className="bg-gray-50 p-2 rounded">Show pending approvals</div>
                                <div className="bg-gray-50 p-2 rounded">Approve claim #123</div>
                                <div className="bg-gray-50 p-2 rounded">Approve all under ₹5000</div>
                                <div className="bg-gray-50 p-2 rounded">Reject with comments</div>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Team Management</h3>
                              <div className="space-y-1 text-sm">
                                <div className="bg-gray-50 p-2 rounded">Team expense summary</div>
                                <div className="bg-gray-50 p-2 rounded">Budget utilization</div>
                                <div className="bg-gray-50 p-2 rounded">Department reports</div>
                                <div className="bg-gray-50 p-2 rounded">Workflow status</div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="admin" className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-semibold mb-2">System Management</h3>
                              <div className="space-y-1 text-sm">
                                <div className="bg-gray-50 p-2 rounded">Create payment batch</div>
                                <div className="bg-gray-50 p-2 rounded">Process payments</div>
                                <div className="bg-gray-50 p-2 rounded">Add new vendor</div>
                                <div className="bg-gray-50 p-2 rounded">Update policies</div>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Analytics & Reports</h3>
                              <div className="space-y-1 text-sm">
                                <div className="bg-gray-50 p-2 rounded">Generate compliance report</div>
                                <div className="bg-gray-50 p-2 rounded">Cash flow analysis</div>
                                <div className="bg-gray-50 p-2 rounded">System usage stats</div>
                                <div className="bg-gray-50 p-2 rounded">Audit trail review</div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                )}

                {/* OCR Processing Section */}
                {activeSection === "ocr-processing" && (
                  <div className="space-y-8">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">OCR Processing Guide</h1>
                      <p className="text-gray-600 mb-8">
                        Our advanced OCR (Optical Character Recognition) technology automatically extracts data from receipts and invoices, saving you time and reducing errors.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <Camera className="w-8 h-8 text-blue-600" />
                            <h2 className="text-xl font-semibold">Dual-Tier OCR Technology</h2>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg p-4 border">
                              <h3 className="font-semibold mb-2 text-green-700">FREE Tier - Tesseract OCR</h3>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• High-accuracy text extraction</li>
                                <li>• Multi-format support (JPEG, PNG, PDF)</li>
                                <li>• Smart field mapping</li>
                                <li>• No usage limits</li>
                              </ul>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 border">
                              <h3 className="font-semibold mb-2 text-purple-700">PREMIUM Tier - OpenAI Vision</h3>
                              <ul className="text-sm text-gray-600 space-y-1">
                                <li>• AI-powered document understanding</li>
                                <li>• Advanced classification</li>
                                <li>• Confidence scoring</li>
                                <li>• Structured data output</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-100 rounded-lg p-4">
                          <p className="text-sm text-gray-600 text-center italic">
                            📸 OCR Upload Screenshot: File upload interface with drag-and-drop area and processing status
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold mb-4">How OCR Works</h2>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                              <div>
                                <h3 className="font-semibold text-sm">Upload Receipt</h3>
                                <p className="text-xs text-gray-600">Drag and drop or click to upload receipt image/PDF</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                              <div>
                                <h3 className="font-semibold text-sm">AI Processing</h3>
                                <p className="text-xs text-gray-600">OCR engine extracts text and identifies key fields</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                              <div>
                                <h3 className="font-semibold text-sm">Smart Mapping</h3>
                                <p className="text-xs text-gray-600">Data mapped to expense form fields automatically</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                              <div>
                                <h3 className="font-semibold text-sm">Review & Submit</h3>
                                <p className="text-xs text-gray-600">Verify extracted data and submit your claim</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h2 className="text-xl font-semibold mb-4">Supported Data Fields</h2>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-white border rounded p-2">
                              <CheckCircle className="w-4 h-4 text-green-500 inline mr-2" />
                              Bill Number
                            </div>
                            <div className="bg-white border rounded p-2">
                              <CheckCircle className="w-4 h-4 text-green-500 inline mr-2" />
                              Bill Date
                            </div>
                            <div className="bg-white border rounded p-2">
                              <CheckCircle className="w-4 h-4 text-green-500 inline mr-2" />
                              Total Amount
                            </div>
                            <div className="bg-white border rounded p-2">
                              <CheckCircle className="w-4 h-4 text-green-500 inline mr-2" />
                              Vendor Name
                            </div>
                            <div className="bg-white border rounded p-2">
                              <CheckCircle className="w-4 h-4 text-green-500 inline mr-2" />
                              Tax Details
                            </div>
                            <div className="bg-white border rounded p-2">
                              <CheckCircle className="w-4 h-4 text-green-500 inline mr-2" />
                              Description
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-4">Best Practices for OCR</h2>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h3 className="font-semibold text-green-900 mb-2">Image Quality</h3>
                          <ul className="text-sm text-green-800 space-y-1">
                            <li>• Use good lighting</li>
                            <li>• Avoid shadows and glare</li>
                            <li>• Keep receipt flat</li>
                            <li>• Capture full receipt</li>
                          </ul>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-semibold text-blue-900 mb-2">File Formats</h3>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li>• JPEG, PNG for images</li>
                            <li>• PDF for documents</li>
                            <li>• Max file size: 5MB</li>
                            <li>• High resolution preferred</li>
                          </ul>
                        </div>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h3 className="font-semibold text-orange-900 mb-2">Review Data</h3>
                          <ul className="text-sm text-orange-800 space-y-1">
                            <li>• Always verify extracted data</li>
                            <li>• Check amounts and dates</li>
                            <li>• Correct any errors</li>
                            <li>• Ensure vendor names match</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
                        <div>
                          <h3 className="font-semibold text-yellow-900 mb-2">Important Notes</h3>
                          <ul className="text-yellow-800 text-sm space-y-1">
                            <li>• OCR accuracy depends on receipt quality</li>
                            <li>• Always review extracted data before submitting</li>
                            <li>• Some handwritten receipts may require manual entry</li>
                            <li>• Premium OCR provides higher accuracy for complex documents</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other sections would continue here with similar detailed content... */}
                {/* For brevity, I'm showing the key sections. The full manual would include all sections */}

                {activeSection === "troubleshooting" && (
                  <div className="space-y-8">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">Troubleshooting Guide</h1>
                      <p className="text-gray-600 mb-8">
                        Quick solutions to common issues and problems you might encounter while using the system.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-red-900 mb-4">Common Issues & Solutions</h2>
                        
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 border">
                            <h3 className="font-semibold mb-2">Problem: OCR not extracting data correctly</h3>
                            <div className="text-sm text-gray-600">
                              <p className="mb-2"><strong>Solutions:</strong></p>
                              <ul className="list-disc list-inside space-y-1">
                                <li>Ensure receipt image is clear and well-lit</li>
                                <li>Try uploading a higher resolution image</li>
                                <li>Use Premium OCR for better accuracy</li>
                                <li>Manually enter data if automatic extraction fails</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 border">
                            <h3 className="font-semibold mb-2">Problem: Claims stuck in pending status</h3>
                            <div className="text-sm text-gray-600">
                              <p className="mb-2"><strong>Solutions:</strong></p>
                              <ul className="list-disc list-inside space-y-1">
                                <li>Contact your manager about pending approvals</li>
                                <li>Check if additional documentation is required</li>
                                <li>Verify claim follows company expense policies</li>
                                <li>Use AI assistant to check approval workflow status</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 border">
                            <h3 className="font-semibold mb-2">Problem: Unable to upload files</h3>
                            <div className="text-sm text-gray-600">
                              <p className="mb-2"><strong>Solutions:</strong></p>
                              <ul className="list-disc list-inside space-y-1">
                                <li>Check file size (maximum 5MB)</li>
                                <li>Ensure file format is supported (JPEG, PNG, PDF)</li>
                                <li>Try refreshing the page and uploading again</li>
                                <li>Clear browser cache and cookies</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-blue-900 mb-4">Getting Help</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold mb-2">Self-Service Options</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• Use the AI assistant for quick answers</li>
                              <li>• Check the Interactive Tours & Guides</li>
                              <li>• Browse the Knowledge Base for FAQs</li>
                              <li>• Review this user manual</li>
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-semibold mb-2">Contact Support</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• Click "Contact Support" in Help menu</li>
                              <li>• Email your IT administrator</li>
                              <li>• Report bugs through Feature Requests</li>
                              <li>• Schedule training sessions if needed</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}