import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useState } from "react";
import { Plus, Edit, Trash2, ArrowLeft, Building2, Mail, Phone, MapPin, Search, Filter, Eye, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Vendor } from "@shared/schema";

export default function VendorList() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: allVendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  // Filter vendors on the frontend
  const vendors = allVendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Delete vendor mutation
  const deleteVendorMutation = useMutation({
    mutationFn: (vendorId: string) =>
      apiRequest(`/api/vendors/${vendorId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });

  const handleDeleteVendor = (vendorId: string, vendorName: string) => {
    if (window.confirm(`Are you sure you want to delete vendor "${vendorName}"? This action cannot be undone.`)) {
      deleteVendorMutation.mutate(vendorId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/configuration")}
              className="mb-4"
              data-testid="button-back-to-config"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Configuration
            </Button>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
              <div className="flex gap-2">
                <Link href="/vendors/add">
                  <Button data-testid="button-add-vendor">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vendor
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-vendors"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {vendors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Vendors Found</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first vendor to the system
                </p>
                <Link href="/vendors/add">
                  <Button data-testid="button-add-first-vendor">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Vendor
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold" data-testid={`text-vendor-name-${vendor.id}`}>
                            {vendor.name}
                          </h3>
                          <Badge variant={vendor.status === 'active' ? "default" : vendor.status === 'inactive' ? "secondary" : "outline"}>
                            {vendor.status}
                          </Badge>
                          {vendor.tdsCategory && (
                            <Badge variant="outline" className="capitalize">
                              TDS: {vendor.tdsCategory}
                            </Badge>
                          )}
                          {vendor.msmeStatus && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              MSME
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          {vendor.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span data-testid={`text-vendor-email-${vendor.id}`}>{vendor.email}</span>
                            </div>
                          )}
                          {vendor.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span data-testid={`text-vendor-phone-${vendor.id}`}>{vendor.phone}</span>
                            </div>
                          )}
                          {vendor.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate" data-testid={`text-vendor-address-${vendor.id}`}>
                                {vendor.address}
                              </span>
                            </div>
                          )}
                        </div>

                        {(vendor.pan || vendor.gstin || vendor.bankName) && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {vendor.pan && (
                              <div>
                                <span className="font-medium">PAN: </span>
                                <span data-testid={`text-vendor-pan-${vendor.id}`}>{vendor.pan}</span>
                              </div>
                            )}
                            {vendor.gstin && (
                              <div>
                                <span className="font-medium">GSTIN: </span>
                                <span data-testid={`text-vendor-gstin-${vendor.id}`}>{vendor.gstin}</span>
                              </div>
                            )}
                            {vendor.bankName && (
                              <div>
                                <span className="font-medium">Bank: </span>
                                <span data-testid={`text-vendor-bank-${vendor.id}`}>{vendor.bankName}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {vendor.contactPerson && (
                          <div className="text-sm">
                            <span className="font-medium">Contact Person: </span>
                            <span data-testid={`text-vendor-contact-${vendor.id}`}>{vendor.contactPerson}</span>
                          </div>
                        )}

                        {vendor.totalPaid && (
                          <div className="text-sm">
                            <span className="font-medium">Total Paid: </span>
                            <span className="text-green-600 font-semibold" data-testid={`text-vendor-total-paid-${vendor.id}`}>
                              ₹{parseFloat(vendor.totalPaid).toLocaleString()}
                            </span>
                            {vendor.lastPaymentDate && (
                              <span className="text-muted-foreground ml-2">
                                (Last: {new Date(vendor.lastPaymentDate).toLocaleDateString('en-GB')})
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setLocation(`/vendors/${vendor.id}`)}
                          data-testid={`button-view-vendor-${vendor.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setLocation(`/vendors/${vendor.id}/edit`)}
                          data-testid={`button-edit-vendor-${vendor.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/vendors/${vendor.id}/payment-summary`)}
                          data-testid={`button-payment-summary-${vendor.id}`}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                          disabled={deleteVendorMutation.isPending}
                          data-testid={`button-delete-vendor-${vendor.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}