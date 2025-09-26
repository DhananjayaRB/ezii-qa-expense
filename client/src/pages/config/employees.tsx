import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployees } from "@/hooks/useEmployees";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Users, Search, RefreshCw, ChevronLeft, User, Mail, Phone, Building, MapPin, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function Employees() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: employees, isLoading, refetch, error } = useEmployees();

  // Extract employee list from API response structure
  const employeeList = employees?.data?.data || [];

  const filteredEmployees = employeeList.filter((employee: any) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (employee.user_name && employee.user_name.toLowerCase().includes(searchLower)) ||
      (employee.employee_number && employee.employee_number.toLowerCase().includes(searchLower)) ||
      (employee.email && employee.email.toLowerCase().includes(searchLower)) ||
      (employee.type_id_1 && employee.type_id_1.toLowerCase().includes(searchLower)) ||
      (employee.designation_name && employee.designation_name.toLowerCase().includes(searchLower))
    );
  });

  const handleRefresh = () => {
    refetch();
  };

  const getStatusBadge = (status: string | boolean) => {
    if (status === true || status === "active" || status === "Active") {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else if (status === false || status === "inactive" || status === "Inactive") {
      return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">{status || 'Unknown'}</Badge>;
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setLocation('/configuration')}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                  data-testid="button-back"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Configuration
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Users className="w-7 h-7 mr-3 text-blue-600" />
                    Employees
                  </h1>
                  <p className="text-gray-600">Manage employee master data</p>
                </div>
              </div>
              <Button 
                onClick={handleRefresh} 
                disabled={isLoading}
                className="flex items-center"
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Search and Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search employees by name, code, email, department, or designation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-employees"
                    />
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Total: {filteredEmployees.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Employee Directory
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                    <span className="text-gray-600">Loading employees...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-red-600 mb-4">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      Failed to load employees
                    </div>
                    <p className="text-gray-600 text-sm mb-4">
                      Unable to fetch employee data from the server.
                    </p>
                    <Button onClick={handleRefresh} variant="outline" data-testid="button-retry">
                      Try Again
                    </Button>
                  </div>
                ) : !employees || employeeList.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600">No employees found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Designation</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployees.map((employee: any, index: number) => (
                          <TableRow key={employee.user_id || index} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                {employee.employee_number || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-gray-900">
                                {employee.user_name || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                {employee.email || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                {employee.Mobile_number_1 || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Building className="w-4 h-4 mr-2 text-gray-400" />
                                {employee.type_id_1 || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>{employee.designation_name || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                {employee.type_id_0 || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                {employee.date_of_joining || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {employee.last_working_day ? 
                                <Badge className="bg-red-100 text-red-800">Inactive</Badge> : 
                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}