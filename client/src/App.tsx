import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard/index";
import Claim from "@/pages/employee/claim";
import Request from "@/pages/employee/request";
import Uploads from "@/pages/employee/uploads";
import ApprovalTracker from "@/pages/employee/ApprovalTracker";
import ApprovalDashboard from "@/pages/ApprovalDashboard";
import ApprovedPayments from "@/pages/ApprovedPayments";
import PaymentProcessing from "@/pages/PaymentProcessing";
import DirectExpenses from "@/pages/direct-expenses";
import Payments from "@/pages/accountant/payments";
import Receipts from "@/pages/accountant/receipts";
import Reports from "@/pages/reports";
import UserReports from "@/pages/user-reports";
import Configuration from "@/pages/configuration";
import Admin from "@/pages/admin";
import Workflow from "@/pages/workflow";
import InitiatePayments from "@/pages/accountant/payments/initiate";
import ProcessPayments from "@/pages/accountant/payments/process";
import ReleaseBills from "@/pages/accountant/payments/release-bills";
import CardStatement from "@/pages/accountant/payments/card-stmt";
import CardPayments from "@/pages/accountant/payments/card-payments";
import EmpBankAdvice from "@/pages/accountant/payments/emp-bank-advice";
import VendorBankAdvice from "@/pages/accountant/payments/vendor-bank-advice";
import ReceiptsPage from "@/pages/accountant/receipts/receipts";
import FundTransfer from "@/pages/accountant/receipts/fund-transfer";
import PettyCashIndex from "@/pages/petty-cash/index";
import NewCashbox from "@/pages/petty-cash/cashboxes/new";
import AddCashbox from "@/pages/cashbox/add";
import PartyMasterList from "@/pages/party-master/index";
import AddPartyMaster from "@/pages/party-master/add";
import VendorList from "@/pages/vendors/index";
import AddVendor from "@/pages/vendors/add";
import EditVendor from "@/pages/vendors/edit";
import VendorClaim from "@/pages/vendors/claim";
import VendorOnboardingRequest from "@/pages/vendor-onboarding/request";
import VendorView from "@/pages/vendors/view";
import ContractMaster from "@/pages/contracts/index";
import AddContract from "@/pages/contracts/add";
import VendorReports from "@/pages/vendor-reports";
import VendorClaims from "@/pages/vendor-claims";
import Employees from "@/pages/config/employees";
import ExpenseGroups from "@/pages/config/expense-groups";
import ExpenseHeads from "@/pages/config/expense-heads";
import ExpensePolicy from "@/pages/config/expense-policy";
import TdsMasterConfig from "@/pages/config/tds-master";
import BillMasterConfig from "@/pages/config/bill-master";
import WorkflowConfig from "@/pages/config/workflow";
import AccessRights from "@/pages/config/access-rights";
import ReportBuilderPage from "@/pages/config/report-builder";
import CustomReportsPage from "@/pages/reports/custom";
import TokenHandler from "@/pages/TokenHandler";
import CostCenter from "@/pages/configuration/cost-center";
import { useAuth } from "@/hooks/useAuth";
import { AgentButton } from "@/components/agent/AgentButton";
import { PageLoading } from "@/components/ui/loading";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show beautiful loading screen during authentication
  if (isLoading) {
    return <PageLoading text="Loading your workspace..." />;
  }

  return (
    <Switch>
      <Route path="/id/:token" component={TokenHandler} />
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/:rest*" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/employee/claim" component={Claim} />
          <Route path="/employee/request" component={Request} />
          <Route path="/employee/uploads" component={Uploads} />
          <Route path="/employee/approval-tracker" component={ApprovalTracker} />
          <Route path="/approvals" component={ApprovalDashboard} />
          <Route path="/approved-payments" component={ApprovedPayments} />
          <Route path="/direct-expenses" component={DirectExpenses} />
          <Route path="/accountant/payments/initiate" component={InitiatePayments} />
          <Route path="/accountant/payments/process" component={ProcessPayments} />
          <Route path="/accountant/payments/release-bills" component={ReleaseBills} />
          <Route path="/accountant/payments/card-stmt" component={CardStatement} />
          <Route path="/accountant/payments/card-payments" component={CardPayments} />
          <Route path="/accountant/payments/emp-bank-advice" component={EmpBankAdvice} />
          <Route path="/accountant/payments/vendor-bank-advice" component={VendorBankAdvice} />
          <Route path="/accountant/receipts/receipts" component={ReceiptsPage} />
          <Route path="/accountant/receipts/fund-transfer" component={FundTransfer} />
          <Route path="/accountant/payments" component={Payments} />
          <Route path="/accountant/receipts" component={Receipts} />
          <Route path="/petty-cash" component={PettyCashIndex} />
          <Route path="/petty-cash/cashboxes/new" component={NewCashbox} />
          <Route path="/cashbox/add" component={AddCashbox} />
          <Route path="/party-master" component={PartyMasterList} />
          <Route path="/party-master/add" component={AddPartyMaster} />
          <Route path="/vendors" component={VendorList} />
          <Route path="/vendors/add" component={AddVendor} />
          <Route path="/vendors/claim" component={VendorClaim} />
          <Route path="/vendors/:id/edit" component={EditVendor} />
          <Route path="/vendors/:id" component={VendorView} />
          <Route path="/vendor-onboarding/request" component={VendorOnboardingRequest} />
          <Route path="/vendor-reports" component={VendorReports} />
          <Route path="/vendor-claims" component={VendorClaims} />
          <Route path="/contracts/add" component={AddContract} />
          <Route path="/contracts" component={ContractMaster} />
          <Route path="/config/employees" component={Employees} />
          <Route path="/config/expense-groups" component={ExpenseGroups} />
          <Route path="/config/expense-heads" component={ExpenseHeads} />
          <Route path="/config/expense-policy" component={ExpensePolicy} />
          <Route path="/config/tds-master" component={TdsMasterConfig} />
          <Route path="/config/bill-master" component={BillMasterConfig} />
          <Route path="/config/workflow" component={WorkflowConfig} />
          <Route path="/config/access-rights" component={AccessRights} />
          <Route path="/config/report-builder" component={ReportBuilderPage} />
          <Route path="/reports" component={Reports} />
          <Route path="/reports/user" component={UserReports} />
          <Route path="/reports/custom" component={CustomReportsPage} />
          <Route path="/configuration" component={Configuration} />
          <Route path="/configuration/cost-center" component={CostCenter} />
          <Route path="/admin" component={Admin} />
          <Route path="/workflow" component={Workflow} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <AgentButton />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
