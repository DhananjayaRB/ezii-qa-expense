import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Plus, Search, FileText, DollarSign, Calendar, Building2, Filter } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Contract } from "@shared/schema";

export default function ContractMaster() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch contracts
  const { data: contracts = [], isLoading, error } = useQuery<(Contract & { vendor: { name: string } })[]>({
    queryKey: ["/api/contracts"],
  });

  // Filter contracts based on search term and status
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.expenseType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case "rent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "lease":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "subscription_fee":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly";
      case "annually":
        return "Annually";
      default:
        return frequency;
    }
  };

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-8">
            <div className="text-center">
              <p className="text-red-600">Error loading contracts. Please try again.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contract Master</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage vendor contracts, agreements, and recurring expenses
              </p>
            </div>
            <Link href="/contracts/add">
              <Button className="flex items-center gap-2" data-testid="button-add-contract">
                <Plus className="w-4 h-4" />
                Add Contract
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contracts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-contracts">
                      {contracts.length}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Contracts</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-active-contracts">
                      {contracts.filter(c => c.status === "active").length}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Value</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-monthly-value">
                      {formatCurrency(
                        contracts
                          .filter(c => c.frequency === "monthly" && c.status === "active")
                          .reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0)
                      )}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Soon</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-expiring-soon">
                      {contracts.filter(c => {
                        if (!c.agreementEndDate || c.status !== "active") return false;
                        const endDate = new Date(c.agreementEndDate);
                        const thirtyDaysFromNow = new Date();
                        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                        return endDate <= thirtyDaysFromNow;
                      }).length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search contracts by title, vendor, or expense type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-contracts"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                  data-testid="select-status-filter"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Contracts List */}
          <Card>
            <CardHeader>
              <CardTitle>Contracts ({filteredContracts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">Loading contracts...</p>
                </div>
              ) : filteredContracts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm || statusFilter !== "all" ? "No contracts match your filters" : "No contracts found"}
                  </p>
                  <Link href="/contracts/add">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Contract
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Contract</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Vendor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Frequency</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Dates</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.map((contract) => (
                        <tr 
                          key={contract.id} 
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                          data-testid={`row-contract-${contract.id}`}
                        >
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white" data-testid={`text-contract-title-${contract.id}`}>
                                {contract.title}
                              </p>
                              {contract.agreementReference && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Ref: {contract.agreementReference}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-gray-900 dark:text-white" data-testid={`text-vendor-${contract.id}`}>
                              {contract.vendorName}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={getExpenseTypeColor(contract.expenseType)} data-testid={`badge-expense-type-${contract.id}`}>
                              {contract.expenseType.replace("_", " ").toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-gray-900 dark:text-white" data-testid={`text-amount-${contract.id}`}>
                              {formatCurrency(parseFloat(contract.amount || "0"))}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-gray-900 dark:text-white" data-testid={`text-frequency-${contract.id}`}>
                              {getFrequencyText(contract.frequency)}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              <p className="text-gray-900 dark:text-white">
                                Start: {formatDate(contract.agreementStartDate)}
                              </p>
                              {contract.agreementEndDate && (
                                <p className="text-gray-600 dark:text-gray-400">
                                  End: {formatDate(contract.agreementEndDate)}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={getStatusColor(contract.status)} data-testid={`badge-status-${contract.id}`}>
                              {contract.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Link href={`/contracts/${contract.id}`}>
                                <Button variant="outline" size="sm" data-testid={`button-view-${contract.id}`}>
                                  View
                                </Button>
                              </Link>
                              <Link href={`/contracts/${contract.id}/edit`}>
                                <Button variant="outline" size="sm" data-testid={`button-edit-${contract.id}`}>
                                  Edit
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}