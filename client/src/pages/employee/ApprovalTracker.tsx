import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  User, 
  MessageSquare, 
  Calendar,
  ArrowRight,
  FileText
} from "lucide-react";
import { ExpenseClaim, ApprovalHistory, User as UserType } from "@shared/schema";

interface ClaimWithDetails extends ExpenseClaim {
  user: UserType;
  items: any[];
}

interface ApprovalWithApprover extends ApprovalHistory {
  approver: UserType;
}

export default function ApprovalTracker() {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Get user's expense claims
  const { data: claims, isLoading } = useQuery<ClaimWithDetails[]>({
    queryKey: ["/api/expense-claims"],
  });

  // Get approval history for selected claim
  const { data: approvalHistory } = useQuery<ApprovalWithApprover[]>({
    queryKey: ["/api/expense-claims", selectedClaimId, "approval-history"],
    enabled: !!selectedClaimId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending_manager': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pending_admin': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'pending_head': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'pending_accountant': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'paid': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getApprovalLevelName = (level: string) => {
    const levels = {
      'manager': 'Manager',
      'admin': 'Admin',
      'head': 'Head',
      'accountant': 'Accountant'
    };
    return levels[level as keyof typeof levels] || level;
  };

  const getWorkflowSteps = () => {
    return [
      { key: 'manager', name: 'Manager', status: 'submitted' },
      { key: 'admin', name: 'Admin', status: 'pending_manager' },
      { key: 'head', name: 'Head', status: 'pending_admin' },
      { key: 'accountant', name: 'Accountant', status: 'pending_head' },
      { key: 'completed', name: 'Completed', status: 'approved' }
    ];
  };

  const getCurrentStepIndex = (status: string) => {
    const steps = getWorkflowSteps();
    const statusMap = {
      'submitted': 0,
      'pending_manager': 0,
      'pending_admin': 1,
      'pending_head': 2,
      'pending_accountant': 3,
      'approved': 4,
      'paid': 4,
      'rejected': -1
    };
    return statusMap[status as keyof typeof statusMap] || 0;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6" data-testid="loading-spinner">
        <h1 className="text-3xl font-bold mb-6">Approval Tracker</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const selectedClaim = claims?.find(claim => claim.id === selectedClaimId);

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="approval-tracker">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Approval Tracker</h1>
        <Badge variant="outline" className="text-sm">
          Track your expense claim journey
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claims List */}
        <div className="lg:col-span-1" data-testid="claims-list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                My Claims
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!claims || claims.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No expense claims found
                </p>
              ) : (
                claims.map((claim) => (
                  <Card 
                    key={claim.id} 
                    className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedClaimId === claim.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedClaimId(claim.id)}
                    data-testid={`claim-card-${claim.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium text-sm">{claim.title}</h3>
                          <p className="text-xs text-gray-600">
                            ₹{parseFloat(claim.totalAmount).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${getStatusColor(claim.status)}`}>
                            {getStatusIcon(claim.status)}
                            <span className="ml-1">{claim.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Approval Details */}
        <div className="lg:col-span-2">
          {selectedClaim ? (
            <div className="space-y-6" data-testid="approval-details">
              {/* Claim Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedClaim.title}</span>
                    <Badge className={`${getStatusColor(selectedClaim.status)}`}>
                      {getStatusIcon(selectedClaim.status)}
                      <span className="ml-1">{selectedClaim.status.replace('_', ' ')}</span>
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <p className="font-medium">₹{parseFloat(selectedClaim.totalAmount).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Submitted:</span>
                      <p className="font-medium">
                        {new Date(selectedClaim.submittedAt).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Level:</span>
                      <p className="font-medium">
                        {getApprovalLevelName(selectedClaim.currentApprovalLevel || 'manager')}
                      </p>
                    </div>
                    {selectedClaim.pendingWith && (
                      <div>
                        <span className="text-gray-600">Pending With:</span>
                        <p className="font-medium flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Processing...
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Progress Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle>Approval Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between" data-testid="progress-tracker">
                    {getWorkflowSteps().map((step, index) => {
                      const currentStep = getCurrentStepIndex(selectedClaim.status);
                      const isCompleted = currentStep > index;
                      const isCurrent = currentStep === index;
                      const isRejected = selectedClaim.status === 'rejected';

                      return (
                        <div key={step.key} className="flex items-center">
                          <div className={`flex flex-col items-center ${
                            index < getWorkflowSteps().length - 1 ? 'flex-1' : ''
                          }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              isRejected ? 'bg-red-100 text-red-800' :
                              isCompleted ? 'bg-green-100 text-green-800' :
                              isCurrent ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : isCurrent ? (
                                <Clock className="w-4 h-4" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <span className="text-xs mt-1 text-center">{step.name}</span>
                          </div>
                          {index < getWorkflowSteps().length - 1 && (
                            <ArrowRight className={`w-4 h-4 mx-2 ${
                              isCompleted || (isCurrent && index < currentStep) 
                                ? 'text-green-500' 
                                : 'text-gray-300'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Approval History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Approval History & Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!approvalHistory || approvalHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4" data-testid="no-history">
                      No approval history yet
                    </p>
                  ) : (
                    <div className="space-y-4" data-testid="approval-history">
                      {approvalHistory.map((approval, index) => (
                        <div key={approval.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {getApprovalLevelName(approval.approverRole)}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {approval.approverName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Calendar className="w-3 h-3" />
                                {new Date(approval.processedAt).toLocaleString('en-GB')}
                              </div>
                              <p className={`text-sm font-medium capitalize ${
                                approval.action === 'approve' ? 'text-green-600' :
                                approval.action === 'reject' ? 'text-red-600' :
                                'text-orange-600'
                              }`}>
                                {approval.action}d
                              </p>
                              {approval.remarks && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-600">Comments:</p>
                                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    {approval.remarks}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          {index < approvalHistory.length - 1 && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-96 flex items-center justify-center" data-testid="no-claim-selected">
              <CardContent>
                <div className="text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a claim to view approval details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}