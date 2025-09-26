import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Plus, Edit, Trash2, ArrowLeft, Building2, Mail, Phone, MapPin } from "lucide-react";
import type { Party } from "@shared/schema";

export default function PartyMasterList() {
  const [, setLocation] = useLocation();

  const { data: parties = [], isLoading } = useQuery<Party[]>({
    queryKey: ["/api/parties"],
  });

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
              <h1 className="text-2xl font-bold text-gray-900">Party Master</h1>
              <Link href="/party-master/add">
                <Button data-testid="button-add-party">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Party
                </Button>
              </Link>
            </div>
          </div>

          {parties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Parties Found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first party master record
            </p>
            <Link href="/party-master/add">
              <Button data-testid="button-add-first-party">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Party
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {parties.map((party) => (
            <Card key={party.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold" data-testid={`text-party-name-${party.id}`}>
                        {party.name}
                      </h3>
                      <Badge variant={party.isActive ? "default" : "secondary"}>
                        {party.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {party.partyType && (
                        <Badge variant="outline" className="capitalize">
                          {party.partyType}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      {party.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span data-testid={`text-party-email-${party.id}`}>{party.email}</span>
                        </div>
                      )}
                      {party.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span data-testid={`text-party-phone-${party.id}`}>{party.phone}</span>
                        </div>
                      )}
                      {party.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate" data-testid={`text-party-address-${party.id}`}>
                            {party.address}
                          </span>
                        </div>
                      )}
                    </div>

                    {(party.pan || party.gstNo || party.bankName) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {party.pan && (
                          <div>
                            <span className="font-medium">PAN: </span>
                            <span data-testid={`text-party-pan-${party.id}`}>{party.pan}</span>
                          </div>
                        )}
                        {party.gstNo && (
                          <div>
                            <span className="font-medium">GST: </span>
                            <span data-testid={`text-party-gst-${party.id}`}>{party.gstNo}</span>
                          </div>
                        )}
                        {party.bankName && (
                          <div>
                            <span className="font-medium">Bank: </span>
                            <span data-testid={`text-party-bank-${party.id}`}>{party.bankName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {party.keyContactPerson && (
                      <div className="text-sm">
                        <span className="font-medium">Contact Person: </span>
                        <span data-testid={`text-party-contact-${party.id}`}>{party.keyContactPerson}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" data-testid={`button-edit-party-${party.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" data-testid={`button-delete-party-${party.id}`}>
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