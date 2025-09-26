import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Request() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    estimatedAmount: "",
    currency: "INR",
    startDate: "",
    endDate: "",
  });

  // Redirect to home if not authenticated
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

  const { data: requests = [], isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/expense-requests"],
    retry: false,
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/expense-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-requests"] });
      setShowRequestModal(false);
      setFormData({
        type: "",
        title: "",
        description: "",
        estimatedAmount: "",
        currency: "INR",
        startDate: "",
        endDate: "",
      });
      toast({
        title: "Success",
        description: "Request submitted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRequestMutation.mutate({
      ...formData,
      estimatedAmount: parseFloat(formData.estimatedAmount) || 0,
      startDate: formData.startDate ? new Date(formData.startDate) : undefined,
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">
                  Expense Requests
                </h1>
                <p className="text-gray-600" data-testid="text-page-description">
                  Submit requests for travel, cash advances, and pre-approvals
                </p>
              </div>
              <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-request">
                    <Plus className="h-4 w-4 mr-2" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>New Expense Request</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type">Request Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger data-testid="select-request-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="travel">Travel Request</SelectItem>
                            <SelectItem value="cash_advance">Cash Advance</SelectItem>
                            <SelectItem value="advance_payment">Advance Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => setFormData({ ...formData, currency: value })}
                        >
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter request title"
                        required
                        data-testid="input-request-title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter request description"
                        data-testid="textarea-request-description"
                      />
                    </div>

                    <div>
                      <Label htmlFor="estimatedAmount">Estimated Amount</Label>
                      <Input
                        id="estimatedAmount"
                        type="number"
                        step="0.01"
                        value={formData.estimatedAmount}
                        onChange={(e) => setFormData({ ...formData, estimatedAmount: e.target.value })}
                        placeholder="0.00"
                        data-testid="input-estimated-amount"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          data-testid="input-start-date"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          data-testid="input-end-date"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowRequestModal(false)}
                        data-testid="button-cancel-request"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createRequestMutation.isPending}
                        data-testid="button-submit-request"
                      >
                        {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="text-center py-8">Loading requests...</div>
              ) : Array.isArray(requests) && requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.map((request: any) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      data-testid={`request-item-${request.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {request.type === "travel" ? (
                            <Calendar className="h-5 w-5 text-blue-600" />
                          ) : (
                            <DollarSign className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900" data-testid={`text-request-title-${request.id}`}>
                            {request.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.type === "travel" ? "Travel Request" : "Cash Advance"} • 
                            {request.estimatedAmount && ` ${request.currency} ${request.estimatedAmount}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(request.createdAt).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)} data-testid={`status-${request.id}`}>
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500" data-testid="text-no-requests">No requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
