import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Receipt, Calendar, CreditCard, FileText, CheckCircle, XCircle, Clock, Paperclip, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

type ExpenseClaimDetails = {
  id: string;
  title: string;
  description?: string;
  totalAmount: number;
  status: string;
  submittedAt?: string;
  createdAt: string;
  approvedAt?: string;
  // Azure Blob attachments
  attachmentUrls?: string[];
  attachmentCount?: number;
  // Employee profile data from external API
  employerName?: string;
  employeeNumber?: string;
  employeeEmail?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  items?: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    receiptUrl?: string;
    billNo?: string;
    billDate?: string;
    billAmount?: number;
  }>;
};

export default function ExpenseClaimView() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const { data: claim, isLoading } = useQuery<ExpenseClaimDetails>({
    queryKey: ["/api/expense-claims", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="text-center py-8">Loading expense claim details...</div>
          </main>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="text-center py-8">
              <p className="text-red-500">Expense claim not found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/dashboard/expense-claims')}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "paid":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/dashboard/expense-claims')}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="text-claim-title">
                  {claim.title}
                </h1>
              </div>
              <Badge className={getStatusColor(claim.status)} data-testid="status-badge">
                <span className="flex items-center gap-1">
                  {getStatusIcon(claim.status)}
                  {claim.status}
                </span>
              </Badge>
            </div>

            {/* Claim Summary */}
            <Card data-testid="card-claim-summary">
              <CardHeader>
                <CardTitle>Claim Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-lg font-semibold text-gray-900" data-testid="text-total-amount">
                      ₹{claim.totalAmount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Submitted Date</p>
                    <p className="text-sm text-gray-900" data-testid="text-submitted-date">
                      {formatDate(claim.submittedAt || claim.createdAt)}
                    </p>
                  </div>
                  {claim.approvedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Approved Date</p>
                      <p className="text-sm text-gray-900" data-testid="text-approved-date">
                        {formatDate(claim.approvedAt)}
                      </p>
                    </div>
                  )}
                  {claim.user && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Submitted By</p>
                      <p className="text-sm text-gray-900" data-testid="text-submitted-by">
                        {claim.employerName || (claim.user ? `${claim.user.firstName} ${claim.user.lastName}` : 'Unknown User')}
                      </p>
                      {claim.employeeNumber && (
                        <p className="text-xs text-gray-500" data-testid="text-employee-number">
                          Employee #: {claim.employeeNumber}
                        </p>
                      )}
                      {claim.employeeEmail && (
                        <p className="text-xs text-gray-500" data-testid="text-employee-email">
                          {claim.employeeEmail}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {claim.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-sm text-gray-900" data-testid="text-description">
                      {claim.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Azure Blob File Attachments */}
            {claim.attachmentUrls && claim.attachmentUrls.length > 0 && (
              <Card data-testid="card-azure-attachments">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Paperclip className="h-5 w-5 mr-2" />
                    File Attachments ({claim.attachmentCount || claim.attachmentUrls.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {claim.attachmentUrls.map((url, index) => {
                      // Extract filename from URL
                      const filename = url.split('/').pop() || `attachment_${index + 1}`;
                      const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                      const isPDF = fileExtension === 'pdf';
                      
                      return (
                        <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {isImage ? (
                                <Receipt className="h-8 w-8 text-blue-500" />
                              ) : isPDF ? (
                                <FileText className="h-8 w-8 text-red-500" />
                              ) : (
                                <Paperclip className="h-8 w-8 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate" title={filename}>
                                {filename}
                              </p>
                              <p className="text-xs text-gray-500 uppercase">
                                {fileExtension || 'file'}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(url, '_blank')}
                              data-testid={`button-view-attachment-${index}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expense Items */}
            <Card data-testid="card-expense-items">
              <CardHeader>
                <CardTitle>Expense Items</CardTitle>
              </CardHeader>
              <CardContent>
                {claim.items && claim.items.length > 0 ? (
                  <div className="space-y-4">
                    {claim.items.map((item: any, index: number) => (
                      <div key={item.id || index} className="border rounded-lg p-4" data-testid={`item-${index}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Description</p>
                            <p className="text-sm text-gray-900" data-testid={`text-item-description-${index}`}>
                              {item.description}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Amount</p>
                            <p className="text-sm font-semibold text-gray-900" data-testid={`text-item-amount-${index}`}>
                              ₹{item.amount}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Date</p>
                            <p className="text-sm text-gray-900" data-testid={`text-item-date-${index}`}>
                              {formatDate(item.date)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Bill Information */}
                        {(item.billNo || item.billDate || item.billAmount) && (
                          <>
                            <Separator className="my-3" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <h4 className="text-sm font-medium text-gray-700 flex items-center col-span-full">
                                <FileText className="h-4 w-4 mr-2" />
                                Bill Information
                              </h4>
                              {item.billNo && (
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Bill No</p>
                                  <p className="text-sm text-gray-900" data-testid={`text-item-bill-no-${index}`}>
                                    {item.billNo}
                                  </p>
                                </div>
                              )}
                              {item.billDate && (
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Bill Date</p>
                                  <p className="text-sm text-gray-900" data-testid={`text-item-bill-date-${index}`}>
                                    {formatDate(item.billDate)}
                                  </p>
                                </div>
                              )}
                              {item.billAmount && (
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Bill Amount</p>
                                  <p className="text-sm text-gray-900" data-testid={`text-item-bill-amount-${index}`}>
                                    ₹{item.billAmount}
                                  </p>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                        
                        {/* Receipt */}
                        {item.receiptUrl && (
                          <>
                            <Separator className="my-3" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 flex items-center mb-2">
                                <Receipt className="h-4 w-4 mr-2" />
                                Receipt
                              </h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(item.receiptUrl, '_blank')}
                                data-testid={`button-view-receipt-${index}`}
                              >
                                <Receipt className="h-4 w-4 mr-2" />
                                View Receipt
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4" data-testid="text-no-items">
                    No expense items found
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}