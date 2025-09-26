import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { ArrowLeft, Edit, Building2, Mail, Phone, MapPin, FileText, CreditCard, Banknote, History } from "lucide-react";
import type { Vendor } from "@shared/schema";

export default function VendorView() {
  const [, params] = useRoute("/vendors/:id");
  const [, setLocation] = useLocation();
  const vendorId = params?.id;

  const { data: vendor, isLoading } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${vendorId}`],
    enabled: !!vendorId,
  });

  const { data: paymentSummary } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/payment-summary`],
    enabled: !!vendorId,
  });

  const { data: claimsAndInvoices } = useQuery({
    queryKey: [`/api/vendors/${vendorId}/claims-and-invoices`],
    enabled: !!vendorId,
  });

  const { data: paymentHistory } = useQuery({
    queryKey: [`/api/vendor-payment-history`, { vendorId }],
    enabled: !!vendorId,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Vendor not found</h2>
              <Button onClick={() => setLocation("/vendors")}>Back to Vendors</Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-60">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/vendors")}
              className="mb-4"
              data-testid="button-back-to-vendors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vendors
            </Button>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="text-vendor-name">
                  {vendor.name}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={vendor.status === 'active' ? "default" : vendor.status === 'inactive' ? "secondary" : "outline"}>
                    {vendor.status}
                  </Badge>
                  {vendor.tdsCategory && (
                    <Badge variant="outline">TDS: {vendor.tdsCategory}</Badge>
                  )}
                  {vendor.msmeStatus && vendor.msmeStatus !== 'not_applicable' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      MSME: {vendor.msmeStatus}
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                onClick={() => setLocation(`/vendors/${vendor.id}/edit`)}
                data-testid="button-edit-vendor"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Vendor
              </Button>
            </div>
          </div>

          <Tabs defaultValue="details" className="space-y-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="payments">Payment Summary</TabsTrigger>
              <TabsTrigger value="transactions">Claims & Invoices</TabsTrigger>
              <TabsTrigger value="history">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium">Vendor Name</p>
                      <p className="text-muted-foreground" data-testid="text-vendor-name-detail">{vendor.name}</p>
                    </div>
                    {vendor.contactPerson && (
                      <div>
                        <p className="font-medium">Contact Person</p>
                        <p className="text-muted-foreground" data-testid="text-contact-person">{vendor.contactPerson}</p>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-muted-foreground" data-testid="text-email">{vendor.email}</p>
                        </div>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Phone</p>
                          <p className="text-muted-foreground" data-testid="text-phone">{vendor.phone}</p>
                        </div>
                      </div>
                    )}
                    {vendor.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">Address</p>
                          <p className="text-muted-foreground" data-testid="text-address">{vendor.address}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Tax & Legal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vendor.pan && (
                      <div>
                        <p className="font-medium">PAN Number</p>
                        <p className="text-muted-foreground" data-testid="text-pan">{vendor.pan}</p>
                      </div>
                    )}
                    {vendor.gstin && (
                      <div>
                        <p className="font-medium">GSTIN</p>
                        <p className="text-muted-foreground" data-testid="text-gstin">{vendor.gstin}</p>
                      </div>
                    )}
                    {vendor.tdsCategory && (
                      <div>
                        <p className="font-medium">TDS Category</p>
                        <p className="text-muted-foreground capitalize" data-testid="text-tds-category">{vendor.tdsCategory}</p>
                      </div>
                    )}
                    {vendor.msmeStatus && (
                      <div>
                        <p className="font-medium">MSME Status</p>
                        <p className="text-muted-foreground capitalize" data-testid="text-msme-status">
                          {vendor.msmeStatus.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                    {vendor.msmeNumber && (
                      <div>
                        <p className="font-medium">MSME Registration Number</p>
                        <p className="text-muted-foreground" data-testid="text-msme-number">{vendor.msmeNumber}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Bank Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vendor.bankName && (
                      <div>
                        <p className="font-medium">Bank Name</p>
                        <p className="text-muted-foreground" data-testid="text-bank-name">{vendor.bankName}</p>
                      </div>
                    )}
                    {vendor.bankBranch && (
                      <div>
                        <p className="font-medium">Branch</p>
                        <p className="text-muted-foreground" data-testid="text-bank-branch">{vendor.bankBranch}</p>
                      </div>
                    )}
                    {vendor.accountNumber && (
                      <div>
                        <p className="font-medium">Account Number</p>
                        <p className="text-muted-foreground" data-testid="text-account-number">{vendor.accountNumber}</p>
                      </div>
                    )}
                    {vendor.ifscCode && (
                      <div>
                        <p className="font-medium">IFSC Code</p>
                        <p className="text-muted-foreground" data-testid="text-ifsc-code">{vendor.ifscCode}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {(vendor.totalPaid || vendor.lastPaymentDate) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Banknote className="h-5 w-5" />
                        Payment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {vendor.totalPaid && (
                        <div>
                          <p className="font-medium">Total Paid</p>
                          <p className="text-2xl font-bold text-green-600" data-testid="text-total-paid">
                            ₹{parseFloat(vendor.totalPaid).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {vendor.lastPaymentDate && (
                        <div>
                          <p className="font-medium">Last Payment Date</p>
                          <p className="text-muted-foreground" data-testid="text-last-payment-date">
                            {new Date(vendor.lastPaymentDate).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentSummary ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{paymentSummary.totalPaid.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Pending Payments</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ₹{paymentSummary.pendingPayments.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Last Payment</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {paymentSummary.lastPaymentDate 
                            ? new Date(paymentSummary.lastPaymentDate).toLocaleDateString('en-GB')
                            : "No payments"
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Loading payment summary...</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <div className="space-y-6">
                {claimsAndInvoices?.claims && claimsAndInvoices.claims.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Expense Claims</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {claimsAndInvoices.claims.map((claim: any) => (
                          <div key={claim.id} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <p className="font-medium">{claim.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(claim.createdAt).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{parseFloat(claim.totalAmount).toLocaleString()}</p>
                              <Badge variant={claim.status === 'approved' ? "default" : "secondary"}>
                                {claim.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {claimsAndInvoices?.directExpenses && claimsAndInvoices.directExpenses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Direct Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {claimsAndInvoices.directExpenses.map((expense: any) => (
                          <div key={expense.id} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(expense.date).toLocaleDateString('en-GB')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{parseFloat(expense.amount).toLocaleString()}</p>
                              <Badge variant={expense.status === 'approved' ? "default" : "secondary"}>
                                {expense.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentHistory && paymentHistory.length > 0 ? (
                    <div className="space-y-2">
                      {paymentHistory.map((payment: any) => (
                        <div key={payment.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <p className="font-medium">{payment.paymentMethod}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
                            </p>
                            {payment.notes && (
                              <p className="text-sm text-muted-foreground">{payment.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{parseFloat(payment.amount).toLocaleString()}</p>
                            <Badge variant="default">{payment.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No payment history available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}