import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Send, User, FileText, Building2, CheckCircle } from "lucide-react";

const stepIcons = [
  { icon: User, label: "Basic Info" },
  { icon: FileText, label: "Tax & Legal" },
  { icon: Building2, label: "Bank Details" },
  { icon: CheckCircle, label: "Review & Submit" },
];

export default function VendorOnboardingRequest() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for vendor onboarding request
  const [formData, setFormData] = useState({
    vendorName: "",
    address: "",
    contactPerson: "",
    phone: "", 
    email: "",
    accountNumber: "",
    ifscCode: "", 
    bankName: "",
    bankBranch: "",
    gstin: "",
    pan: "",
    tdsCategory: "individual",
    msmeStatus: "not_applicable", 
    msmeNumber: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/vendor-onboarding-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Request Submitted Successfully",
          description: "Your vendor onboarding request has been sent for approval",
        });
        setLocation("/dashboard");
      } else {
        const error = await response.json();
        toast({
          title: "Error", 
          description: error.message || "Failed to submit request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit vendor onboarding request", 
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < stepIcons.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor Name *</label>
                <Input 
                  placeholder="Enter Vendor Name" 
                  value={formData.vendorName}
                  onChange={(e) => handleInputChange('vendorName', e.target.value)}
                  data-testid="input-vendor-name" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person *</label>
                <Input 
                  placeholder="Contact Person Name" 
                  value={formData.contactPerson}
                  onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                  data-testid="input-contact-person" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input 
                  type="email" 
                  placeholder="Enter Email" 
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  data-testid="input-email" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone *</label>
                <Input 
                  placeholder="Enter Phone Number" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  data-testid="input-phone" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Address *</label>
                <Textarea 
                  placeholder="Enter complete address" 
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  data-testid="input-address"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tax & Legal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">PAN Number *</label>
                <Input 
                  placeholder="Enter PAN Number" 
                  value={formData.pan}
                  onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                  data-testid="input-pan" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">GSTIN</label>
                <Input 
                  placeholder="Enter GSTIN (if available)" 
                  value={formData.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value)}
                  data-testid="input-gstin" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">TDS Category</label>
                <Select value={formData.tdsCategory} onValueChange={(value) => handleInputChange('tdsCategory', value)}>
                  <SelectTrigger data-testid="select-tds-category">
                    <SelectValue placeholder="Select TDS Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="professional">Professional Services</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="royalty">Royalty</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">MSME Status</label>
                <Select value={formData.msmeStatus} onValueChange={(value) => handleInputChange('msmeStatus', value)}>
                  <SelectTrigger data-testid="select-msme-status">
                    <SelectValue placeholder="Select MSME Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="micro">Micro Enterprise</SelectItem>
                    <SelectItem value="small">Small Enterprise</SelectItem>
                    <SelectItem value="medium">Medium Enterprise</SelectItem>
                    <SelectItem value="not_applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">MSME Registration Number</label>
                <Input 
                  placeholder="Enter MSME Number (if applicable)" 
                  value={formData.msmeNumber}
                  onChange={(e) => handleInputChange('msmeNumber', e.target.value)}
                  data-testid="input-msme-number" 
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Banking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Bank Name *</label>
                <Input 
                  placeholder="Enter Bank Name" 
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  data-testid="input-bank-name" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Branch *</label>
                <Input 
                  placeholder="Enter Branch Name" 
                  value={formData.bankBranch}
                  onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                  data-testid="input-bank-branch" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Account Number *</label>
                <Input 
                  placeholder="Enter Account Number" 
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  data-testid="input-account-number" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">IFSC Code *</label>
                <Input 
                  placeholder="Enter IFSC Code" 
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                  data-testid="input-ifsc" 
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review & Submit</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                📋 <strong>What happens next:</strong><br/>
                1. Your request will be sent to Admin for initial review<br/>
                2. Once admin approves, it goes to Finance for final approval<br/>
                3. After both approvals, the vendor will be created in the system<br/>
                4. You'll be notified at each step
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor Name</label>
                <p className="text-sm text-gray-600">{formData.vendorName || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person</label>
                <p className="text-sm text-gray-600">{formData.contactPerson || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm text-gray-600">{formData.email || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <p className="text-sm text-gray-600">{formData.phone || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PAN</label>
                <p className="text-sm text-gray-600">{formData.pan || "Not provided"}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bank Name</label>
                <p className="text-sm text-gray-600">{formData.bankName || "Not provided"}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/dashboard")}
              className="mb-4"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Request New Vendor</h1>
            <p className="text-gray-600 mt-1">Submit a vendor onboarding request for approval</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Vendor Onboarding Request</CardTitle>
                <div className="flex items-center space-x-2">
                  {stepIcons.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                          index === currentStep
                            ? "bg-blue-100 text-blue-700"
                            : index < currentStep
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {renderStepContent()}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    data-testid="button-prev-step"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  {currentStep === stepIcons.length - 1 ? (
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                      data-testid="button-submit-request"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? (
                        <>Submitting...</>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                      data-testid="button-next-step"
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}