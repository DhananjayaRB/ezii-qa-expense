import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// REMOVED: All Replit authentication imports - System uses JWT tokens from localStorage ONLY
// import { setupAuth, requireAuth } from "./replitAuth";
import {
  insertExpenseClaimSchema,
  insertExpenseItemSchema,
  insertDirectExpenseSchema,
  insertExpenseRequestSchema,
  insertAdvancePaymentSchema,
  insertReceiptSchema,
  insertPaymentBatchSchema,
  insertPaymentBatchItemSchema,
  insertCardStatementSchema,
  insertCardTransactionSchema,
  insertCardPaymentSchema,
  insertBankAdviceSchema,
  insertBankAdviceItemSchema,
  insertBankSchema,
  insertPettyCashReceiptSchema,
  insertCashboxSchema,
  insertLedgerEntrySchema,
  insertPettyCashTransactionSchema,
  insertExpenseCategorySchema,
  insertExpenseGroupSchema,
  insertExpenseHeadSchema,
  insertExpensePolicySchema,
  insertPartySchema,
  insertVendorSchema,
  insertVendorOnboardingRequestSchema,
  insertVendorDocumentSchema,
  insertVendorPaymentHistorySchema,
  insertCostCentreConfigSchema,
  insertTdsMasterSchema,
  insertContractSchema,
  insertBillMasterTypeSchema,
  insertBillMasterFieldSchema,
  insertWorkflowRoleSchema,
  insertWorkflowSchema,
  insertWorkflowLevelSchema,
  insertWorkflowAssignmentSchema,
  insertUserTutorialSchema,
  insertUtilityCategorySchema,
  insertUnitsOfMeasurementSchema,
} from "@shared/schema";
import agentRoutes from "./agent/agentRoutes";
import { automationRoutes } from "./routes/automationRoutes";
import fileUploadRoutes from "./routes/fileUploadRoutes";
import { getWorkflowEngine, type WorkflowContext } from "./workflowEngine";
import { ocrService } from "./services/ocrService";
import { fetchUserProfile } from "./userProfileService";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import jwt from "jsonwebtoken";
import { jwtAuth, getOrgId, getUserId, getUserRole, isAdmin } from "./middleware/jwtAuth";
import { requireAuth } from "./middleware/unifiedAuth";
import { getWorkflowRole, hasAdminRole, requireAdminRole } from "./middleware/jwtRoleMapping";

// Setup multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only .png, .jpg, .jpeg and .pdf files are allowed!"));
    }
  },
});

// Helper function to check if user has any of the required roles
// Handles comma-separated roles like "admin,accountant" properly
function hasRequiredRole(user: any, requiredRoles: string[]): boolean {
  if (!user || !user.role) return false;
  
  const userRoles = user.role.split(',').map((r: string) => r.trim());
  return requiredRoles.some(role => userRoles.includes(role));
}

export async function registerRoutes(app: Express): Promise<Server> {
  // REMOVED: Replit auth setup - System uses JWT tokens from localStorage ONLY
  // await setupAuth(app);

  // JWT middleware for all routes - extracts JWT claims when available
  app.use(jwtAuth);

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));

  // AI Agent routes
  app.use("/api/agent", agentRoutes);

  // Automation routes
  app.use("/api/automation", automationRoutes);

  // Azure Blob File Upload routes
  app.use("/api/files", jwtAuth, fileUploadRoutes);

  // REMOVED: Login endpoint - System uses ONLY jwt_token from localStorage
  // });

  // Users routes
  app.get("/api/users", requireAuth, async (req: any, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/metrics", requireAuth, async (req: any, res) => {
    try {
      // Use JWT user_id ONLY - no session auth fallback
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const orgId = getOrgId(req);
      const userRole = getUserRole(req);
      
      console.log("JWT Auth - Dashboard:", { userId, orgId, role: userRole });
      
      // TODO: Filter metrics by org_id when implementing multi-tenant support
      const metrics = await storage.getDashboardMetrics(userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Organization products endpoint - calls external API securely
  app.get("/api/organization/products", requireAuth, async (req: any, res) => {
    try {
      console.log("🔍 Fetching organization products from external API");
      
      // Get JWT token from request (secured way)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No valid JWT token found" });
      }
      
      const jwtToken = authHeader.split(' ')[1];
      
      // Call external API
      const response = await fetch('https://qa-api.resolveindia.com/organization/get-client-products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("🔍 Organization products:", data);
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching organization products:", error);
      res.status(500).json({ message: "Failed to fetch organization products" });
    }
  });

  // Secure SSO endpoint - generates short-lived tokens for external navigation
  app.post("/api/sso/generate-token", requireAuth, async (req: any, res) => {
    try {
      const { targetUrl } = req.body;
      
      // Whitelist of allowed target URLs for security (flexible matching)
      const allowedTargets = [
        { host: 'leave.ezii.co.in', path: '/' },
        { host: 'qa.resolveindia.com', path: '/dashboard/team-dashboard/team-dashboard' }
      ];
      
      // Parse target URL for flexible matching
      let parsedUrl;
      try {
        parsedUrl = new URL(targetUrl);
      } catch (error) {
        return res.status(400).json({ message: "Invalid target URL format" });
      }
      
      // Check if URL matches any allowed target (normalize trailing slashes)
      const normalizedPath = parsedUrl.pathname.replace(/\/+$/, '') || '/';
      const isAllowed = allowedTargets.some(target => 
        parsedUrl.hostname === target.host && 
        (normalizedPath === target.path.replace(/\/+$/, '') || normalizedPath === '/')
      );
      
      if (!isAllowed) {
        return res.status(400).json({ message: "Target URL not allowed" });
      }
      
      // Get original JWT token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No valid JWT token found" });
      }
      
      const originalJWT = authHeader.split(' ')[1];
      
      // Validate JWT secret is available
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error("JWT_SECRET environment variable is not set");
        return res.status(500).json({ message: "Server configuration error" });
      }

      // Generate a secure, one-time SSO token (5 minutes expiry)
      // NOTE: Do NOT embed the original JWT - use one-time nonce approach
      const ssoToken = jwt.sign(
        { 
          userId: req.user?.id,
          orgId: req.user?.orgId,
          targetUrl: targetUrl,
          nonce: Math.random().toString(36).substring(2, 15),
          exp: Math.floor(Date.now() / 1000) + (5 * 60) // 5 minutes
        },
        jwtSecret
      );
      
      // Return the redirect URL with secure fragment-based token
      const redirectUrl = `${targetUrl}#token=${ssoToken}`;
      
      res.json({ redirectUrl });
    } catch (error) {
      console.error("Error generating SSO token:", error);
      res.status(500).json({ message: "Failed to generate SSO token" });
    }
  });

  // Expense claim routes
  app.get("/api/expense-claims", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      
      // If user is not admin or accountant, only show their own claims
      if (user?.role === "employee") {
        filters.userId = userId;
      }
      
      if (req.query.status) filters.status = req.query.status;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const claims = await storage.getExpenseClaims(filters);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching expense claims:", error);
      res.status(500).json({ message: "Failed to fetch expense claims" });
    }
  });

  // Get claims pending approval for current user's role (OPTIMIZED - MUST come before :id route)
  app.get("/api/expense-claims/pending-approval", requireAuth, async (req: any, res) => {
    console.log("🚀🚀🚀 PENDING APPROVAL API CALLED - STARTING OPTIMIZATION");
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const orgId = getOrgId(req);
      const jwtRole = getUserRole(req);
      if (!orgId || !jwtRole) {
        return res.status(401).json({ message: "JWT Authentication required - missing org or role" });
      }
      
      // SECURITY: Only get existing user, never auto-create with admin privileges
      let user = await storage.getUser(userId);
      if (!user) {
        console.log(`❌ Unauthorized user ${userId} attempted access - no user record found`);
        return res.status(401).json({ message: "Unauthorized: User not found in system" });
      }

      // Map JWT roles to database roles for compatibility
      const roleMapping: Record<string, string> = {
        'admin': 'admin',
        'manager': 'manager', 
        'employee': 'employee',
        'accountant': 'accountant'
      };
      
      const effectiveRole = roleMapping[jwtRole] || jwtRole;
      console.log(`Pending approval lookup for user ${userId} (${effectiveRole})`);

      // OPTIMIZED VERSION: Batch fetch all data upfront to avoid N+1 queries
      const [allClaims, allExpenseRequests] = await Promise.all([
        storage.getExpenseClaims({}),
        storage.getExpenseRequests({}).then(requests => 
          requests.filter(request => !['approved', 'rejected', 'paid'].includes(request.status))
        )
      ]);
      
      console.log(`Total claims in database: ${allClaims.length}`);
      console.log(`Total expense requests in database: ${allExpenseRequests.length}`);
      
      // OPTIMIZATION 1: Batch fetch all users to avoid N+1 queries
      const allUserIds = new Set([
        ...allClaims.map(claim => claim.userId),
        ...allExpenseRequests.map(request => request.userId)
      ]);
      
      const userIdsArray = Array.from(allUserIds);
      const allUsers = await Promise.all(userIdsArray.map(uid => storage.getUser(uid)));
      const userMap = new Map();
      allUsers.forEach((user, idx) => {
        if (user) userMap.set(userIdsArray[idx], user);
      });

      // OPTIMIZATION 2: Batch fetch workflow instances to avoid N+1 queries  
      const allEntityIds = [
        ...allClaims.map(claim => ({ id: claim.id, type: 'claim' })),
        ...allExpenseRequests.map(request => ({ id: request.id, type: 'request' }))
      ];

      const workflowInstances = await Promise.all(
        allEntityIds.map(async entity => {
          try {
            return await storage.getWorkflowInstance(entity.id, entity.type);
          } catch (error) {
            return null;
          }
        })
      );
      
      const workflowInstanceMap = new Map();
      allEntityIds.forEach((entity, idx) => {
        if (workflowInstances[idx]) {
          workflowInstanceMap.set(entity.id, workflowInstances[idx]);
        }
      });

      // WORKFLOW-ONLY FILTERING: Only include items that have workflows and current user can approve
      const workflowEngine = getWorkflowEngine(storage);
      const filteredClaims: any[] = [];
      const filteredExpenseRequests: any[] = [];
      
      // SIMPLE CACHE OPTIMIZATION: Eliminate N+1 queries with in-memory cache
      const workflowCache = new Map<string, any>();
      const approverCache = new Map<string, string[]>();
      
      console.log(`🚀 SIMPLE OPTIMIZATION: Processing ${allClaims.length} claims with caching`);
      
      // Process claims with simple caching to eliminate N+1 queries
      for (const claim of allClaims) {
        try {
          // Use pre-fetched user data instead of individual queries
          const claimSubmitter = userMap.get(claim.userId);
          if (!claimSubmitter) continue;
          
          const context = {
            processType: 'claim' as const,
            amount: parseFloat(claim.totalAmount),
            submitterId: claim.userId,
            companyId: claimSubmitter.companyId || orgId,
            vendorId: claim.vendorId || undefined
          };
          
          // CACHE KEY for workflow determination
          const workflowCacheKey = `${context.companyId}:${context.processType}:${context.vendorId || 'none'}`;
          
          // Step 1: Check workflow cache first
          let workflow = workflowCache.get(workflowCacheKey);
          if (!workflow) {
            if (claim.workflowId) {
              workflow = { id: claim.workflowId };
            } else {
              workflow = await workflowEngine.determineWorkflow(context);
            }
            workflowCache.set(workflowCacheKey, workflow);
            console.log(`💾 Cached workflow for key: ${workflowCacheKey}`);
          } else {
            console.log(`⚡ Using cached workflow for key: ${workflowCacheKey}`);
          }
          
          if (!workflow) {
            console.log(`⚠️ Skipping claim ${claim.id} - No workflow configured`);
            continue;
          }
          
          // Step 2: Get current workflow level using pre-fetched data
          let currentLevel = 1; // Default to level 1
          const workflowInstance = workflowInstanceMap.get(claim.id);
          if (workflowInstance) {
            currentLevel = workflowInstance.currentLevel;
          }
          
          // CACHE KEY for approver determination
          const approverCacheKey = `${workflow.id}:${currentLevel}:${context.companyId}`;
          
          // Step 3: Check approver cache first
          let approvers = approverCache.get(approverCacheKey);
          if (!approvers) {
            approvers = await workflowEngine.getApproversForLevel(workflow.id, currentLevel, context);
            approverCache.set(approverCacheKey, approvers);
            console.log(`💾 Cached approvers for key: ${approverCacheKey}`);
          } else {
            console.log(`⚡ Using cached approvers for key: ${approverCacheKey}`);
          }
          
          const canApprove = approvers.includes(userId);
          
          if (canApprove) {
            filteredClaims.push(claim);
            console.log(`✅ Including claim ${claim.id} via workflow ${workflow.id} - level ${currentLevel}, user ${userId} can approve`);
          } else {
            console.log(`❌ Excluding claim ${claim.id} - user ${userId} cannot approve at level ${currentLevel}`);
          }
        } catch (error) {
          console.log(`❌ Excluding claim ${claim.id} - workflow check failed:`, error);
        }
      }
      
      console.log(`🚀 CACHE STATS: ${workflowCache.size} workflows cached, ${approverCache.size} approver sets cached`)

      // Process expense requests with optimized batch data
      for (const request of allExpenseRequests) {
        try {
          // Use pre-fetched user data instead of individual queries
          const requestSubmitter = userMap.get(request.userId);
          if (!requestSubmitter) continue;
          
          const context = {
            processType: 'request' as const,
            amount: parseFloat(request.estimatedAmount || '0'),
            submitterId: request.userId,
            companyId: requestSubmitter.companyId || orgId,
            requestType: request.type || 'general'
          };
          
          // Step 1: Check if there's a workflow mapped for this process
          let workflow;
          if (request.workflowId) {
            // Use existing workflow ID
            workflow = { id: request.workflowId };
          } else {
            // Check if workflow exists for this process type
            workflow = await workflowEngine.determineWorkflow(context);
          }
          
          if (!workflow) {
            // Requests without workflows should already be auto-approved at creation time
            console.log(`⚠️ Skipping request ${request.id} - No workflow configured (should be auto-approved at creation)`);
            continue;
          }

          // Step 2: Get current workflow level using pre-fetched data
          let currentLevel = 1;
          let selfApprovalRequired = false;
          const workflowInstance = workflowInstanceMap.get(request.id);
          if (workflowInstance) {
            currentLevel = workflowInstance.currentLevel;
          }
          
          const approvers = await workflowEngine.getApproversForLevel(workflow.id, currentLevel, context);
          const canApprove = approvers.includes(userId);
          
          // Check for self-approval scenario: submitter is the only approver (both new and existing requests)
          let isSelfApproval = selfApprovalRequired && request.userId === userId;
          
          // For existing requests, also check if self-approval deadlock exists
          if (!isSelfApproval && request.userId === userId && !canApprove) {
            const isSelfApprovalDeadlock = await workflowEngine.checkSelfApprovalDeadlock(workflow.id, context);
            if (isSelfApprovalDeadlock) {
              isSelfApproval = true;
              console.log(`🔍 Detected self-approval deadlock for existing request ${request.id}`);
            }
          }
          
          if (canApprove || isSelfApproval) {
            filteredExpenseRequests.push({
              ...request,
              selfApprovalRequired: isSelfApproval // Add flag for frontend warning
            });
            
            if (isSelfApproval) {
              console.log(`⚠️ Including request ${request.id} for SELF-APPROVAL - user ${userId} is submitter and only approver`);
            } else {
              console.log(`✅ Including request ${request.id} via workflow ${workflow.id} - level ${currentLevel}, user ${userId} can approve`);
            }
          } else {
            console.log(`❌ Excluding request ${request.id} - user ${userId} cannot approve at level ${currentLevel}`);
          }
        } catch (error) {
          console.log(`❌ Excluding request ${request.id} - workflow check failed:`, error);
        }
      }

      // Get user details for each claim
      const claimsWithUsers = await Promise.all(
        filteredClaims.map(async (claim) => {
          const claimUser = await storage.getUser(claim.userId);
          const items = await storage.getExpenseItems(claim.id);
          return {
            ...claim,
            user: claimUser,
            items,
            type: 'expense_claim' as const
          };
        })
      );

      // Get user details for each expense request
      const requestsWithUsers = await Promise.all(
        filteredExpenseRequests.map(async (request) => {
          const requestUser = await storage.getUser(request.userId);
          return {
            ...request,
            user: requestUser,
            type: 'expense_request' as const
          };
        })
      );

      // ENHANCED: Add vendor onboarding requests with STRICT workflow-based filtering
      let vendorOnboardingRequests: any[] = [];
      
      try {
        // Get all vendor onboarding requests
        const allOnboardingRequests = await storage.getVendorOnboardingRequests({});
        console.log(`Found ${allOnboardingRequests.length} total vendor onboarding requests`);
        
        for (const request of allOnboardingRequests) {
          try {
            // Build context for workflow determination
            const context = {
              processType: 'vendor' as const,
              amount: 0, // Vendor onboarding doesn't have credit limit, use 0 for workflow routing
              submitterId: request.requestedBy,
              companyId: orgId
            };
            
            // Step 1: Check if there's a workflow mapped for vendor process
            let workflow;
            // Vendor onboarding requests don't have workflowId field, always determine workflow
            workflow = await workflowEngine.determineWorkflow(context);
            
            if (!workflow) {
              console.log(`❌ Excluding vendor request ${request.id} - No workflow mapped for process type 'vendor'`);
              continue;
            }
            
            // Step 2: Get current workflow level from workflowInstances table
            let currentLevel = 1; // Default to level 1
            try {
              // Try to get current level from workflow instance
              const workflowInstance = await storage.getWorkflowInstance(request.id, 'vendor');
              if (workflowInstance) {
                currentLevel = workflowInstance.currentLevel;
              } else {
                // Initialize workflow if not exists
                const workflowResult = await workflowEngine.initializeWorkflow(context);
                if (!workflowResult.fallbackToLegacy && workflowResult.workflowId) {
                  await storage.createWorkflowInstance({
                    entityId: request.id,
                    entityType: 'vendor',
                    workflowId: workflowResult.workflowId,
                    currentLevel: workflowResult.currentLevel,
                    status: 'pending'
                  });
                  currentLevel = workflowResult.currentLevel;
                }
              }
            } catch (error) {
              console.log(`⚠️ Could not get workflow level for vendor request ${request.id}, using default level 1:`, error);
            }
            
            const approvers = await workflowEngine.getApproversForLevel(workflow.id, currentLevel, context);
            const canApprove = approvers.includes(userId);
            
            if (canApprove) {
              // Get submitter details
              const submitter = await storage.getUser(request.requestedBy);
              vendorOnboardingRequests.push({
                ...request,
                user: submitter,
                type: 'vendor_onboarding' as const,
                // Map vendor fields to match claim structure for frontend compatibility
                totalAmount: '0', // Vendor onboarding doesn't have amount
                submittedAt: request.requestedAt,
                items: [{
                  description: `Vendor: ${request.vendorName}`,
                  amount: '0'
                }]
              });
              console.log(`✅ Including vendor request ${request.id} via workflow ${workflow.id} - level ${currentLevel}, user ${userId} can approve`);
            } else {
              console.log(`❌ Excluding vendor request ${request.id} - user ${userId} cannot approve at level ${currentLevel}`);
            }
          } catch (error) {
            console.log(`❌ Excluding vendor request ${request.id} - workflow check failed:`, error);
          }
        }
      } catch (error) {
        console.error('Error fetching vendor onboarding requests:', error);
      }

      // ENHANCED: Add vendor claims (expense claims with vendorId) to pending approvals  
      const vendorClaims = claimsWithUsers.filter(claim => claim.vendorId);
      const regularClaims = claimsWithUsers.filter(claim => !claim.vendorId);

      // Mark vendor claims with special type for frontend identification
      vendorClaims.forEach(claim => {
        claim.type = 'vendor_claim';
      });

      console.log(`Pending approvals summary: ${regularClaims.length} regular claims, ${vendorClaims.length} vendor claims, ${requestsWithUsers.length} expense requests, ${vendorOnboardingRequests.length} vendor requests`);

      // Combine all types of pending items
      const allPendingItems = [...regularClaims, ...vendorClaims, ...requestsWithUsers, ...vendorOnboardingRequests];
      res.json(allPendingItems);
    } catch (error) {
      console.error("Error fetching pending claims:", error);
      res.status(500).json({ message: "Failed to fetch pending claims" });
    }
  });

  app.get("/api/expense-claims/:id", requireAuth, async (req: any, res) => {
    try {
      const claim = await storage.getExpenseClaim(req.params.id);
      if (!claim) {
        return res.status(404).json({ message: "Expense claim not found" });
      }
      res.json(claim);
    } catch (error) {
      console.error("Error fetching expense claim:", error);
      res.status(500).json({ message: "Failed to fetch expense claim" });
    }
  });

  // Get cost distributions for a claim
  app.get("/api/expense-claims/:id/cost-distributions", requireAuth, async (req: any, res) => {
    try {
      const costDistributions = await storage.getCostDistributions(req.params.id);
      res.json(costDistributions);
    } catch (error) {
      console.error("Error fetching cost distributions:", error);
      res.status(500).json({ message: "Failed to fetch cost distributions" });
    }
  });

  // Get approval history for a claim
  app.get("/api/expense-claims/:id/approval-history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getApprovalHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching approval history:", error);
      res.status(500).json({ message: "Failed to fetch approval history" });
    }
  });

  // Process approval workflow (approve/reject/return)
  app.post("/api/expense-claims/:id/approve", requireAuth, async (req: any, res) => {
    try {
      const { action, remarks, costDistributions } = req.body;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      if (!['approve', 'reject', 'return'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be approve, reject, or return." });
      }

      // If cost distributions are provided and action is approve, update them
      if (costDistributions && action === 'approve') {
        console.log('💡 Approver modified cost distributions:', costDistributions);
        
        // Get original cost distributions to preserve original amounts
        const originalDistributions = await storage.getCostDistributions(req.params.id);
        const originalMap = new Map(originalDistributions.map(d => [d.id, d.amount]));
        
        // Update cost distributions with approver modifications
        for (const distribution of costDistributions) {
          const originalAmount = originalMap.get(distribution.id) || distribution.amount.toString();
          
          await storage.updateCostDistribution(distribution.id, {
            amount: distribution.amount.toString(),
            // Store the original amount only if it's different from new amount
            ...(originalAmount !== distribution.amount.toString() && {
              originalAmount: originalAmount
            })
          });
        }
      }

      const result = await storage.processApprovalWorkflow(
        req.params.id,
        userId,
        action,
        remarks
      );

      res.json({
        message: `Claim ${action}d successfully`,
        claim: result.claim,
        costDistributionsModified: !!costDistributions,
        nextApprover: result.nextApprover ? {
          id: result.nextApprover.id,
          name: `${result.nextApprover.firstName || ''} ${result.nextApprover.lastName || ''}`.trim() || result.nextApprover.email,
          role: result.nextApprover.role,
        } : undefined,
      });
    } catch (error) {
      console.error("Error processing approval:", error);
      res.status(500).json({ message: "Failed to process approval" });
    }
  });

  // Payment processing routes
  app.get("/api/expense-claims/approved", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      // Only accountants and admins can view approved claims for payment
      if (!user?.role.includes('accountant') && !user?.role.includes('admin')) {
        return res.status(403).json({ message: "Access denied. Only accountants can process payments." });
      }

      const approvedClaims = await storage.getApprovedClaims();
      res.json(approvedClaims);
    } catch (error) {
      console.error("Error fetching approved claims:", error);
      res.status(500).json({ message: "Failed to fetch approved claims" });
    }
  });

  app.post("/api/expense-claims/:id/process-payment", requireAuth, async (req: any, res) => {
    try {
      const { utrNumber, paymentDate } = req.body;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      // Only accountants and admins can process payments
      if (!user?.role.includes('accountant') && !user?.role.includes('admin')) {
        return res.status(403).json({ message: "Access denied. Only accountants can process payments." });
      }

      if (!utrNumber || !paymentDate) {
        return res.status(400).json({ message: "UTR number and payment date are required" });
      }

      const claim = await storage.processPayment(
        req.params.id,
        utrNumber,
        new Date(paymentDate),
        userId
      );

      res.json({
        message: "Payment processed successfully",
        claim,
        utrNumber,
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  app.get("/api/expense-claims/processed-payments", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      // Only accountants and admins can view processed payments
      if (!user?.role.includes('accountant') && !user?.role.includes('admin')) {
        return res.status(403).json({ message: "Access denied. Only accountants can view payment history." });
      }

      const filters: any = {};
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const processedPayments = await storage.getProcessedPayments(filters);
      res.json(processedPayments);
    } catch (error) {
      console.error("Error fetching processed payments:", error);
      res.status(500).json({ message: "Failed to fetch processed payments" });
    }
  });

  app.post("/api/expense-claims", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      console.log("=== EXPENSE CLAIM POST REQUEST ===");
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      
      // Vendor compliance checks - ensure vendor is active if vendorId is provided
      if (req.body.vendorId) {
        const vendor = await storage.getVendor(req.body.vendorId);
        if (!vendor) {
          return res.status(400).json({ message: "Vendor not found" });
        }
        if (vendor.status !== 'active') {
          return res.status(400).json({ message: "Only active vendors can be selected for expense claims" });
        }
      }
      
      // Calculate balance payment and extra amount
      const totalAmount = parseFloat(req.body.totalAmount || '0');
      const advanceAmount = parseFloat(req.body.advanceAmount || '0');
      const originalRequestAmount = parseFloat(req.body.originalRequestAmount || '0');
      const extraAmount = parseFloat(req.body.extraAmount || '0');
      const balancePayment = totalAmount - advanceAmount;
      
      // Get user for company context
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Fetch user profile data from external API with authentication context
      const jwtToken = req.headers.authorization?.replace('Bearer ', '');
      const orgId = getOrgId(req) || user.companyId || '';
      
      const userProfile = await fetchUserProfile({
        userId,
        jwtToken,
        orgId
      });

      // Helper function to translate workflow level to legacy role for backward compatibility
      const translateWorkflowLevelToClaimRole = (level: number): string => {
        const levelRoleMap: Record<number, string> = {
          1: 'manager',
          2: 'admin', 
          3: 'head',
          4: 'accountant'
        };
        return levelRoleMap[level] || `level_${level}`;
      };
      
      // Convert date fields to Date objects  
      const claimData = {
        ...req.body,
        userId,
        requestId: req.body.requestId || null,
        vendorId: req.body.vendorId || null,
        vendorInvoiceNumber: req.body.vendorInvoiceNumber || null,
        totalAmount: totalAmount.toString(),
        originalRequestAmount: originalRequestAmount.toString(),
        extraAmount: extraAmount.toString(),
        advanceAmount: advanceAmount.toString(),
        balancePayment: balancePayment.toString(),
        // Convert any date fields
        submittedDate: req.body.submittedDate ? new Date(req.body.submittedDate) : new Date(),
        // Add employee profile data from external API
        employerName: userProfile.employerName,
        employeeNumber: userProfile.employeeNumber,
        employeeEmail: userProfile.employeeEmail,
      };

      // Initialize workflow if configured
      const workflowEngine = getWorkflowEngine(storage);
      
      const workflowContext: WorkflowContext = {
        processType: 'claim',
        submitterId: userId,
        companyId: orgId,
        amount: totalAmount,
        vendorId: req.body.vendorId,
        expenseHeadId: req.body.expenseHeadId
      };
      
      const workflowResult = await workflowEngine.initializeWorkflow(workflowContext);
      
      if (workflowResult.fallbackToLegacy || workflowResult.isComplete) {
        // No workflows configured OR auto-approved, use auto-approval
        claimData.status = 'approved';
        claimData.currentApprovalLevel = 'auto_approved';
        claimData.approvedAt = new Date();
        claimData.approvedBy = userId;
        console.log('✅ Expense claim: Auto-approved - no workflow configured or completed immediately');
      } else {
        // Workflow configured, set status and level based on workflow result
        const roleBasedLevel = translateWorkflowLevelToClaimRole(workflowResult.currentLevel);
        claimData.status = `pending_${roleBasedLevel}`;
        claimData.currentApprovalLevel = roleBasedLevel;
        
        if (workflowResult.requiredApprovers.length > 0) {
          claimData.pendingWith = workflowResult.requiredApprovers[0];
        }
        
        console.log(`Expense claim: Using workflow - Level ${workflowResult.currentLevel} -> ${roleBasedLevel}, Status: ${claimData.status}`);
      }
      
      console.log("Processed claim data:", JSON.stringify(claimData, null, 2));
      
      const validatedData = insertExpenseClaimSchema.parse(claimData);
      console.log("Validation successful for claim");

      // Prepare cost distributions if provided
      const costDistributions = req.body.distributeCost && req.body.costDistributions 
        ? req.body.costDistributions.map((dist: any) => ({
            costCenterId: dist.costCenterId,
            costCenterName: dist.costCenterName,
            costCenterType: dist.costCenterType,
            amount: parseFloat(dist.amount).toString(),
          }))
        : undefined;

      // Check for associated OCR data by claim title and store in billDetails
      let billDetails = null;
      if (req.body.title) {
        try {
          const ocrData = await storage.getOcrResultByClaimTitle(req.body.title, userId);
          if (ocrData && ocrData.extractedData) {
            console.log(`📄 Found OCR data for claim title "${req.body.title}":`, JSON.stringify(ocrData.extractedData, null, 2));
            billDetails = {
              ocrId: ocrData.id,
              originalFileName: ocrData.fileName,
              extractedData: ocrData.extractedData,
              confidence: ocrData.confidenceScore || 0,
              extractedAt: ocrData.createdAt,
              status: ocrData.status
            };
          }
        } catch (error) {
          console.log(`⚠️ No OCR data found for claim title "${req.body.title}":`, error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Add billDetails to validatedData if OCR data exists
      if (billDetails) {
        validatedData.billDetails = billDetails;
        console.log(`✅ Adding OCR bill details to expense claim`);
      }

      const claim = await storage.createExpenseClaim(validatedData, costDistributions);
      
      // If linked to an advance, mark it as settled
      if (req.body.advancePaymentId) {
        await storage.markAdvanceAsSettled(req.body.advancePaymentId);
      }
      
      // Create expense items if provided
      if (req.body.items && Array.isArray(req.body.items)) {
        for (const item of req.body.items) {
          // Ensure date is a proper Date object
          let itemDate;
          if (item.date) {
            itemDate = typeof item.date === 'string' ? new Date(item.date) : item.date;
            // Validate the date
            if (isNaN(itemDate.getTime())) {
              throw new Error(`Invalid date: ${item.date}`);
            }
          } else {
            itemDate = new Date();
          }
          
          const itemData = {
            claimId: claim.id,
            categoryId: "81466b84-bb4a-4874-9197-ac1e9bf7c70a", // Use valid Travel category ID (temporary fix)
            description: item.description,
            amount: parseFloat(item.amount || '0').toString(),
            currency: item.currency || 'INR',
            date: itemDate,
            // Include OCR-extracted bill details
            billNo: item.billNo || null,
            billDate: item.billDate ? new Date(item.billDate) : null,
            billAmount: item.billAmount ? parseFloat(item.billAmount).toString() : null,
          };
          
          console.log("Creating expense item:", JSON.stringify({
            ...itemData,
            date: itemData.date.toISOString()
          }, null, 2));
          
          const validatedItem = insertExpenseItemSchema.parse(itemData);
          await storage.createExpenseItem(validatedItem);
        }
      }

      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating expense claim:", error);
      res.status(500).json({ message: "Failed to create expense claim" });
    }
  });

  app.patch("/api/expense-claims/:id/status", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      // Only admin or accountant can approve/reject claims
      if (user?.role !== "admin" && user?.role !== "accountant") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status } = req.body;
      const claim = await storage.updateExpenseClaimStatus(req.params.id, status, userId);
      res.json(claim);
    } catch (error) {
      console.error("Error updating expense claim status:", error);
      res.status(500).json({ message: "Failed to update expense claim status" });
    }
  });

  app.put("/api/expense-claims/:id", requireAuth, async (req: any, res) => {
    try {
      const claim = await storage.updateExpenseClaim(req.params.id, req.body);
      if (!claim) {
        return res.status(404).json({ message: "Expense claim not found" });
      }
      res.json(claim);
    } catch (error) {
      console.error("Error updating expense claim:", error);
      res.status(500).json({ message: "Failed to update expense claim" });
    }
  });

  app.delete("/api/expense-claims/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteExpenseClaim(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense claim:", error);
      res.status(500).json({ message: "Failed to delete expense claim" });
    }
  });

  // Direct expense routes
  app.get("/api/direct-expenses", requireAuth, async (req: any, res) => {
    try {
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const expenses = await storage.getDirectExpenses(filters);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching direct expenses:", error);
      res.status(500).json({ message: "Failed to fetch direct expenses" });
    }
  });

  app.post("/api/direct-expenses", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      // Fetch user profile data from external API with authentication context
      const jwtToken = req.headers.authorization?.replace('Bearer ', '');
      const orgId = getOrgId(req);
      
      const userProfile = await fetchUserProfile({
        userId,
        jwtToken,
        orgId
      });
      
      const expenseData = {
        ...req.body,
        createdBy: userId,
        amount: parseFloat(req.body.amount || '0').toString(),
        // Add employee profile data from external API
        employerName: userProfile.employerName,
        employeeNumber: userProfile.employeeNumber,
        employeeEmail: userProfile.employeeEmail,
      };
      const validatedData = insertDirectExpenseSchema.parse(expenseData);

      const expense = await storage.createDirectExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating direct expense:", error);
      res.status(500).json({ message: "Failed to create direct expense" });
    }
  });

  app.put("/api/direct-expenses/:id", requireAuth, async (req: any, res) => {
    try {
      const expense = await storage.updateDirectExpense(req.params.id, req.body);
      if (!expense) {
        return res.status(404).json({ message: "Direct expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Error updating direct expense:", error);
      res.status(500).json({ message: "Failed to update direct expense" });
    }
  });

  app.delete("/api/direct-expenses/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteDirectExpense(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting direct expense:", error);
      res.status(500).json({ message: "Failed to delete direct expense" });
    }
  });

  // Process payment for direct expense
  app.post("/api/direct-expenses/:id/process-payment", requireAuth, async (req: any, res) => {
    try {
      const { utrNumber, paymentDate } = req.body;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      // Only accountants and admins can process payments
      if (!user?.role.includes('accountant') && !user?.role.includes('admin')) {
        return res.status(403).json({ message: "Access denied. Only accountants can process payments." });
      }

      if (!utrNumber || !paymentDate) {
        return res.status(400).json({ message: "UTR number and payment date are required" });
      }

      const expense = await storage.processDirectExpensePayment(
        req.params.id,
        utrNumber,
        new Date(paymentDate),
        userId
      );

      res.json({
        message: "Payment processed successfully",
        expense,
        utrNumber,
      });
    } catch (error) {
      console.error("Error processing direct expense payment:", error);
      res.status(500).json({ message: "Failed to process direct expense payment" });
    }
  });

  // Expense request routes
  app.get("/api/expense-requests", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      
      // If user is not admin or accountant, only show their own requests
      if (user?.role === "employee") {
        filters.userId = userId;
      }
      
      if (req.query.status) filters.status = req.query.status;

      const requests = await storage.getExpenseRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching expense requests:", error);
      res.status(500).json({ message: "Failed to fetch expense requests" });
    }
  });

  // Get approved expense requests for claim linking
  app.get("/api/expense-requests/approved", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const approvedRequests = await storage.getExpenseRequests({ 
        userId, 
        status: "approved" 
      });
      res.json(approvedRequests);
    } catch (error) {
      console.error("Error fetching approved expense requests:", error);
      res.status(500).json({ message: "Failed to fetch approved expense requests" });
    }
  });

  app.post("/api/expense-requests", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      // Get user for company context first
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Fetch user profile data from external API with authentication context
      const jwtToken = req.headers.authorization?.replace('Bearer ', '');
      const orgId = getOrgId(req) || user.companyId || '';
      
      const userProfile = await fetchUserProfile({
        userId,
        jwtToken,
        orgId
      });

      const requestData = {
        ...req.body,
        userId,
        estimatedAmount: req.body.estimatedAmount ? parseFloat(req.body.estimatedAmount).toString() : undefined,
        // Add employee profile data from external API
        employerName: userProfile.employerName,
        employeeNumber: userProfile.employeeNumber,
        employeeEmail: userProfile.employeeEmail,
      };
      const validatedData = insertExpenseRequestSchema.parse(requestData);

      // Helper function to translate workflow level to legacy role for backward compatibility
      const translateWorkflowLevelToRole = (level: number): string => {
        const levelRoleMap: Record<number, string> = {
          1: 'manager',
          2: 'admin', 
          3: 'head',
          4: 'accountant'
        };
        return levelRoleMap[level] || `level_${level}`;
      };

      // Initialize workflow if configured
      const workflowEngine = getWorkflowEngine(storage);
      
      const workflowContext: WorkflowContext = {
        processType: 'request',
        submitterId: userId,
        companyId: orgId,
        amount: req.body.estimatedAmount ? parseFloat(req.body.estimatedAmount) : undefined,
        expenseHeadId: req.body.expenseHeadId
      };
      
      const workflowResult = await workflowEngine.initializeWorkflow(workflowContext);
      
      if (workflowResult.fallbackToLegacy || workflowResult.isComplete) {
        // No workflows configured OR auto-approved, use auto-approval
        validatedData.status = 'approved';
        validatedData.currentApprovalLevel = 'auto_approved';
        validatedData.approvedAt = new Date();
        validatedData.approvedBy = userId;
        console.log('✅ Expense request: Auto-approved - no workflow configured or completed immediately');
      } else {
        // Workflow configured, set status and level based on workflow result
        const roleBasedLevel = translateWorkflowLevelToRole(workflowResult.currentLevel);
        validatedData.status = `pending_${roleBasedLevel}`;
        validatedData.currentApprovalLevel = roleBasedLevel;
        
        if (workflowResult.requiredApprovers.length > 0) {
          validatedData.pendingWith = workflowResult.requiredApprovers[0];
        }
        
        console.log(`Expense request: Using workflow - Level ${workflowResult.currentLevel} -> ${roleBasedLevel}, Status: ${validatedData.status}`);
      }

      const request = await storage.createExpenseRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating expense request:", error);
      res.status(500).json({ message: "Failed to create expense request" });
    }
  });

  app.patch("/api/expense-requests/:id/status", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      // Only admin or accountant can approve/reject requests
      if (user?.role !== "admin" && user?.role !== "accountant") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status, approvedAmount } = req.body;
      
      // Update request status
      const request = await storage.updateExpenseRequestStatus(req.params.id, status, userId);
      
      // If approved and it's an advance payment request, create advance payment
      if (status === 'approved' && request.type === 'advance_payment' && approvedAmount) {
        await storage.processAdvancePayment(req.params.id, approvedAmount.toString());
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error updating expense request status:", error);
      res.status(500).json({ message: "Failed to update expense request status" });
    }
  });

  app.put("/api/expense-requests/:id", requireAuth, async (req: any, res) => {
    try {
      const request = await storage.updateExpenseRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ message: "Expense request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error updating expense request:", error);
      res.status(500).json({ message: "Failed to update expense request" });
    }
  });

  app.delete("/api/expense-requests/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteExpenseRequest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense request:", error);
      res.status(500).json({ message: "Failed to delete expense request" });
    }
  });

  // Approve/Reject expense request (POST endpoint - consistent with other approval workflows)
  app.post("/api/expense-requests/:id/approve", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      // Only admin or accountant can approve/reject requests
      if (user?.role !== "admin" && user?.role !== "accountant") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { action, remarks } = req.body;
      const status = action === 'approve' ? 'approved' : (action === 'reject' ? 'rejected' : action);
      
      // Update request status
      const request = await storage.updateExpenseRequestStatus(req.params.id, status, userId);
      
      // If approved and it's an advance payment request, create advance payment
      if (status === 'approved' && request.type === 'advance_payment') {
        await storage.processAdvancePayment(req.params.id, parseFloat(request.estimatedAmount || "0"));
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error approving expense request:", error);
      res.status(500).json({ message: "Failed to approve expense request" });
    }
  });

  // Approve/Reject expense request (PATCH endpoint - legacy)
  app.patch("/api/expense-requests/:id/approve", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      // Only admin or accountant can approve/reject requests
      if (user?.role !== "admin" && user?.role !== "accountant") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { action } = req.body;
      const status = action === 'approve' ? 'approved' : 'rejected';
      
      // Update request status
      const request = await storage.updateExpenseRequestStatus(req.params.id, status, userId);
      
      // If approved and it's an advance payment request, create advance payment
      if (status === 'approved' && request.type === 'advance_payment') {
        await storage.processAdvancePayment(req.params.id, parseFloat(request.estimatedAmount || "0"));
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error approving expense request:", error);
      res.status(500).json({ message: "Failed to approve expense request" });
    }
  });

  // Advance payment routes
  app.get("/api/advance-payments", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      
      // If user is not admin or accountant, only show their own advances
      if (user?.role === "employee") {
        filters.userId = userId;
      }
      
      if (req.query.isSettled !== undefined) {
        filters.isSettled = req.query.isSettled === 'true';
      }

      const advances = await storage.getAdvancePayments(filters);
      res.json(advances);
    } catch (error) {
      console.error("Error fetching advance payments:", error);
      res.status(500).json({ message: "Failed to fetch advance payments" });
    }
  });

  app.get("/api/users/:userId/approved-advances", requireAuth, async (req: any, res) => {
    try {
      const requestingUserId = req.user.claims.sub;
      const targetUserId = req.params.userId;
      const user = await storage.getUser(requestingUserId);
      
      // Users can only see their own advances unless they're admin/accountant
      if (user?.role === "employee" && requestingUserId !== targetUserId) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const advances = await storage.getApprovedAdvancesByUser(targetUserId);
      res.json(advances);
    } catch (error) {
      console.error("Error fetching approved advances:", error);
      res.status(500).json({ message: "Failed to fetch approved advances" });
    }
  });

  app.post("/api/advance-payments", requireAuth, async (req: any, res) => {
    try {
      const advanceData = {
        ...req.body,
        approvedAmount: req.body.approvedAmount ? parseFloat(req.body.approvedAmount).toString() : undefined,
      };
      const validatedData = insertAdvancePaymentSchema.parse(advanceData);
      const advance = await storage.createAdvancePayment(validatedData);
      res.status(201).json(advance);
    } catch (error) {
      console.error("Error creating advance payment:", error);
      res.status(500).json({ message: "Failed to create advance payment" });
    }
  });

  app.put("/api/advance-payments/:id", requireAuth, async (req: any, res) => {
    try {
      const advance = await storage.updateAdvancePayment(req.params.id, req.body);
      if (!advance) {
        return res.status(404).json({ message: "Advance payment not found" });
      }
      res.json(advance);
    } catch (error) {
      console.error("Error updating advance payment:", error);
      res.status(500).json({ message: "Failed to update advance payment" });
    }
  });

  app.delete("/api/advance-payments/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteAdvancePayment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting advance payment:", error);
      res.status(500).json({ message: "Failed to delete advance payment" });
    }
  });

  // Receipt routes
  app.get("/api/receipts", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      // Admin and accountant can see all receipts, employees only their own
      const receipts = await storage.getReceipts(
        user?.role === "employee" ? userId : undefined
      );
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  app.post("/api/receipts/upload", requireAuth, upload.single("receipt"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;

      const receipt = await storage.createReceipt({
        userId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      res.status(201).json(receipt);
    } catch (error) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({ message: "Failed to upload receipt" });
    }
  });

  app.put("/api/receipts/:id", requireAuth, async (req: any, res) => {
    try {
      const receipt = await storage.updateReceipt(req.params.id, req.body);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      console.error("Error updating receipt:", error);
      res.status(500).json({ message: "Failed to update receipt" });
    }
  });

  app.delete("/api/receipts/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteReceipt(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting receipt:", error);
      res.status(500).json({ message: "Failed to delete receipt" });
    }
  });

  // Expense categories routes
  app.get("/api/expense-categories", requireAuth, async (req: any, res) => {
    try {
      const categories = await storage.getExpenseCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching expense categories:", error);
      res.status(500).json({ message: "Failed to fetch expense categories" });
    }
  });

  app.post("/api/expense-categories", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertExpenseCategorySchema.parse(req.body);
      const category = await storage.createExpenseCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating expense category:", error);
      res.status(500).json({ message: "Failed to create expense category" });
    }
  });

  app.put("/api/expense-categories/:id", requireAuth, async (req: any, res) => {
    try {
      const category = await storage.updateExpenseCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ message: "Expense category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating expense category:", error);
      res.status(500).json({ message: "Failed to update expense category" });
    }
  });

  app.delete("/api/expense-categories/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteExpenseCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense category:", error);
      res.status(500).json({ message: "Failed to delete expense category" });
    }
  });

  // Expense groups routes
  app.get("/api/expense-groups", requireAuth, async (req: any, res) => {
    try {
      const groups = await storage.getExpenseGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching expense groups:", error);
      res.status(500).json({ message: "Failed to fetch expense groups" });
    }
  });

  app.post("/api/expense-groups", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertExpenseGroupSchema.parse(req.body);
      const group = await storage.createExpenseGroup(validatedData);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating expense group:", error);
      res.status(500).json({ message: "Failed to create expense group" });
    }
  });

  app.put("/api/expense-groups/:id", requireAuth, async (req: any, res) => {
    try {
      const group = await storage.updateExpenseGroup(req.params.id, req.body);
      if (!group) {
        return res.status(404).json({ message: "Expense group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error updating expense group:", error);
      res.status(500).json({ message: "Failed to update expense group" });
    }
  });

  app.delete("/api/expense-groups/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteExpenseGroup(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense group:", error);
      res.status(500).json({ message: "Failed to delete expense group" });
    }
  });

  // Expense heads routes
  app.get("/api/expense-heads", requireAuth, async (req: any, res) => {
    try {
      const groupId = req.query.groupId as string;
      const heads = await storage.getExpenseHeads(groupId);
      res.json(heads);
    } catch (error) {
      console.error("Error fetching expense heads:", error);
      res.status(500).json({ message: "Failed to fetch expense heads" });
    }
  });

  app.get("/api/expense-heads/grouped-by-claim-form", requireAuth, async (req: any, res) => {
    try {
      const heads = await storage.getExpenseHeads();
      
      // Group by claim form type
      const groupedHeads = heads.reduce((acc, head) => {
        const claimForm = head.claimForm || 'expense';
        if (!acc[claimForm]) {
          acc[claimForm] = [];
        }
        acc[claimForm].push(head);
        return acc;
      }, {} as Record<string, any[]>);
      
      // Return only claim form types that have data
      const availableClaimForms = Object.keys(groupedHeads).filter(key => groupedHeads[key].length > 0);
      
      res.json({
        groupedHeads,
        availableClaimForms
      });
    } catch (error) {
      console.error("Error fetching grouped expense heads:", error);
      res.status(500).json({ message: "Failed to fetch grouped expense heads" });
    }
  });

  app.post("/api/expense-heads", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertExpenseHeadSchema.parse(req.body);
      const head = await storage.createExpenseHead(validatedData);
      res.status(201).json(head);
    } catch (error) {
      console.error("Error creating expense head:", error);
      res.status(500).json({ message: "Failed to create expense head" });
    }
  });

  app.put("/api/expense-heads/:id", requireAuth, async (req: any, res) => {
    try {
      const head = await storage.updateExpenseHead(req.params.id, req.body);
      if (!head) {
        return res.status(404).json({ message: "Expense head not found" });
      }
      res.json(head);
    } catch (error) {
      console.error("Error updating expense head:", error);
      res.status(500).json({ message: "Failed to update expense head" });
    }
  });

  app.delete("/api/expense-heads/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteExpenseHead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense head:", error);
      res.status(500).json({ message: "Failed to delete expense head" });
    }
  });

  // Expense policy routes
  app.get("/api/expense-policies", requireAuth, async (req: any, res) => {
    try {
      // Check role permissions
      if (!hasRequiredRole(req.user, ['admin', 'accountant'])) {
        return res.status(403).json({ message: "Access denied. Admin or accountant role required." });
      }

      // Get company ID from authenticated user - enforce tenant isolation
      const orgId = req.user.claims?.org_id || req.user.claims?.organization_id;
      if (!orgId) {
        return res.status(400).json({ message: "Company information not found in user profile" });
      }
      
      const policies = await storage.getExpensePolicies(orgId);
      res.json(policies);
    } catch (error) {
      console.error("Error fetching expense policies:", error);
      res.status(500).json({ message: "Failed to fetch expense policies" });
    }
  });

  app.post("/api/expense-policies", requireAuth, async (req: any, res) => {
    try {
      // Check role permissions
      if (!hasRequiredRole(req.user, ['admin', 'accountant'])) {
        return res.status(403).json({ message: "Access denied. Admin or accountant role required." });
      }

      // Get company ID from authenticated user only - no hardcoded defaults
      const orgId = req.user.claims?.org_id || req.user.claims?.organization_id;
      if (!orgId) {
        return res.status(400).json({ message: "Company information not found in user profile" });
      }

      const policyData = {
        ...req.body,
        companyId: orgId // Always use authenticated user's company
      };
      
      const validatedData = insertExpensePolicySchema.parse(policyData);
      const policy = await storage.createExpensePolicy(validatedData);
      res.status(201).json(policy);
    } catch (error) {
      console.error("Error creating expense policy:", error);
      res.status(500).json({ message: "Failed to create expense policy" });
    }
  });

  app.put("/api/expense-policies/:id", requireAuth, async (req: any, res) => {
    try {
      // Check role permissions
      if (!hasRequiredRole(req.user, ['admin', 'accountant'])) {
        return res.status(403).json({ message: "Access denied. Admin or accountant role required." });
      }

      // Get company ID from authenticated user
      const orgId = req.user.claims?.org_id || req.user.claims?.organization_id;
      if (!orgId) {
        return res.status(400).json({ message: "Company information not found in user profile" });
      }

      // Verify the policy exists and belongs to user's company before updating
      const existingPolicy = await storage.getExpensePolicyById(req.params.id);
      if (!existingPolicy) {
        return res.status(404).json({ message: "Expense policy not found" });
      }
      if (existingPolicy.companyId !== orgId) {
        return res.status(403).json({ message: "Access denied. Policy belongs to different company." });
      }

      // Validate update data with partial schema and strip companyId to prevent tenant escape
      const updateSchema = insertExpensePolicySchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      // Force companyId to user's organization - never allow changing it via API
      delete validatedData.companyId;
      const secureUpdateData = {
        ...validatedData,
        companyId: orgId // Always enforce user's company
      };

      const policy = await storage.updateExpensePolicy(req.params.id, secureUpdateData);
      res.json(policy);
    } catch (error) {
      console.error("Error updating expense policy:", error);
      res.status(500).json({ message: "Failed to update expense policy" });
    }
  });

  app.delete("/api/expense-policies/:id", requireAuth, async (req: any, res) => {
    try {
      // Check role permissions
      if (!hasRequiredRole(req.user, ['admin', 'accountant'])) {
        return res.status(403).json({ message: "Access denied. Admin or accountant role required." });
      }

      // Get company ID from authenticated user
      const orgId = req.user.claims?.org_id || req.user.claims?.organization_id;
      if (!orgId) {
        return res.status(400).json({ message: "Company information not found in user profile" });
      }

      // Verify the policy exists and belongs to user's company before deleting
      const existingPolicy = await storage.getExpensePolicyById(req.params.id);
      if (!existingPolicy) {
        return res.status(404).json({ message: "Expense policy not found" });
      }
      if (existingPolicy.companyId !== orgId) {
        return res.status(403).json({ message: "Access denied. Policy belongs to different company." });
      }

      await storage.deleteExpensePolicy(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense policy:", error);
      res.status(500).json({ message: "Failed to delete expense policy" });
    }
  });

  // Expense items routes
  app.get("/api/expense-items/:claimId", requireAuth, async (req: any, res) => {
    try {
      const items = await storage.getExpenseItems(req.params.claimId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching expense items:", error);
      res.status(500).json({ message: "Failed to fetch expense items" });
    }
  });

  app.post("/api/expense-items", requireAuth, async (req: any, res) => {
    try {
      const itemData = {
        ...req.body,
        amount: req.body.amount ? parseFloat(req.body.amount).toString() : '0',
      };
      const validatedData = insertExpenseItemSchema.parse(itemData);
      const item = await storage.createExpenseItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating expense item:", error);
      res.status(500).json({ message: "Failed to create expense item" });
    }
  });

  app.put("/api/expense-items/:id", requireAuth, async (req: any, res) => {
    try {
      const item = await storage.updateExpenseItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ message: "Expense item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating expense item:", error);
      res.status(500).json({ message: "Failed to update expense item" });
    }
  });

  app.delete("/api/expense-items/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteExpenseItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense item:", error);
      res.status(500).json({ message: "Failed to delete expense item" });
    }
  });

  // ========== PAYMENT MODULE ROUTES ==========

  // Payment Batches (Initiate Payments) Routes
  app.get("/api/payment-batches", requireAuth, async (req: any, res) => {
    try {
      const batches = await storage.getPaymentBatches();
      res.json(batches);
    } catch (error) {
      console.error("Error fetching payment batches:", error);
      res.status(500).json({ message: "Failed to fetch payment batches" });
    }
  });

  app.get("/api/payment-batches/:id", requireAuth, async (req: any, res) => {
    try {
      const batch = await storage.getPaymentBatch(req.params.id);
      if (!batch) {
        return res.status(404).json({ message: "Payment batch not found" });
      }
      res.json(batch);
    } catch (error) {
      console.error("Error fetching payment batch:", error);
      res.status(500).json({ message: "Failed to fetch payment batch" });
    }
  });

  app.post("/api/payment-batches", requireAuth, async (req: any, res) => {
    console.log("=== PAYMENT BATCH POST REQUEST ===");
    console.log("Raw request body:", JSON.stringify(req.body, null, 2));
    console.log("User claims:", req.user?.claims);
    
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      if (!userId) {
        console.error("No user ID found");
        return res.status(401).json({ message: "User ID not found" });
      }
      
      console.log("User ID:", userId);

      // Get user for company context
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Helper function to translate workflow level to legacy role for backward compatibility
      const translateWorkflowLevelToPaymentRole = (level: number): string => {
        const levelRoleMap: Record<number, string> = {
          1: 'manager',
          2: 'admin', 
          3: 'head',
          4: 'accountant'
        };
        return levelRoleMap[level] || `level_${level}`;
      };
      
      // Generate unique batch number
      const batchNumber = `BATCH-${Date.now()}`;
      
      // Transform form data to match schema
      const batchData: any = {
        batchNumber,
        totalAmount: parseFloat(req.body.totalAmount || '0').toString(),
        notes: req.body.description || "",
        paymentMethod: "bank_transfer",
        createdBy: userId,
      };

      // Initialize workflow if configured
      const workflowEngine = getWorkflowEngine(storage);
      const orgId = getOrgId(req) || user.companyId || '';
      
      const workflowContext: WorkflowContext = {
        processType: 'payment',
        submitterId: userId,
        companyId: orgId,
        amount: parseFloat(req.body.totalAmount || '0')
      };
      
      const workflowResult = await workflowEngine.initializeWorkflow(workflowContext);
      
      if (workflowResult.fallbackToLegacy) {
        // No workflows configured, use auto-approval (legacy behavior)
        batchData.status = 'approved';
        console.log('Payment batch: No workflow configured - auto-approving batch');
      } else {
        // Workflow configured, set status and level based on workflow result
        const roleBasedLevel = translateWorkflowLevelToPaymentRole(workflowResult.currentLevel);
        batchData.status = `pending_${roleBasedLevel}`;
        
        console.log(`Payment batch: Using workflow - Level ${workflowResult.currentLevel} -> ${roleBasedLevel}, Status: ${batchData.status}`);
      }
      
      console.log("Transformed batch data:", JSON.stringify(batchData, null, 2));
      
      // Check each required field
      console.log("Field check:");
      console.log("- batchNumber:", batchData.batchNumber);
      console.log("- totalAmount:", batchData.totalAmount);
      console.log("- paymentMethod:", batchData.paymentMethod);
      console.log("- createdBy:", batchData.createdBy);
      
      const validated = insertPaymentBatchSchema.parse(batchData);
      console.log("Validation successful!");
      
      const batch = await storage.createPaymentBatch(validated);
      res.status(201).json(batch);
    } catch (error) {
      console.error("=== PAYMENT BATCH ERROR ===");
      console.error("Full error:", error);
      if (error.issues) {
        console.error("Validation issues:", error.issues.map(issue => ({
          field: issue.path.join('.'),
          expected: issue.expected,
          received: issue.received,
          message: issue.message
        })));
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.issues 
        });
      }
      res.status(500).json({ message: "Failed to create payment batch" });
    }
  });

  app.put("/api/payment-batches/:id", requireAuth, async (req: any, res) => {
    try {
      const batch = await storage.updatePaymentBatch(req.params.id, req.body);
      if (!batch) {
        return res.status(404).json({ message: "Payment batch not found" });
      }
      res.json(batch);
    } catch (error) {
      console.error("Error updating payment batch:", error);
      res.status(500).json({ message: "Failed to update payment batch" });
    }
  });

  app.delete("/api/payment-batches/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deletePaymentBatch(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment batch:", error);
      res.status(500).json({ message: "Failed to delete payment batch" });
    }
  });

  // Payment Batch Items Routes
  app.get("/api/payment-batches/:batchId/items", requireAuth, async (req: any, res) => {
    try {
      const items = await storage.getPaymentBatchItems(req.params.batchId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching payment batch items:", error);
      res.status(500).json({ message: "Failed to fetch payment batch items" });
    }
  });

  app.post("/api/payment-batches/:batchId/items", requireAuth, async (req: any, res) => {
    try {
      const itemData = {
        ...req.body,
        batchId: req.params.batchId,
        amount: parseFloat(req.body.amount || '0').toString(),
      };
      const validated = insertPaymentBatchItemSchema.parse(itemData);
      
      const item = await storage.createPaymentBatchItem(validated);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating payment batch item:", error);
      res.status(500).json({ message: "Failed to create payment batch item" });
    }
  });

  app.put("/api/payment-batch-items/:id", requireAuth, async (req: any, res) => {
    try {
      const item = await storage.updatePaymentBatchItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ message: "Payment batch item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating payment batch item:", error);
      res.status(500).json({ message: "Failed to update payment batch item" });
    }
  });

  app.delete("/api/payment-batch-items/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deletePaymentBatchItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment batch item:", error);
      res.status(500).json({ message: "Failed to delete payment batch item" });
    }
  });

  // Release Bills Route (Update payment batch status)
  app.post("/api/payment-batches/:id/release", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const batch = await storage.releaseBills(req.params.id, userId);
      if (!batch) {
        return res.status(404).json({ message: "Payment batch not found" });
      }
      res.json(batch);
    } catch (error) {
      console.error("Error releasing bills:", error);
      res.status(500).json({ message: "Failed to release bills" });
    }
  });

  // Payment approval routes for submitted payments
  app.get("/api/payments/pending-approval", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      if (!user?.role) {
        return res.status(403).json({ message: "User role not found" });
      }

      // Get payment batches with status "initiated" (pending approval)
      const pendingBatches = await storage.getPaymentBatchesForApproval(user.role);
      
      // Also get individual claims with payment_submitted status for backwards compatibility
      const pendingClaims = await storage.getExpenseClaims({ status: "payment_submitted" });
      
      res.json({
        paymentBatches: pendingBatches,
        individualClaims: pendingClaims
      });
    } catch (error) {
      console.error("Error fetching pending payment approvals:", error);
      res.status(500).json({ message: "Failed to fetch pending payment approvals" });
    }
  });

  app.post("/api/payments/:batchId/approve", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const { batchId } = req.params;
      const { action, remarks } = req.body;
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'reject'" });
      }

      // Process payment batch approval
      const result = await storage.processPaymentBatchApproval(batchId, userId, action, remarks);
      
      // If approved and reached final approval, update associated claims to "paid"
      if (action === 'approve' && result.batch.status === 'approved') {
        // Get all claims in this batch and mark them as paid
        const batchItems = await storage.getPaymentBatchItems(batchId);
        for (const item of batchItems) {
          if (item.expenseClaimId) {
            await storage.updateExpenseClaimStatus(item.expenseClaimId, "paid", userId);
          }
        }
        
        // Update payment batch to released status
        await storage.updatePaymentBatch(batchId, {
          status: "released",
          releasedBy: userId,
          releasedAt: new Date()
        });
      } else if (action === 'reject') {
        // If rejected, revert claims back to approved status
        const batchItems = await storage.getPaymentBatchItems(batchId);
        for (const item of batchItems) {
          if (item.expenseClaimId) {
            await storage.updateExpenseClaimStatus(item.expenseClaimId, "approved", userId);
          }
        }
      }
      
      res.json({
        message: `Payment ${action}d successfully`,
        batch: result.batch,
        nextApprover: result.nextApprover,
        finalStatus: action === 'approve' && result.batch.status === 'approved' ? 'ready_for_release' : result.batch.status
      });
    } catch (error) {
      console.error("Error processing payment approval:", error);
      res.status(500).json({ message: "Failed to process payment approval" });
    }
  });

  // Payment batch approval workflow routes
  app.get("/api/payment-batches/pending-approval", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      if (!user?.role) {
        return res.status(403).json({ message: "User role not found" });
      }

      // Extract user roles and get batches for approval
      const userRoles = user.role.split(',');
      let pendingBatches: any[] = [];
      
      for (const role of userRoles) {
        const batches = await storage.getPaymentBatchesForApproval(role.trim());
        pendingBatches = pendingBatches.concat(batches);
      }

      // Remove duplicates and sort by creation date
      const uniqueBatches = pendingBatches.filter((batch, index, self) => 
        index === self.findIndex(b => b.id === batch.id)
      );

      res.json(uniqueBatches);
    } catch (error) {
      console.error("Error fetching payment batches for approval:", error);
      res.status(500).json({ message: "Failed to fetch payment batches for approval" });
    }
  });

  app.post("/api/payment-batches/:id/approve", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const { action, remarks } = req.body;
      
      if (!['approve', 'reject', 'return'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'approve', 'reject', or 'return'" });
      }

      const result = await storage.processPaymentBatchApproval(req.params.id, userId, action, remarks);
      
      res.json({
        message: `Payment batch ${action}d successfully`,
        batch: result.batch,
        nextApprover: result.nextApprover
      });
    } catch (error) {
      console.error("Error processing payment batch approval:", error);
      res.status(500).json({ message: "Failed to process payment batch approval" });
    }
  });

  app.get("/api/payment-batches/:id/approval-history", requireAuth, async (req: any, res) => {
    try {
      const history = await storage.getPaymentBatchApprovalHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching payment batch approval history:", error);
      res.status(500).json({ message: "Failed to fetch payment batch approval history" });
    }
  });

  app.get("/api/payment-batches/approved", requireAuth, async (req: any, res) => {
    try {
      const approvedBatches = await storage.getApprovedPaymentBatches();
      res.json(approvedBatches);
    } catch (error) {
      console.error("Error fetching approved payment batches:", error);
      res.status(500).json({ message: "Failed to fetch approved payment batches" });
    }
  });

  // Card Statements Routes
  app.get("/api/card-statements", requireAuth, async (req: any, res) => {
    try {
      const statements = await storage.getCardStatements();
      res.json(statements);
    } catch (error) {
      console.error("Error fetching card statements:", error);
      res.status(500).json({ message: "Failed to fetch card statements" });
    }
  });

  app.get("/api/card-statements/:id", requireAuth, async (req: any, res) => {
    try {
      const statement = await storage.getCardStatement(req.params.id);
      if (!statement) {
        return res.status(404).json({ message: "Card statement not found" });
      }
      res.json(statement);
    } catch (error) {
      console.error("Error fetching card statement:", error);
      res.status(500).json({ message: "Failed to fetch card statement" });
    }
  });

  app.post("/api/card-statements", requireAuth, upload.single('statementFile'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
      
      const statementData = {
        ...req.body,
        uploadedBy: userId,
        statementFile: fileUrl,
        closingBalance: req.body.closingBalance ? parseFloat(req.body.closingBalance).toString() : '0',
        totalSpent: req.body.totalSpent ? parseFloat(req.body.totalSpent).toString() : '0',
        openingBalance: req.body.openingBalance ? parseFloat(req.body.openingBalance).toString() : '0',
      };
      const validated = insertCardStatementSchema.parse(statementData);
      
      const statement = await storage.createCardStatement(validated);
      res.status(201).json(statement);
    } catch (error) {
      console.error("Error creating card statement:", error);
      res.status(500).json({ message: "Failed to create card statement" });
    }
  });

  app.put("/api/card-statements/:id", requireAuth, async (req: any, res) => {
    try {
      const statement = await storage.updateCardStatement(req.params.id, req.body);
      if (!statement) {
        return res.status(404).json({ message: "Card statement not found" });
      }
      res.json(statement);
    } catch (error) {
      console.error("Error updating card statement:", error);
      res.status(500).json({ message: "Failed to update card statement" });
    }
  });

  app.delete("/api/card-statements/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteCardStatement(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting card statement:", error);
      res.status(500).json({ message: "Failed to delete card statement" });
    }
  });

  // Card Transactions Routes
  app.get("/api/card-statements/:statementId/transactions", requireAuth, async (req: any, res) => {
    try {
      const transactions = await storage.getCardTransactions(req.params.statementId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching card transactions:", error);
      res.status(500).json({ message: "Failed to fetch card transactions" });
    }
  });

  app.post("/api/card-statements/:statementId/transactions", requireAuth, async (req: any, res) => {
    try {
      const transactionData = {
        ...req.body,
        statementId: req.params.statementId,
        amount: req.body.amount ? parseFloat(req.body.amount).toString() : '0',
      };
      const validated = insertCardTransactionSchema.parse(transactionData);
      
      const transaction = await storage.createCardTransaction(validated);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating card transaction:", error);
      res.status(500).json({ message: "Failed to create card transaction" });
    }
  });

  app.put("/api/card-transactions/:id", requireAuth, async (req: any, res) => {
    try {
      const transaction = await storage.updateCardTransaction(req.params.id, req.body);
      if (!transaction) {
        return res.status(404).json({ message: "Card transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error updating card transaction:", error);
      res.status(500).json({ message: "Failed to update card transaction" });
    }
  });

  app.delete("/api/card-transactions/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteCardTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting card transaction:", error);
      res.status(500).json({ message: "Failed to delete card transaction" });
    }
  });

  // Card Payments Routes
  app.get("/api/card-payments", requireAuth, async (req: any, res) => {
    try {
      const payments = await storage.getCardPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching card payments:", error);
      res.status(500).json({ message: "Failed to fetch card payments" });
    }
  });

  app.get("/api/card-statements/:statementId/payments", requireAuth, async (req: any, res) => {
    try {
      const payments = await storage.getCardPaymentsByStatement(req.params.statementId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching card payments:", error);
      res.status(500).json({ message: "Failed to fetch card payments for statement" });
    }
  });

  app.post("/api/card-payments", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const paymentData = {
        ...req.body,
        processedBy: userId,
        paymentAmount: req.body.paymentAmount ? parseFloat(req.body.paymentAmount).toString() : '0',
      };
      const validated = insertCardPaymentSchema.parse(paymentData);
      
      const payment = await storage.createCardPayment(validated);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating card payment:", error);
      res.status(500).json({ message: "Failed to create card payment" });
    }
  });

  app.put("/api/card-payments/:id", requireAuth, async (req: any, res) => {
    try {
      const payment = await storage.updateCardPayment(req.params.id, req.body);
      if (!payment) {
        return res.status(404).json({ message: "Card payment not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error updating card payment:", error);
      res.status(500).json({ message: "Failed to update card payment" });
    }
  });

  app.delete("/api/card-payments/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteCardPayment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting card payment:", error);
      res.status(500).json({ message: "Failed to delete card payment" });
    }
  });

  // Bank Advice Routes
  app.get("/api/bank-advice", requireAuth, async (req: any, res) => {
    try {
      const { type } = req.query; // employee or vendor
      const advice = await storage.getBankAdvice(type);
      res.json(advice);
    } catch (error) {
      console.error("Error fetching bank advice:", error);
      res.status(500).json({ message: "Failed to fetch bank advice" });
    }
  });

  app.get("/api/bank-advice/:id", requireAuth, async (req: any, res) => {
    try {
      const advice = await storage.getBankAdviceById(req.params.id);
      if (!advice) {
        return res.status(404).json({ message: "Bank advice not found" });
      }
      res.json(advice);
    } catch (error) {
      console.error("Error fetching bank advice:", error);
      res.status(500).json({ message: "Failed to fetch bank advice" });
    }
  });

  app.post("/api/bank-advice", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const adviceData = {
        ...req.body,
        generatedBy: userId,
        totalAmount: req.body.totalAmount ? parseFloat(req.body.totalAmount).toString() : '0',
      };
      const validated = insertBankAdviceSchema.parse(adviceData);
      
      const advice = await storage.createBankAdvice(validated);
      res.status(201).json(advice);
    } catch (error) {
      console.error("Error creating bank advice:", error);
      res.status(500).json({ message: "Failed to create bank advice" });
    }
  });

  app.put("/api/bank-advice/:id", requireAuth, async (req: any, res) => {
    try {
      const advice = await storage.updateBankAdvice(req.params.id, req.body);
      if (!advice) {
        return res.status(404).json({ message: "Bank advice not found" });
      }
      res.json(advice);
    } catch (error) {
      console.error("Error updating bank advice:", error);
      res.status(500).json({ message: "Failed to update bank advice" });
    }
  });

  app.delete("/api/bank-advice/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteBankAdvice(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bank advice:", error);
      res.status(500).json({ message: "Failed to delete bank advice" });
    }
  });

  // Bank Advice Items Routes
  app.get("/api/bank-advice/:adviceId/items", requireAuth, async (req: any, res) => {
    try {
      const items = await storage.getBankAdviceItems(req.params.adviceId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching bank advice items:", error);
      res.status(500).json({ message: "Failed to fetch bank advice items" });
    }
  });

  app.post("/api/bank-advice/:adviceId/items", requireAuth, async (req: any, res) => {
    try {
      const itemData = {
        ...req.body,
        adviceId: req.params.adviceId,
        amount: req.body.amount ? parseFloat(req.body.amount).toString() : '0',
      };
      const validated = insertBankAdviceItemSchema.parse(itemData);
      
      const item = await storage.createBankAdviceItem(validated);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating bank advice item:", error);
      res.status(500).json({ message: "Failed to create bank advice item" });
    }
  });

  app.put("/api/bank-advice-items/:id", requireAuth, async (req: any, res) => {
    try {
      const item = await storage.updateBankAdviceItem(req.params.id, req.body);
      if (!item) {
        return res.status(404).json({ message: "Bank advice item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error updating bank advice item:", error);
      res.status(500).json({ message: "Failed to update bank advice item" });
    }
  });

  app.delete("/api/bank-advice-items/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteBankAdviceItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bank advice item:", error);
      res.status(500).json({ message: "Failed to delete bank advice item" });
    }
  });

  // Generate Employee Bank Advice Report
  app.post("/api/bank-advice/employee/generate", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const { paymentBatchId, paymentDate } = req.body;
      
      const advice = await storage.generateEmployeeBankAdvice(paymentBatchId, paymentDate, userId);
      res.status(201).json(advice);
    } catch (error) {
      console.error("Error generating employee bank advice:", error);
      res.status(500).json({ message: "Failed to generate employee bank advice" });
    }
  });

  // Generate Vendor Bank Advice Report
  app.post("/api/bank-advice/vendor/generate", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const { paymentBatchId, paymentDate } = req.body;
      
      const advice = await storage.generateVendorBankAdvice(paymentBatchId, paymentDate, userId);
      res.status(201).json(advice);
    } catch (error) {
      console.error("Error generating vendor bank advice:", error);
      res.status(500).json({ message: "Failed to generate vendor bank advice" });
    }
  });

  // Bank routes
  app.get("/api/banks", requireAuth, async (req, res) => {
    try {
      const banks = await storage.getBanks();
      res.json(banks);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ message: "Failed to fetch banks" });
    }
  });

  app.post("/api/banks", requireAuth, async (req, res) => {
    try {
      const validated = insertBankSchema.parse(req.body);
      const bank = await storage.createBank(validated);
      res.status(201).json(bank);
    } catch (error) {
      console.error("Error creating bank:", error);
      res.status(500).json({ message: "Failed to create bank" });
    }
  });

  app.put("/api/banks/:id", requireAuth, async (req, res) => {
    try {
      const bank = await storage.updateBank(req.params.id, req.body);
      if (!bank) {
        return res.status(404).json({ message: "Bank not found" });
      }
      res.json(bank);
    } catch (error) {
      console.error("Error updating bank:", error);
      res.status(500).json({ message: "Failed to update bank" });
    }
  });

  app.delete("/api/banks/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteBank(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bank:", error);
      res.status(500).json({ message: "Failed to delete bank" });
    }
  });

  // Petty Cash Receipt routes
  app.get("/api/petty-cash-receipts", requireAuth, async (req, res) => {
    try {
      const receipts = await storage.getPettyCashReceipts();
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching petty cash receipts:", error);
      res.status(500).json({ message: "Failed to fetch petty cash receipts" });
    }
  });

  app.get("/api/petty-cash-receipts/:id", requireAuth, async (req, res) => {
    try {
      const receipt = await storage.getPettyCashReceipt(req.params.id);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      console.error("Error fetching petty cash receipt:", error);
      res.status(500).json({ message: "Failed to fetch petty cash receipt" });
    }
  });

  app.post("/api/petty-cash-receipts", requireAuth, upload.single("document"), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      const receiptData = {
        ...req.body,
        recordedBy: userId,
        amountReceived: parseFloat(req.body.amountReceived).toString(),
        remainingAdvance: req.body.remainingAdvance ? parseFloat(req.body.remainingAdvance).toString() : '0',
      };

      // Handle file upload
      if (req.file) {
        receiptData.documentUrl = `/uploads/${req.file.filename}`;
        receiptData.documentFileName = req.file.originalname;
        receiptData.documentFileSize = req.file.size;
      }

      const validated = insertPettyCashReceiptSchema.parse(receiptData);
      const receipt = await storage.createPettyCashReceipt(validated);
      res.status(201).json(receipt);
    } catch (error) {
      console.error("Error creating petty cash receipt:", error);
      if (error.issues) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.issues 
        });
      }
      res.status(500).json({ message: "Failed to create petty cash receipt" });
    }
  });

  app.put("/api/petty-cash-receipts/:id", requireAuth, upload.single("document"), async (req: any, res) => {
    try {
      const receiptData = {
        ...req.body,
        amountReceived: parseFloat(req.body.amountReceived).toString(),
        remainingAdvance: req.body.remainingAdvance ? parseFloat(req.body.remainingAdvance).toString() : '0',
      };

      // Handle file upload
      if (req.file) {
        receiptData.documentUrl = `/uploads/${req.file.filename}`;
        receiptData.documentFileName = req.file.originalname;
        receiptData.documentFileSize = req.file.size;
      }

      const receipt = await storage.updatePettyCashReceipt(req.params.id, receiptData);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      console.error("Error updating petty cash receipt:", error);
      res.status(500).json({ message: "Failed to update petty cash receipt" });
    }
  });

  app.delete("/api/petty-cash-receipts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deletePettyCashReceipt(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting petty cash receipt:", error);
      res.status(500).json({ message: "Failed to delete petty cash receipt" });
    }
  });

  // Payment Processing API
  app.post("/api/payments/process", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const { action, paymentOption, transactionMode, roundOff, totalAmount, claims } = req.body;

      // Validate required fields
      if (!action || !claims || claims.length === 0) {
        return res.status(400).json({ message: "Missing required fields: action and claims are required" });
      }

      // Validate additional fields for pay action
      if (action === 'pay' && (!paymentOption || !req.body.utrNumber)) {
        return res.status(400).json({ message: "Missing required fields for payment: paymentOption and utrNumber are required" });
      }

      // Process based on action type
      switch (action) {
        case "pay":
          // Create payment batch for tracking (pending approval)
          const batch = await storage.createPaymentBatch({
            batchNumber: `PAY-${Date.now()}`,
            totalAmount: roundOff ? Math.round(totalAmount).toString() : totalAmount.toString(),
            currency: "INR",
            status: "initiated", // Start with initiated status for approval workflow
            currentApprovalLevel: "manager", // Set to manager for first approval level
            createdBy: userId,
            paymentMethod: paymentOption === "bank" ? "bank_transfer" : "cash",
            bankDetails: paymentOption === "bank" ? JSON.stringify({ type: "bank_transfer" }) : null,
            notes: `${transactionMode === "club" ? "Clubbed" : "Individual"} payment processing`,
            title: `Payment Batch ${claims.length} Claims`,
            description: `Payment processing for ${claims.length} claims via ${paymentOption}`,
            paymentType: transactionMode === "club" ? "bulk" : "individual",
            totalBills: claims.length,
          });

          // Process each claim
          for (const claim of claims) {
            // Create payment batch item
            await storage.createPaymentBatchItem({
              batchId: batch.id,
              expenseClaimId: claim.type === "claim" ? claim.id : null,
              directExpenseId: claim.type === "expense" ? claim.id : null,
              amount: claim.payingAmount.toString(),
              payeeType: claim.type === "claim" ? "employee" : "vendor",
              payeeName: "Payee", // This would need to be fetched from the actual claim
              bankAccount: null,
              ifscCode: null,
            });

            // Update claim status to payment_submitted (pending approval)
            if (claim.type === "claim") {
              // Update expense claim status to payment_submitted instead of paid
              await storage.updateExpenseClaimStatus(claim.id, "payment_submitted", userId);
              
              // Store payment details in the claim for later processing
              await storage.updateExpenseClaim(claim.id, {
                utrNumber: claim.utrNumber || null,
                paymentDate: claim.paymentDate ? new Date(claim.paymentDate) : new Date(),
                processedBy: userId,
                processedAt: new Date(),
              });
            } else if (claim.type === "expense") {
              // Update direct expense status to paid for payment processing
              await storage.updateDirectExpense(claim.id, {
                status: "paid"
              });
            }
          }

          res.json({ 
            message: "Payment submitted for approval successfully", 
            batchId: batch.id,
            totalAmount: roundOff ? Math.round(totalAmount) : totalAmount,
            claimsProcessed: claims.length,
            status: "pending_approval",
            nextStep: "Waiting for manager approval"
          });
          break;

        case "transfer":
          // Handle bill transfer logic
          res.json({ 
            message: `${claims.length} bills transferred successfully`,
            action: "transfer"
          });
          break;

        case "hold":
          // Handle bill hold logic
          res.json({ 
            message: `${claims.length} bills held successfully`,
            action: "hold"
          });
          break;

        default:
          return res.status(400).json({ message: "Invalid payment action" });
      }

    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // ========== USER REPORTS ROUTES ==========
  
  // Get comprehensive user reports
  app.get("/api/reports/user", requireAuth, async (req: any, res) => {
    try {
      // Remove role restrictions - show all data for all users
      const reports = await storage.getUserReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching user reports:", error);
      res.status(500).json({ message: "Failed to fetch user reports" });
    }
  });

  // ========== PETTY CASH MANAGEMENT ROUTES ==========

  // Cashbox routes
  // Party Master routes
  app.get("/api/parties", requireAuth, async (req: any, res) => {
    try {
      const parties = await storage.getParties();
      res.json(parties);
    } catch (error) {
      console.error("Error fetching parties:", error);
      res.status(500).json({ message: "Failed to fetch parties" });
    }
  });

  app.get("/api/parties/:id", requireAuth, async (req: any, res) => {
    try {
      const party = await storage.getParty(req.params.id);
      if (!party) {
        return res.status(404).json({ message: "Party not found" });
      }
      res.json(party);
    } catch (error) {
      console.error("Error fetching party:", error);
      res.status(500).json({ message: "Failed to fetch party" });
    }
  });

  app.post("/api/parties", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertPartySchema.parse(req.body);
      const party = await storage.createParty(validatedData);
      res.status(201).json(party);
    } catch (error) {
      console.error("Error creating party:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create party" });
      }
    }
  });

  app.put("/api/parties/:id", requireAuth, async (req: any, res) => {
    try {
      const updates = req.body;
      const updated = await storage.updateParty(req.params.id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Party not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating party:", error);
      res.status(500).json({ message: "Failed to update party" });
    }
  });

  app.delete("/api/parties/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteParty(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting party:", error);
      res.status(500).json({ message: "Failed to delete party" });
    }
  });

  // ========== VENDOR MANAGEMENT ROUTES ==========

  // Vendor routes
  app.get("/api/vendors", requireAuth, async (req: any, res) => {
    try {
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.searchTerm) filters.searchTerm = req.query.searchTerm;
      
      const vendors = await storage.getVendors(filters);
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.get("/api/vendors/active", requireAuth, async (req: any, res) => {
    try {
      const vendors = await storage.getActiveVendors();
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching active vendors:", error);
      res.status(500).json({ message: "Failed to fetch active vendors" });
    }
  });

  app.get("/api/vendors/:id", requireAuth, async (req: any, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.post("/api/vendors", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const orgId = getOrgId(req);
      const jwtRole = getUserRole(req);
      if (!orgId || !jwtRole) {
        return res.status(401).json({ message: "JWT Authentication required - missing org or role" });
      }
      
      // SECURITY: Only get existing user, never auto-create with admin privileges
      let user = await storage.getUser(userId);
      if (!user) {
        console.log(`❌ Unauthorized user ${userId} attempted vendor creation - no user record found`);
        return res.status(401).json({ message: "Unauthorized: User not found in system" });
      }
      
      // Compliance checks for duplicate vendors
      if (req.body.gstin) {
        const allVendors = await storage.getVendors({});
        const existingVendor = allVendors.find((v: any) => v.gstin === req.body.gstin);
        if (existingVendor) {
          return res.status(400).json({ message: "A vendor with this GSTIN already exists" });
        }
      }

      if (req.body.pan) {
        const allVendors = await storage.getVendors({});
        const existingVendor = allVendors.find((v: any) => v.pan === req.body.pan);
        if (existingVendor) {
          return res.status(400).json({ message: "A vendor with this PAN already exists" });
        }
      }

      // Validate GSTIN format (basic check)
      if (req.body.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(req.body.gstin)) {
        return res.status(400).json({ message: "Invalid GSTIN format. Please enter a valid 15-character GSTIN." });
      }

      // Validate PAN format (basic check) - only if PAN is provided and not empty
      if (req.body.pan && req.body.pan !== "Not provided" && req.body.pan.trim() !== "" && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(req.body.pan)) {
        return res.status(400).json({ message: "Invalid PAN format. Please enter a valid 10-character PAN." });
      }

      // WORKFLOW INTEGRATION: Check if vendor creation should go through workflow approval
      const workflowEngine = getWorkflowEngine(storage);
      const hasWorkflows = await workflowEngine.hasWorkflowForProcess('vendor', orgId);
      
      if (hasWorkflows) {
        // Create vendor onboarding request for workflow approval instead of direct vendor creation
        console.log('🏭 Creating vendor onboarding request through workflow system');
        
        const onboardingRequestData = {
          requestedBy: userId,
          requestType: 'new_vendor' as const,
          companyName: req.body.companyName,
          contactPerson: req.body.contactPerson,
          email: req.body.email,
          phone: req.body.phone,
          address: req.body.address,
          gstin: req.body.gstin,
          pan: req.body.pan,
          bankName: req.body.bankName,
          accountNumber: req.body.accountNumber,
          ifscCode: req.body.ifscCode,
          accountHolderName: req.body.accountHolderName,
          status: 'pending' as const,
          currentApprovalLevel: '1', // Start at level 1 (admin approval)
          
          // Handle TDS and date fields
          tdsSection: req.body.tdsSection,
          tdsRate: req.body.tdsRate,
          applyReducedTdsRates: req.body.applyReducedTdsRates === true || req.body.applyReducedTdsRates === 'true',
          tdsRateFromDate: req.body.applyReducedTdsRates && req.body.tdsRateFromDate 
            ? new Date(req.body.tdsRateFromDate) 
            : new Date('1900-01-01'),
          tdsRateToDate: req.body.applyReducedTdsRates && req.body.tdsRateToDate 
            ? new Date(req.body.tdsRateToDate) 
            : new Date('1900-01-01'),
          reducedTdsRate: req.body.reducedTdsRate,
          
          // Additional vendor details
          paymentTerms: req.body.paymentTerms,
          creditLimit: req.body.creditLimit,
          contractingCategory: req.body.contractingCategory,
          companyType: req.body.companyType,
          incorporationDate: req.body.incorporationDate ? new Date(req.body.incorporationDate) : undefined,
          businessNature: req.body.businessNature,
        };
        
        // Create the onboarding request
        const onboardingRequest = await storage.createVendorOnboardingRequest(onboardingRequestData);
        
        // Initialize workflow for this request
        const context = {
          processType: 'vendor' as const,
          amount: parseFloat(req.body.creditLimit || '0'),
          submitterId: userId,
          companyId: orgId
        };
        
        const workflowResult = await workflowEngine.initializeWorkflow(context);
        
        if (!workflowResult.fallbackToLegacy && workflowResult.workflowId) {
          // Update request with workflow information
          await storage.updateVendorOnboardingRequest(onboardingRequest.id, {
            workflowId: workflowResult.workflowId,
            currentApprovalLevel: workflowResult.currentLevel.toString(),
            pendingWith: workflowResult.requiredApprovers[0] || undefined
          });
          
          console.log(`✅ Vendor onboarding request created with workflow ${workflowResult.workflowId} at level ${workflowResult.currentLevel}`);
        }
        
        return res.status(201).json({
          message: "Vendor onboarding request submitted for approval",
          onboardingRequest: {
            ...onboardingRequest,
            workflowId: workflowResult.workflowId,
            currentApprovalLevel: workflowResult.currentLevel.toString()
          },
          status: 'pending_approval'
        });
      }

      // LEGACY: Direct vendor creation if no workflows configured
      console.log('📝 Creating vendor directly (no workflow configured)');
      
      // Convert date strings to Date objects for timestamp fields
      const bodyWithConvertedDates = {
        ...req.body,
        createdBy: userId,
      };

      // Handle TDS date fields based on whether "Apply reduced TDS rates" is selected
      // If not selected, set to DateTime.Min value; if selected, convert string dates to Date objects
      if (bodyWithConvertedDates.applyReducedTdsRates === true || bodyWithConvertedDates.applyReducedTdsRates === 'true') {
        // Apply reduced TDS rates is selected - use provided dates
        if (bodyWithConvertedDates.tdsRateFromDate && bodyWithConvertedDates.tdsRateFromDate !== '') {
          bodyWithConvertedDates.tdsRateFromDate = new Date(bodyWithConvertedDates.tdsRateFromDate);
        } else {
          bodyWithConvertedDates.tdsRateFromDate = new Date('1900-01-01'); // DateTime.Min equivalent
        }

        if (bodyWithConvertedDates.tdsRateToDate && bodyWithConvertedDates.tdsRateToDate !== '') {
          bodyWithConvertedDates.tdsRateToDate = new Date(bodyWithConvertedDates.tdsRateToDate);
        } else {
          bodyWithConvertedDates.tdsRateToDate = new Date('1900-01-01'); // DateTime.Min equivalent
        }
      } else {
        // Apply reduced TDS rates is not selected - set to DateTime.Min value
        bodyWithConvertedDates.tdsRateFromDate = new Date('1900-01-01'); // DateTime.Min equivalent
        bodyWithConvertedDates.tdsRateToDate = new Date('1900-01-01'); // DateTime.Min equivalent
      }

      const validatedData = insertVendorSchema.parse(bodyWithConvertedDates);
      const vendor = await storage.createVendor(validatedData);
      res.status(201).json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create vendor" });
      }
    }
  });

  app.put("/api/vendors/:id", requireAuth, async (req: any, res) => {
    try {
      const updates = req.body;
      const updated = await storage.updateVendor(req.params.id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.delete("/api/vendors/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteVendor(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  });

  // Vendor payment summary and reconciliation
  app.get("/api/vendors/:id/payment-summary", requireAuth, async (req: any, res) => {
    try {
      const summary = await storage.getVendorPaymentSummary(req.params.id);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching vendor payment summary:", error);
      res.status(500).json({ message: "Failed to fetch vendor payment summary" });
    }
  });

  app.get("/api/vendors/:id/claims-and-invoices", requireAuth, async (req: any, res) => {
    try {
      const data = await storage.getVendorClaimsAndInvoices(req.params.id);
      res.json(data);
    } catch (error) {
      console.error("Error fetching vendor claims and invoices:", error);
      res.status(500).json({ message: "Failed to fetch vendor claims and invoices" });
    }
  });

  // Vendor Onboarding Request routes
  app.get("/api/vendor-onboarding-requests", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      
      // If user is employee, only show their own requests
      if (user?.role === "employee") {
        filters.requestedBy = userId;
      } else if (req.query.requestedBy) {
        filters.requestedBy = req.query.requestedBy;
      }
      
      const requests = await storage.getVendorOnboardingRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching vendor onboarding requests:", error);
      res.status(500).json({ message: "Failed to fetch vendor onboarding requests" });
    }
  });

  app.get("/api/vendor-onboarding-requests/for-approval", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "admin" && user.role !== "accountant")) {
        return res.status(403).json({ message: "Unauthorized to view approval requests" });
      }
      
      const requests = await storage.getVendorOnboardingRequestsForApproval(user.role);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching vendor onboarding requests for approval:", error);
      res.status(500).json({ message: "Failed to fetch vendor onboarding requests for approval" });
    }
  });

  app.get("/api/vendor-onboarding-requests/:id", requireAuth, async (req: any, res) => {
    try {
      const request = await storage.getVendorOnboardingRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Vendor onboarding request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching vendor onboarding request:", error);
      res.status(500).json({ message: "Failed to fetch vendor onboarding request" });
    }
  });

  app.post("/api/vendor-onboarding-requests", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      // Get user for company context first
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Fetch user profile data from external API with authentication context
      const jwtToken = req.headers.authorization?.replace('Bearer ', '');
      const orgId = getOrgId(req) || user.companyId || '';
      
      const userProfile = await fetchUserProfile({
        userId,
        jwtToken,
        orgId
      });

      const validatedData = insertVendorOnboardingRequestSchema.parse({
        ...req.body,
        requestedBy: userId,
        // Add employee profile data from external API
        employerName: userProfile.employerName,
        employeeNumber: userProfile.employeeNumber,
        employeeEmail: userProfile.employeeEmail,
      });

      // Helper function to translate workflow level to vendor approval roles
      const translateWorkflowLevelToVendorRole = (level: number): string => {
        const levelRoleMap: Record<number, string> = {
          1: 'admin',     // First level approval
          2: 'finance',   // Finance team approval  
          3: 'head',      // Department head approval
          4: 'accountant' // Final accounting approval
        };
        return levelRoleMap[level] || 'employee';
      };

      // Initialize workflow if configured
      const workflowEngine = getWorkflowEngine(storage);
      
      const workflowContext: WorkflowContext = {
        processType: 'vendor',
        submitterId: userId,
        companyId: orgId,
        vendorId: undefined // New vendor onboarding doesn't have vendorId yet
      };
      
      const workflowResult = await workflowEngine.initializeWorkflow(workflowContext);
      
      if (workflowResult.fallbackToLegacy) {
        // No workflows configured, use legacy defaults
        validatedData.status = 'pending';
        validatedData.currentApprovalLevel = 'admin';
      } else {
        // Workflow configured, set status and level based on workflow result
        const roleBasedLevel = translateWorkflowLevelToVendorRole(workflowResult.currentLevel);
        validatedData.status = `pending_${roleBasedLevel}`;
        validatedData.currentApprovalLevel = roleBasedLevel;
        
        if (workflowResult.requiredApprovers.length > 0) {
          validatedData.pendingWith = workflowResult.requiredApprovers[0];
        }
        
        console.log(`Vendor onboarding: Using workflow - Level ${workflowResult.currentLevel} -> ${roleBasedLevel}, Status: ${validatedData.status}`);
      }

      const request = await storage.createVendorOnboardingRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating vendor onboarding request:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create vendor onboarding request" });
      }
    }
  });

  app.put("/api/vendor-onboarding-requests/:id", requireAuth, async (req: any, res) => {
    try {
      const updates = req.body;
      const updated = await storage.updateVendorOnboardingRequest(req.params.id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Vendor onboarding request not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating vendor onboarding request:", error);
      res.status(500).json({ message: "Failed to update vendor onboarding request" });
    }
  });

  app.delete("/api/vendor-onboarding-requests/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteVendorOnboardingRequest(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor onboarding request:", error);
      res.status(500).json({ message: "Failed to delete vendor onboarding request" });
    }
  });

  // Vendor onboarding approval workflow
  app.post("/api/vendor-onboarding-requests/:id/approve", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "admin" && user.role !== "accountant")) {
        return res.status(403).json({ message: "Unauthorized to approve requests" });
      }
      
      const { action, remarks } = req.body;
      if (!action || !["approve", "reject"].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'reject'" });
      }
      
      const result = await storage.processVendorOnboardingApproval(req.params.id, userId, action, remarks);
      res.json(result);
    } catch (error) {
      console.error("Error processing vendor onboarding approval:", error);
      res.status(500).json({ message: "Failed to process vendor onboarding approval" });
    }
  });

  // Vendor Document routes
  app.get("/api/vendor-documents", requireAuth, async (req: any, res) => {
    try {
      const { onboardingRequestId, vendorId } = req.query;
      const documents = await storage.getVendorDocuments(
        onboardingRequestId as string,
        vendorId as string
      );
      res.json(documents);
    } catch (error) {
      console.error("Error fetching vendor documents:", error);
      res.status(500).json({ message: "Failed to fetch vendor documents" });
    }
  });

  app.get("/api/vendor-documents/:id", requireAuth, async (req: any, res) => {
    try {
      const document = await storage.getVendorDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Vendor document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching vendor document:", error);
      res.status(500).json({ message: "Failed to fetch vendor document" });
    }
  });

  app.post("/api/vendor-documents", requireAuth, upload.single("document"), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No document file provided" });
      }
      
      const validatedData = insertVendorDocumentSchema.parse({
        ...req.body,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: userId,
      });
      
      const document = await storage.createVendorDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating vendor document:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create vendor document" });
      }
    }
  });

  app.put("/api/vendor-documents/:id/verify", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "admin" && user.role !== "accountant")) {
        return res.status(403).json({ message: "Unauthorized to verify documents" });
      }
      
      const verified = await storage.verifyVendorDocument(req.params.id, userId);
      res.json(verified);
    } catch (error) {
      console.error("Error verifying vendor document:", error);
      res.status(500).json({ message: "Failed to verify vendor document" });
    }
  });

  app.delete("/api/vendor-documents/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteVendorDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor document:", error);
      res.status(500).json({ message: "Failed to delete vendor document" });
    }
  });

  // Vendor Payment History routes
  app.get("/api/vendor-payment-history", requireAuth, async (req: any, res) => {
    try {
      const { vendorId, startDate, endDate } = req.query;
      const filters: any = {};
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
      const history = await storage.getVendorPaymentHistory(vendorId as string, filters);
      res.json(history);
    } catch (error) {
      console.error("Error fetching vendor payment history:", error);
      res.status(500).json({ message: "Failed to fetch vendor payment history" });
    }
  });

  app.get("/api/vendor-payment-history/:id", requireAuth, async (req: any, res) => {
    try {
      const payment = await storage.getVendorPaymentHistoryItem(req.params.id);
      if (!payment) {
        return res.status(404).json({ message: "Vendor payment history item not found" });
      }
      res.json(payment);
    } catch (error) {
      console.error("Error fetching vendor payment history item:", error);
      res.status(500).json({ message: "Failed to fetch vendor payment history item" });
    }
  });

  app.post("/api/vendor-payment-history", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const validatedData = insertVendorPaymentHistorySchema.parse({
        ...req.body,
        processedBy: userId,
      });
      const payment = await storage.createVendorPaymentHistory(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating vendor payment history:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create vendor payment history" });
      }
    }
  });

  // ========== VENDOR REPORTS AND ANALYTICS ROUTES ==========

  // Vendor expense reports with period filtering
  app.get("/api/vendor-reports/expense-reports", requireAuth, async (req: any, res) => {
    try {
      const { vendorId, startDate, endDate, period } = req.query;
      const filters: any = {};
      
      if (vendorId) filters.vendorId = vendorId;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (period) filters.period = period;
      
      const reports = await storage.getVendorExpenseReport(filters);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching vendor expense reports:", error);
      res.status(500).json({ message: "Failed to fetch vendor expense reports" });
    }
  });

  // Top vendors by spend
  app.get("/api/vendor-reports/top-vendors", requireAuth, async (req: any, res) => {
    try {
      const { startDate, endDate, limit } = req.query;
      const filters: any = {};
      
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = parseInt(limit as string);
      
      const topVendors = await storage.getTopVendorsBySpend(filters);
      res.json(topVendors);
    } catch (error) {
      console.error("Error fetching top vendors by spend:", error);
      res.status(500).json({ message: "Failed to fetch top vendors by spend" });
    }
  });

  // Pending vs cleared invoices analysis
  app.get("/api/vendor-reports/pending-vs-cleared", requireAuth, async (req: any, res) => {
    try {
      const { vendorId, startDate, endDate } = req.query;
      const filters: any = {};
      
      if (vendorId) filters.vendorId = vendorId;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
      const analysis = await storage.getPendingVsClearedInvoices(filters);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching pending vs cleared invoices:", error);
      res.status(500).json({ message: "Failed to fetch pending vs cleared invoices" });
    }
  });

  // GST/TDS summary for compliance
  app.get("/api/vendor-reports/gst-tds-summary", requireAuth, async (req: any, res) => {
    try {
      const { vendorId, startDate, endDate, financialYear } = req.query;
      const filters: any = {};
      
      if (vendorId) filters.vendorId = vendorId;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (financialYear) filters.financialYear = financialYear;
      
      const summary = await storage.getVendorGSTTDSSummary(filters);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching GST/TDS summary:", error);
      res.status(500).json({ message: "Failed to fetch GST/TDS summary" });
    }
  });

  // Comprehensive vendor analytics dashboard
  app.get("/api/vendor-reports/analytics-dashboard", requireAuth, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const filters: any = {};
      
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
      const dashboard = await storage.getVendorAnalyticsDashboard(filters);
      res.json(dashboard);
    } catch (error) {
      console.error("Error fetching vendor analytics dashboard:", error);
      res.status(500).json({ message: "Failed to fetch vendor analytics dashboard" });
    }
  });

  // Vendor Due Reports - Dynamic reports based on bill types (with path parameters)
  app.get("/api/vendor-reports/vendor-due-reports/:startDate/:endDate/:billType/:vendorId?", requireAuth, async (req: any, res) => {
    try {
      const { startDate, endDate, billType, vendorId } = req.params;
      
      console.log("🎯 HANDLER: vendor-due-reports v2 (REAL DATABASE QUERY)");
      console.log("=== VENDOR DUE REPORTS REQUEST ===");
      console.log("Path parameters:", { startDate, endDate, billType, vendorId });
      
      const filters: any = {};
      
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (billType && billType !== 'undefined') filters.billType = billType as string;
      if (vendorId && vendorId !== 'undefined') filters.vendorId = vendorId as string;
      
      console.log("Database query filters:", filters);
      
      const vendorDueReports = await storage.getVendorDueReports(filters);
      
      console.log("Successfully retrieved vendor due reports:", vendorDueReports.length);
      res.json(vendorDueReports);
    } catch (error) {
      console.error("Error fetching vendor due reports:", error);
      res.status(500).json({ message: "Failed to fetch vendor due reports" });
    }
  });

  // ============= VENDOR CLAIMS CRUD OPERATIONS =============
  
  // CREATE - Create new vendor claim
  app.post("/api/vendor-claims", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      console.log("=== VENDOR CLAIM POST REQUEST ===");
      console.log("Raw vendor claim request body:", JSON.stringify(req.body, null, 2));
      
      // Vendor compliance checks - ensure vendor is active
      if (!req.body.vendorId) {
        return res.status(400).json({ message: "Vendor ID is required for vendor claims" });
      }
      
      const vendor = await storage.getVendor(req.body.vendorId);
      if (!vendor) {
        return res.status(400).json({ message: "Vendor not found" });
      }
      if (vendor.status !== 'active') {
        return res.status(400).json({ message: "Only active vendors can be selected for expense claims" });
      }
      
      // Parse amounts
      const amount = parseFloat(req.body.amount || '0');
      const tdsAmount = parseFloat(req.body.tdsAmount || '0');
      const netPayable = parseFloat(req.body.netPayable || '0');
      
      // Map vendor claim fields to expense claim structure
      const claimData = {
        title: req.body.title,
        description: req.body.description,
        vendorId: req.body.vendorId,
        userId,
        totalAmount: amount.toString(),
        balancePayment: netPayable.toString(), // Net payable after TDS
        billType: req.body.category || 'vendor_dues', // Map category to billType
        status: 'submitted',
        currentApprovalLevel: 'manager',
        submittedDate: new Date(),
        submittedAt: new Date(),
        // Vendor-specific fields
        agreementReference: req.body.agreementReference,
        expenseType: req.body.expenseType,
        period: req.body.period,
        accountNumber: req.body.accountNumber,
        billingPeriod: req.body.billingPeriod,
        consumptionUnits: req.body.consumptionUnits,
        // Store additional custom fields as JSON
        customFields: {
          openingReading: req.body.openingReading,
          closingReading: req.body.closingReading,
          billDate: req.body.billDate,
          lineItems: req.body.lineItems,
          gstDetails: req.body.gstDetails,
          transactionDetails: req.body.transactionDetails,
          panNumber: req.body.panNumber,
          tdsSection: req.body.tdsSection,
          poNumber: req.body.poNumber,
          receivedQuantity: req.body.receivedQuantity,
          tdsAmount: req.body.tdsAmount,
          vendorTdsCategory: req.body.vendorTdsCategory
        },
        // Due date handling - map to correct vendor fields
        vendorDueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        vendorInvoiceNumber: req.body.invoiceNumber || null,
        invoiceDate: req.body.invoiceDate ? new Date(req.body.invoiceDate) : null,
      };
      
      console.log("Processed vendor claim data:", JSON.stringify(claimData, null, 2));
      
      // Validate using the expense claim schema (most fields are compatible)
      const validatedData = insertExpenseClaimSchema.parse(claimData);
      console.log("Validation successful for vendor claim");
      
      // Create the claim using the existing expense claim system
      const claim = await storage.createExpenseClaim(validatedData);
      
      console.log("Vendor claim created successfully:", claim.id);
      
      res.status(201).json({
        id: claim.id,
        message: "Vendor claim created successfully",
        claim: claim
      });
    } catch (error) {
      console.error("Error creating vendor claim:", error);
      res.status(500).json({ 
        message: "Failed to create vendor claim",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // READ - Get all vendor claims (with filtering)
  app.get("/api/vendor-claims", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      if (!userId || !orgId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      const filters: any = { orgId }; // Add organization filtering
      
      // Role-based filtering  
      const user = await storage.getUser(userId);
      if (user?.role === 'employee') {
        filters.userId = userId; // Employees can only see their own claims
      }
      
      // URL parameter filters
      if (req.query.vendorId) filters.vendorId = req.query.vendorId;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.billType) filters.billType = req.query.billType;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      
      // Only get claims that have a vendorId (vendor claims)
      filters.hasVendor = true;
      
      const claims = await storage.getVendorClaims(filters);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching vendor claims:", error);
      res.status(500).json({ message: "Failed to fetch vendor claims" });
    }
  });

  // READ - Get single vendor claim by ID
  app.get("/api/vendor-claims/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const claimId = req.params.id;
      
      const claim = await storage.getExpenseClaim(claimId);
      if (!claim) {
        return res.status(404).json({ message: "Vendor claim not found" });
      }
      
      // Role-based access control
      const user = await storage.getUser(userId);
      if (user?.role === 'employee' && claim.userId !== userId) {
        return res.status(403).json({ message: "Access denied. You can only view your own claims." });
      }
      
      res.json(claim);
    } catch (error) {
      console.error("Error fetching vendor claim:", error);
      res.status(500).json({ message: "Failed to fetch vendor claim" });
    }
  });

  // UPDATE - Update vendor claim
  app.put("/api/vendor-claims/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const claimId = req.params.id;
      
      const existingClaim = await storage.getExpenseClaim(claimId);
      if (!existingClaim) {
        return res.status(404).json({ message: "Vendor claim not found" });
      }
      
      // Role-based access control
      const user = await storage.getUser(userId);
      if (user?.role === 'employee' && existingClaim.userId !== userId) {
        return res.status(403).json({ message: "Access denied. You can only edit your own claims." });
      }
      
      // Check if claim can be edited (not approved/paid)
      if (existingClaim.status === 'approved' || existingClaim.status === 'paid') {
        return res.status(400).json({ message: "Cannot edit approved or paid claims" });
      }
      
      // Vendor compliance checks if vendor is being changed
      if (req.body.vendorId && req.body.vendorId !== existingClaim.vendorId) {
        const vendor = await storage.getVendor(req.body.vendorId);
        if (!vendor) {
          return res.status(400).json({ message: "Vendor not found" });
        }
        if (vendor.status !== 'active') {
          return res.status(400).json({ message: "Only active vendors can be selected" });
        }
      }
      
      // Parse amounts
      const amount = parseFloat(req.body.amount || existingClaim.totalAmount);
      const tdsAmount = parseFloat(req.body.tdsAmount || '0');
      const netPayable = parseFloat(req.body.netPayable || existingClaim.balancePayment);
      
      // Update data
      const updateData = {
        title: req.body.title || existingClaim.title,
        description: req.body.description || existingClaim.description,
        vendorId: req.body.vendorId || existingClaim.vendorId,
        totalAmount: amount.toString(),
        balancePayment: netPayable.toString(),
        billType: req.body.category || existingClaim.billType,
        // Update vendor-specific fields
        agreementReference: req.body.agreementReference || existingClaim.agreementReference,
        expenseType: req.body.expenseType || existingClaim.expenseType,
        period: req.body.period || existingClaim.period,
        accountNumber: req.body.accountNumber || existingClaim.accountNumber,
        billingPeriod: req.body.billingPeriod || existingClaim.billingPeriod,
        consumptionUnits: req.body.consumptionUnits || existingClaim.consumptionUnits,
        // Update custom fields
        customFields: {
          ...existingClaim.customFields,
          ...(req.body.customFields || {}),
          tdsAmount: req.body.tdsAmount,
          vendorTdsCategory: req.body.vendorTdsCategory
        },
        // Update dates
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : existingClaim.dueDate,
        invoiceNumber: req.body.invoiceNumber !== undefined ? req.body.invoiceNumber : existingClaim.invoiceNumber,
        invoiceDate: req.body.invoiceDate ? new Date(req.body.invoiceDate) : existingClaim.invoiceDate,
        updatedAt: new Date(),
      };
      
      const updatedClaim = await storage.updateExpenseClaim(claimId, updateData);
      
      res.json({
        id: updatedClaim?.id,
        message: "Vendor claim updated successfully",
        claim: updatedClaim
      });
    } catch (error) {
      console.error("Error updating vendor claim:", error);
      res.status(500).json({ message: "Failed to update vendor claim" });
    }
  });

  // DELETE - Delete vendor claim  
  app.delete("/api/vendor-claims/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const claimId = req.params.id;
      
      const existingClaim = await storage.getExpenseClaim(claimId);
      if (!existingClaim) {
        return res.status(404).json({ message: "Vendor claim not found" });
      }
      
      // Role-based access control
      const user = await storage.getUser(userId);
      if (user?.role === 'employee' && existingClaim.userId !== userId) {
        return res.status(403).json({ message: "Access denied. You can only delete your own claims." });
      }
      
      // Check if claim can be deleted (only submitted/draft status)
      if (existingClaim.status !== 'submitted' && existingClaim.status !== 'draft') {
        return res.status(400).json({ message: "Cannot delete claims that are already in approval process" });
      }
      
      await storage.deleteExpenseClaim(claimId);
      
      res.json({ message: "Vendor claim deleted successfully" });
    } catch (error) {
      console.error("Error deleting vendor claim:", error);
      res.status(500).json({ message: "Failed to delete vendor claim" });
    }
  });

  // ============= VENDOR CLAIMS APPROVAL WORKFLOW =============
  
  // APPROVE - Approve vendor claim (Manager/Accountant)
  app.post("/api/vendor-claims/:id/approve", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const claimId = req.params.id;
      
      const user = await storage.getUser(userId);
      if (!user?.role.includes('manager') && !user?.role.includes('accountant') && !user?.role.includes('admin')) {
        return res.status(403).json({ message: "Only managers, accountants, or admins can approve claims" });
      }
      
      const claim = await storage.getExpenseClaim(claimId);
      if (!claim) {
        return res.status(404).json({ message: "Vendor claim not found" });
      }
      
      if (claim.status !== 'submitted') {
        return res.status(400).json({ message: "Only submitted claims can be approved" });
      }
      
      // Update claim status to approved
      const updatedClaim = await storage.updateExpenseClaim(claimId, {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        currentApprovalLevel: 'accountant',
      });
      
      res.json({
        message: "Vendor claim approved successfully",
        claim: updatedClaim
      });
    } catch (error) {
      console.error("Error approving vendor claim:", error);
      res.status(500).json({ message: "Failed to approve vendor claim" });
    }
  });

  // REJECT - Reject vendor claim 
  app.post("/api/vendor-claims/:id/reject", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const claimId = req.params.id;
      const rejectionReason = req.body.reason || "No reason provided";
      
      const user = await storage.getUser(userId);
      if (!user?.role.includes('manager') && !user?.role.includes('accountant') && !user?.role.includes('admin')) {
        return res.status(403).json({ message: "Only managers, accountants, or admins can reject claims" });
      }
      
      const claim = await storage.getExpenseClaim(claimId);
      if (!claim) {
        return res.status(404).json({ message: "Vendor claim not found" });
      }
      
      if (claim.status === 'paid' || claim.status === 'rejected') {
        return res.status(400).json({ message: "Cannot reject already processed claims" });
      }
      
      // Update claim status to rejected
      const updatedClaim = await storage.updateExpenseClaim(claimId, {
        status: 'rejected',
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: rejectionReason,
      });
      
      res.json({
        message: "Vendor claim rejected successfully",
        claim: updatedClaim
      });
    } catch (error) {
      console.error("Error rejecting vendor claim:", error);
      res.status(500).json({ message: "Failed to reject vendor claim" });
    }
  });

  // PROCESS PAYMENT - Mark vendor claim as paid
  app.post("/api/vendor-claims/:id/pay", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const claimId = req.params.id;
      
      const user = await storage.getUser(userId);
      if (!user?.role.includes('accountant') && !user?.role.includes('admin')) {
        return res.status(403).json({ message: "Only accountants or admins can process payments" });
      }
      
      const claim = await storage.getExpenseClaim(claimId);
      if (!claim) {
        return res.status(404).json({ message: "Vendor claim not found" });
      }
      
      if (claim.status !== 'approved') {
        return res.status(400).json({ message: "Only approved claims can be paid" });
      }
      
      // Update claim status to paid
      const updatedClaim = await storage.updateExpenseClaim(claimId, {
        status: 'paid',
        paidBy: userId,
        paidAt: new Date(),
        paymentReference: req.body.paymentReference || null,
      });
      
      res.json({
        message: "Vendor claim payment processed successfully",
        claim: updatedClaim
      });
    } catch (error) {
      console.error("Error processing vendor claim payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  app.get("/api/cashboxes", requireAuth, async (req: any, res) => {
    try {
      const cashboxes = await storage.getCashboxes();
      res.json(cashboxes);
    } catch (error) {
      console.error("Error fetching cashboxes:", error);
      res.status(500).json({ message: "Failed to fetch cashboxes" });
    }
  });

  app.get("/api/cashboxes/:id", requireAuth, async (req: any, res) => {
    try {
      const cashbox = await storage.getCashbox(req.params.id);
      if (!cashbox) {
        return res.status(404).json({ message: "Cashbox not found" });
      }
      res.json(cashbox);
    } catch (error) {
      console.error("Error fetching cashbox:", error);
      res.status(500).json({ message: "Failed to fetch cashbox" });
    }
  });

  app.post("/api/cashboxes", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const validatedData = insertCashboxSchema.parse({
        ...req.body,
        cashierId: userId,
      });
      
      const cashbox = await storage.createCashbox(validatedData);
      res.status(201).json(cashbox);
    } catch (error) {
      console.error("Error creating cashbox:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create cashbox" });
      }
    }
  });

  app.put("/api/cashboxes/:id", requireAuth, async (req: any, res) => {
    try {
      const updates = req.body;
      const updated = await storage.updateCashbox(req.params.id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Cashbox not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating cashbox:", error);
      res.status(500).json({ message: "Failed to update cashbox" });
    }
  });

  app.delete("/api/cashboxes/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteCashbox(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting cashbox:", error);
      res.status(500).json({ message: "Failed to delete cashbox" });
    }
  });

  // Initialize cashbox with initial funds
  app.post("/api/cashboxes/:id/initialize", requireAuth, async (req: any, res) => {
    try {
      const { initialAmount } = req.body;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      if (!initialAmount || initialAmount <= 0) {
        return res.status(400).json({ message: "Invalid initial amount" });
      }
      
      const result = await storage.initializeCashbox(req.params.id, initialAmount, userId);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error initializing cashbox:", error);
      res.status(500).json({ message: "Failed to initialize cashbox" });
    }
  });

  // Get cashbox current balance
  app.get("/api/cashboxes/:id/balance", requireAuth, async (req: any, res) => {
    try {
      const balance = await storage.getCurrentBalance(req.params.id);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Petty Cash Transaction routes
  app.get("/api/petty-cash-transactions", requireAuth, async (req: any, res) => {
    try {
      const filters: any = {};
      if (req.query.cashboxId) filters.cashboxId = req.query.cashboxId;
      if (req.query.type) filters.type = req.query.type;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      
      const transactions = await storage.getPettyCashTransactions(filters);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/petty-cash-transactions", upload.single("receipt"), requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const receiptUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      
      const validatedData = insertPettyCashTransactionSchema.parse({
        ...req.body,
        recordedBy: userId,
        receiptUrl,
        amount: parseFloat(req.body.amount).toString(),
        transactionDate: new Date(),
      });
      
      const transaction = await storage.createPettyCashTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  app.put("/api/petty-cash-transactions/:id", requireAuth, async (req: any, res) => {
    try {
      const updates = req.body;
      const updated = await storage.updatePettyCashTransaction(req.params.id, updates);
      
      if (!updated) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/petty-cash-transactions/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deletePettyCashTransaction(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Specialized transaction recording endpoints
  app.post("/api/petty-cash-transactions/receipt", upload.single("receipt"), requireAuth, async (req: any, res) => {
    try {
      const { cashboxId, amount, description, payee } = req.body;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const receiptUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      
      const transaction = await storage.recordCashReceipt(
        cashboxId,
        parseFloat(amount),
        description,
        payee,
        userId,
        receiptUrl
      );
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error recording cash receipt:", error);
      res.status(500).json({ message: "Failed to record cash receipt" });
    }
  });

  app.post("/api/petty-cash-transactions/payment", upload.single("receipt"), requireAuth, async (req: any, res) => {
    try {
      const { cashboxId, amount, description, payee } = req.body;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const receiptUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      
      const transaction = await storage.recordCashPayment(
        cashboxId,
        parseFloat(amount),
        description,
        payee,
        userId,
        receiptUrl
      );
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error recording cash payment:", error);
      res.status(500).json({ message: "Failed to record cash payment" });
    }
  });

  app.post("/api/petty-cash-transactions/transfer", requireAuth, async (req: any, res) => {
    try {
      const { fromCashboxId, toCashboxId, amount, description } = req.body;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      if (fromCashboxId === toCashboxId) {
        return res.status(400).json({ message: "Cannot transfer to same cashbox" });
      }
      
      const result = await storage.recordFundTransfer(
        fromCashboxId,
        toCashboxId,
        parseFloat(amount),
        description,
        userId
      );
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error recording fund transfer:", error);
      res.status(500).json({ message: "Failed to record fund transfer" });
    }
  });

  app.post("/api/petty-cash-transactions/iou", requireAuth, async (req: any, res) => {
    try {
      const { cashboxId, amount, description, payeeId } = req.body;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      const transaction = await storage.recordIouTake(
        cashboxId,
        parseFloat(amount),
        description,
        payeeId,
        userId
      );
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error recording IOU:", error);
      res.status(500).json({ message: "Failed to record IOU" });
    }
  });

  app.post("/api/petty-cash-transactions/iou-repay", requireAuth, async (req: any, res) => {
    try {
      const { originalIouId, amount } = req.body;
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      const transaction = await storage.recordIouRepay(
        originalIouId,
        parseFloat(amount),
        userId
      );
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error recording IOU repayment:", error);
      res.status(500).json({ message: "Failed to record IOU repayment" });
    }
  });

  // Ledger routes
  app.get("/api/cashboxes/:id/ledger", requireAuth, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const entries = await storage.getLedgerEntries(
        req.params.id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(entries);
    } catch (error) {
      console.error("Error fetching ledger entries:", error);
      res.status(500).json({ message: "Failed to fetch ledger entries" });
    }
  });

  app.get("/api/cashboxes/:id/ledger/:date", requireAuth, async (req: any, res) => {
    try {
      const entry = await storage.getLedgerEntry(req.params.id, new Date(req.params.date));
      
      if (!entry) {
        return res.status(404).json({ message: "Ledger entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error fetching ledger entry:", error);
      res.status(500).json({ message: "Failed to fetch ledger entry" });
    }
  });

  app.post("/api/cashboxes/:id/recalculate", requireAuth, async (req: any, res) => {
    try {
      const { fromDate } = req.body;
      
      if (!fromDate) {
        return res.status(400).json({ message: "fromDate is required" });
      }
      
      await storage.recalculateLedgerFromDate(req.params.id, new Date(fromDate));
      res.json({ message: "Ledger recalculated successfully" });
    } catch (error) {
      console.error("Error recalculating ledger:", error);
      res.status(500).json({ message: "Failed to recalculate ledger" });
    }
  });

  // Cost Center Configuration routes
  app.get("/api/cost-center-config", requireAuth, async (req: any, res) => {
    try {
      const orgId = req.user.orgId;
      const config = await storage.getCostCentreConfig(orgId);
      res.json(config);
    } catch (error) {
      console.error("Error fetching cost center config:", error);
      res.status(500).json({ message: "Failed to fetch cost center config" });
    }
  });

  app.post("/api/cost-center-config", requireAuth, async (req: any, res) => {
    try {
      const orgId = req.user.orgId;
      
      const parsedData = insertCostCentreConfigSchema.parse({
        ...req.body,
        orgId: orgId,
      });
      
      const config = await storage.saveCostCentreConfig(parsedData);
      res.json(config);
    } catch (error) {
      console.error("Error saving cost center config:", error);
      if (error instanceof Error && error.message.includes('validation')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to save cost center config" });
      }
    }
  });

  // TDS Master routes
  app.get("/api/tds-master", requireAuth, async (req: any, res) => {
    try {
      const tdsRates = await storage.getTdsMaster();
      res.json(tdsRates);
    } catch (error) {
      console.error("Error fetching TDS master data:", error);
      res.status(500).json({ message: "Failed to fetch TDS master data" });
    }
  });

  app.get("/api/tds-master/:category", requireAuth, async (req: any, res) => {
    try {
      const { category } = req.params;
      const tdsRate = await storage.getTdsMasterByCategory(category);
      if (!tdsRate) {
        return res.status(404).json({ message: "TDS rate not found for category" });
      }
      res.json(tdsRate);
    } catch (error) {
      console.error("Error fetching TDS rate by category:", error);
      res.status(500).json({ message: "Failed to fetch TDS rate" });
    }
  });

  app.post("/api/tds-master", requireAuth, async (req: any, res) => {
    try {
      const parsedData = insertTdsMasterSchema.parse(req.body);
      const tdsRate = await storage.createTdsMaster(parsedData);
      res.json(tdsRate);
    } catch (error) {
      console.error("Error creating TDS master:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create TDS master" });
      }
    }
  });

  app.put("/api/tds-master/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parsedData = insertTdsMasterSchema.partial().parse(req.body);
      const updatedTds = await storage.updateTdsMaster(id, parsedData);
      if (!updatedTds) {
        return res.status(404).json({ message: "TDS master not found" });
      }
      res.json(updatedTds);
    } catch (error) {
      console.error("Error updating TDS master:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update TDS master" });
      }
    }
  });

  app.delete("/api/tds-master/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTdsMaster(id);
      res.json({ message: "TDS master deleted successfully" });
    } catch (error) {
      console.error("Error deleting TDS master:", error);
      res.status(500).json({ message: "Failed to delete TDS master" });
    }
  });

  // Utility Categories routes
  app.get("/api/utility-categories", requireAuth, async (req: any, res) => {
    try {
      const orgId = getOrgId(req);
      if (!orgId) {
        return res.status(401).json({ message: "Organization ID not found" });
      }
      const categories = await storage.getUtilityCategories(orgId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching utility categories:", error);
      res.status(500).json({ message: "Failed to fetch utility categories" });
    }
  });

  app.post("/api/utility-categories", requireAuth, async (req: any, res) => {
    try {
      const orgId = getOrgId(req);
      if (!orgId) {
        return res.status(401).json({ message: "Organization ID not found" });
      }
      const parsedData = insertUtilityCategorySchema.parse({ ...req.body, orgId });
      const category = await storage.createUtilityCategory(parsedData);
      res.json(category);
    } catch (error) {
      console.error("Error creating utility category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create utility category" });
      }
    }
  });

  app.put("/api/utility-categories/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const orgId = getOrgId(req);
      if (!orgId) {
        return res.status(401).json({ message: "Organization ID not found" });
      }
      const parsedData = insertUtilityCategorySchema.partial().parse(req.body);
      const category = await storage.updateUtilityCategory(id, parsedData);
      if (!category) {
        return res.status(404).json({ message: "Utility category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating utility category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update utility category" });
      }
    }
  });

  app.delete("/api/utility-categories/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUtilityCategory(id);
      res.json({ message: "Utility category deleted successfully" });
    } catch (error) {
      console.error("Error deleting utility category:", error);
      res.status(500).json({ message: "Failed to delete utility category" });
    }
  });

  // Units of Measurement routes
  app.get("/api/units-of-measurement", requireAuth, async (req: any, res) => {
    try {
      const orgId = getOrgId(req);
      if (!orgId) {
        return res.status(401).json({ message: "Organization ID not found" });
      }
      const { utilityCategoryId } = req.query;
      const filters: any = { orgId };
      if (utilityCategoryId) {
        filters.utilityCategoryId = utilityCategoryId as string;
      }
      const units = await storage.getUnitsOfMeasurement(filters);
      res.json(units);
    } catch (error) {
      console.error("Error fetching units of measurement:", error);
      res.status(500).json({ message: "Failed to fetch units of measurement" });
    }
  });

  app.post("/api/units-of-measurement", requireAuth, async (req: any, res) => {
    try {
      const orgId = getOrgId(req);
      if (!orgId) {
        return res.status(401).json({ message: "Organization ID not found" });
      }
      const parsedData = insertUnitsOfMeasurementSchema.parse({ ...req.body, orgId });
      const unit = await storage.createUnitsOfMeasurement(parsedData);
      res.json(unit);
    } catch (error) {
      console.error("Error creating unit of measurement:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create unit of measurement" });
      }
    }
  });

  app.put("/api/units-of-measurement/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const orgId = getOrgId(req);
      if (!orgId) {
        return res.status(401).json({ message: "Organization ID not found" });
      }
      const parsedData = insertUnitsOfMeasurementSchema.partial().parse(req.body);
      const unit = await storage.updateUnitsOfMeasurement(id, parsedData);
      if (!unit) {
        return res.status(404).json({ message: "Unit of measurement not found" });
      }
      res.json(unit);
    } catch (error) {
      console.error("Error updating unit of measurement:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update unit of measurement" });
      }
    }
  });

  app.delete("/api/units-of-measurement/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUnitsOfMeasurement(id);
      res.json({ message: "Unit of measurement deleted successfully" });
    } catch (error) {
      console.error("Error deleting unit of measurement:", error);
      res.status(500).json({ message: "Failed to delete unit of measurement" });
    }
  });

  // Contract routes
  app.get("/api/contracts", requireAuth, async (req: any, res) => {
    try {
      const contracts = await storage.getContracts();
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.get("/api/contracts/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error fetching contract:", error);
      res.status(500).json({ message: "Failed to fetch contract" });
    }
  });

  app.post("/api/contracts", requireAuth, async (req: any, res) => {
    try {
      const parsedData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(parsedData);
      res.json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create contract" });
      }
    }
  });

  app.put("/api/contracts/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const parsedData = insertContractSchema.partial().parse(req.body);
      const contract = await storage.updateContract(id, parsedData);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Error updating contract:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update contract" });
      }
    }
  });

  app.delete("/api/contracts/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteContract(id);
      res.json({ message: "Contract deleted successfully" });
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(500).json({ message: "Failed to delete contract" });
    }
  });


  // ===== WORKFLOW SYSTEM API ROUTES =====

  // Menu permissions endpoint for current user
  app.get("/api/me/menu-permissions", requireAuth, async (req: any, res) => {
    try {
      const jwtRole = getUserRole(req);
      const mappedRole = getWorkflowRole(req);
      const orgId = getOrgId(req);
      
      console.log('Menu permissions request:', { jwtRole, mappedRole, orgId });
      
      if (!jwtRole || !mappedRole) {
        // Return basic permissions if no role mapping
        return res.json({ allowedMenuKeys: ["dashboard"] });
      }
      
      // SPECIAL CASE: Admin role_name in JWT gets default admin access including configuration (case insensitive)
      if (jwtRole && jwtRole.toLowerCase() === 'admin') {
        return res.json({ 
          allowedMenuKeys: ["dashboard", "approvals", "admin", "configuration", "vendors", "vendor-claim", "direct-expenses", "vendor-reports", "contracts", "petty-cash", "payments-initiate", "payments-process", "card-statements", "payments-release", "receipts", "reports", "access-rights", "employee-request", "employee-uploads", "vendor-onboarding", "employee-claim", "approval-tracker", "vendor-add"] 
        });
      }
      
      // Find the workflow role that matches the user's mapped role - CRITICAL: Filter by companyId to prevent cross-tenant data leakage
      const filters = { companyId: orgId, isActive: true };
      const roles = await storage.getWorkflowRoles(filters);
      const userRole = roles.find(role => 
        role.name.toLowerCase() === mappedRole.toLowerCase() && 
        role.isActive &&
        role.companyId === orgId // Additional security check to prevent cross-tenant access
      );
      
      if (userRole && userRole.menuKeys) {
        try {
          const parsedMenuKeys = JSON.parse(userRole.menuKeys);
          if (Array.isArray(parsedMenuKeys)) {
            return res.json({ allowedMenuKeys: parsedMenuKeys });
          }
        } catch (e) {
          console.error("Error parsing menu keys for role:", userRole.name, e);
        }
      }
      
      // Fallback to basic permissions
      res.json({ allowedMenuKeys: ["dashboard"] });
    } catch (error) {
      console.error("Error fetching menu permissions:", error);
      res.status(500).json({ message: "Failed to fetch menu permissions" });
    }
  });

  // Workflow Roles routes
  app.get("/api/workflow-roles", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      const jwtOrgId = getOrgId(req);
      const jwtRole = getUserRole(req);
      const mappedRole = getWorkflowRole(req);
      
      console.log('API workflow-roles access check:', { jwtOrgId, jwtRole, mappedRole });
      
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      // CRITICAL: Filter by companyId to ensure tenant isolation
      const filters: any = { companyId: jwtOrgId };
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }

      const roles = await storage.getWorkflowRoles(filters);
      res.json(roles);
    } catch (error) {
      console.error("Error fetching workflow roles:", error);
      res.status(500).json({ message: "Failed to fetch workflow roles" });
    }
  });

  app.post("/api/workflow-roles", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const parsedData = insertWorkflowRoleSchema.parse(req.body);
      
      // Automatically add the user's companyId (default to "13" if not found)
      const orgId = req.user.claims?.org_id || req.user.claims?.organization_id || "13";
      
      const roleData = {
        ...parsedData,
        companyId: orgId
      };
      
      const role = await storage.createWorkflowRole(roleData);
      res.json(role);
    } catch (error) {
      console.error("Error creating workflow role:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create workflow role" });
      }
    }
  });

  app.put("/api/workflow-roles/:id", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { id } = req.params;
      const orgId = getOrgId(req);
      
      // SECURITY: Validate input using schema and ensure proper tenant isolation
      const parsedData = insertWorkflowRoleSchema.partial().parse(req.body);
      
      // Verify the role belongs to the user's organization before updating
      const existingRole = await storage.getWorkflowRoles({ companyId: orgId });
      const roleToUpdate = existingRole.find(r => r.id === id);
      
      if (!roleToUpdate) {
        return res.status(404).json({ message: "Workflow role not found or access denied" });
      }
      
      const role = await storage.updateWorkflowRole(id, parsedData);
      if (!role) {
        return res.status(404).json({ message: "Workflow role not found" });
      }
      res.json(role);
    } catch (error) {
      console.error("Error updating workflow role:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update workflow role" });
      }
    }
  });

  app.delete("/api/workflow-roles/:id", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { id } = req.params;
      const orgId = getOrgId(req);
      
      // SECURITY: Verify the role belongs to the user's organization before deleting
      const existingRoles = await storage.getWorkflowRoles({ companyId: orgId });
      const roleToDelete = existingRoles.find(r => r.id === id);
      
      if (!roleToDelete) {
        return res.status(404).json({ message: "Workflow role not found or access denied" });
      }
      
      await storage.deleteWorkflowRole(id);
      res.json({ message: "Workflow role deleted successfully" });
    } catch (error) {
      console.error("Error deleting workflow role:", error);
      res.status(500).json({ message: "Failed to delete workflow role" });
    }
  });

  // Workflows routes
  app.get("/api/workflows", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const filters: any = {};
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      if (req.query.processTypes) {
        filters.processTypes = (req.query.processTypes as string).split(',');
      }

      const workflows = await storage.getWorkflows(filters);
      res.json(workflows);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.post("/api/workflows", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { levels, ...workflowData } = req.body;
      const parsedWorkflow = insertWorkflowSchema.parse(workflowData);
      
      // Clean up levels: convert empty strings to null for numeric fields
      const cleanedLevels = levels ? levels.map((level: any) => {
        const cleanLevel = {
          ...level,
          minAmount: level.minAmount === "" ? null : level.minAmount,
          maxAmount: level.maxAmount === "" ? null : level.maxAmount
        };
        return insertWorkflowLevelSchema.parse(cleanLevel);
      }) : [];
      
      const parsedLevels = cleanedLevels;
      
      // Automatically add the user's companyId from JWT auth
      const orgId = req.user.orgId || "13";
      const workflowWithCompany = {
        ...parsedWorkflow,
        companyId: orgId
      };
      
      const workflow = await storage.createWorkflow(workflowWithCompany, parsedLevels);
      res.json(workflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create workflow" });
      }
    }
  });

  app.put("/api/workflows/:id", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { id } = req.params;
      const { levels, ...workflowData } = req.body;
      
      // Update workflow data
      const parsedWorkflow = insertWorkflowSchema.partial().parse(workflowData);
      const workflow = await storage.updateWorkflow(id, parsedWorkflow);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      // Handle levels if provided
      if (levels && Array.isArray(levels)) {
        // Get existing levels
        const existingLevels = await storage.getWorkflowLevels(id);
        
        // Clean up levels: convert values to proper types for schema
        const cleanedLevels = levels.map((level: any) => {
          // Properly convert numeric fields to strings or null
          const minAmount = level.minAmount === "" || level.minAmount == null ? null : String(level.minAmount);
          const maxAmount = level.maxAmount === "" || level.maxAmount == null ? null : String(level.maxAmount);
          
          // Create clean level object, ensuring workflowId is always set correctly
          const cleanLevel = {
            level: level.level,
            roleId: level.roleId,
            isRequired: level.isRequired,
            workflowId: id, // Always use the workflow ID from the URL parameter
            minAmount,
            maxAmount
          };
          
          // Use insert schema for new levels, partial for updates
          if (level.id) {
            return { id: level.id, ...insertWorkflowLevelSchema.partial().parse(cleanLevel) };
          } else {
            return insertWorkflowLevelSchema.parse(cleanLevel);
          }
        });

        // Delete levels that no longer exist (by ID)
        const incomingIds = cleanedLevels.filter(l => l.id).map(l => l.id);
        const levelsToDelete = existingLevels.filter(existing => 
          !incomingIds.includes(existing.id)
        );
        
        for (const levelToDelete of levelsToDelete) {
          await storage.deleteWorkflowLevel(levelToDelete.id);
        }

        // Update or create levels
        for (const levelData of cleanedLevels) {
          if (levelData.id) {
            // Update existing level
            const { id: levelId, ...updateData } = levelData;
            await storage.updateWorkflowLevel(levelId, updateData);
          } else {
            // Create new level - ensure workflowId is set after parsing
            const levelToCreate = { ...levelData, workflowId: id };
            
            // Add debugging
            console.log('Creating level with workflowId:', levelToCreate);
            
            // Defensive check
            if (!levelToCreate.workflowId) {
              throw new Error("workflowId is missing for new level creation");
            }
            
            await storage.createWorkflowLevel(levelToCreate);
          }
        }
      }

      // Return workflow with updated levels so UI can refresh properly
      const updatedLevels = await storage.getWorkflowLevels(id);
      res.json({ ...workflow, levels: updatedLevels });
    } catch (error) {
      console.error("Error updating workflow:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update workflow" });
      }
    }
  });

  app.delete("/api/workflows/:id", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { id } = req.params;
      await storage.deleteWorkflow(id);
      res.json({ message: "Workflow deleted successfully" });
    } catch (error) {
      console.error("Error deleting workflow:", error);
      res.status(500).json({ message: "Failed to delete workflow" });
    }
  });

  // Workflow Levels routes
  app.get("/api/workflows/:workflowId/levels", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { workflowId } = req.params;
      const levels = await storage.getWorkflowLevels(workflowId);
      res.json(levels);
    } catch (error) {
      console.error("Error fetching workflow levels:", error);
      res.status(500).json({ message: "Failed to fetch workflow levels" });
    }
  });

  app.post("/api/workflow-levels", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const parsedData = insertWorkflowLevelSchema.parse(req.body);
      const level = await storage.createWorkflowLevel(parsedData);
      res.json(level);
    } catch (error) {
      console.error("Error creating workflow level:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create workflow level" });
      }
    }
  });

  app.put("/api/workflow-levels/:id", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { id } = req.params;
      const parsedData = insertWorkflowLevelSchema.partial().parse(req.body);
      const level = await storage.updateWorkflowLevel(id, parsedData);
      if (!level) {
        return res.status(404).json({ message: "Workflow level not found" });
      }
      res.json(level);
    } catch (error) {
      console.error("Error updating workflow level:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update workflow level" });
      }
    }
  });

  app.delete("/api/workflow-levels/:id", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { id } = req.params;
      await storage.deleteWorkflowLevel(id);
      res.json({ message: "Workflow level deleted successfully" });
    } catch (error) {
      console.error("Error deleting workflow level:", error);
      res.status(500).json({ message: "Failed to delete workflow level" });
    }
  });

  // Workflow Assignments routes
  app.get("/api/workflow-assignments", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const filters: any = {};
      if (req.query.processType) filters.processType = req.query.processType;
      if (req.query.vendorId) filters.vendorId = req.query.vendorId;
      if (req.query.expenseHeadId) filters.expenseHeadId = req.query.expenseHeadId;

      const assignments = await storage.getWorkflowAssignments(filters);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching workflow assignments:", error);
      res.status(500).json({ message: "Failed to fetch workflow assignments" });
    }
  });

  app.post("/api/workflow-assignments", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const parsedData = insertWorkflowAssignmentSchema.parse(req.body);
      const assignment = await storage.createWorkflowAssignment(parsedData);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating workflow assignment:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create workflow assignment" });
      }
    }
  });

  app.put("/api/workflow-assignments/:id", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { id } = req.params;
      const parsedData = insertWorkflowAssignmentSchema.partial().parse(req.body);
      const assignment = await storage.updateWorkflowAssignment(id, parsedData);
      if (!assignment) {
        return res.status(404).json({ message: "Workflow assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error updating workflow assignment:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update workflow assignment" });
      }
    }
  });

  app.delete("/api/workflow-assignments/:id", requireAuth, async (req: any, res) => {
    try {
      // Check if user has admin privileges using JWT role mapping
      if (!hasAdminRole(req)) {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }

      const { id } = req.params;
      await storage.deleteWorkflowAssignment(id);
      res.json({ message: "Workflow assignment deleted successfully" });
    } catch (error) {
      console.error("Error deleting workflow assignment:", error);
      res.status(500).json({ message: "Failed to delete workflow assignment" });
    }
  });

  // Bill Master Configuration Routes
  app.get("/api/bill-master/types", async (req, res) => {
    try {
      const { include_inactive } = req.query;
      const billTypes = await storage.getBillMasterTypes(include_inactive === 'true');
      res.json(billTypes);
    } catch (error) {
      console.error("Error fetching bill master types:", error);
      res.status(500).json({ error: "Failed to fetch bill master types" });
    }
  });

  app.post("/api/bill-master/types", async (req, res) => {
    try {
      const billTypeData = insertBillMasterTypeSchema.parse(req.body);
      const newBillType = await storage.createBillMasterType(billTypeData);
      res.status(201).json(newBillType);
    } catch (error) {
      console.error("Error creating bill master type:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid bill master type data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create bill master type" });
    }
  });

  app.put("/api/bill-master/types/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertBillMasterTypeSchema.partial().parse(req.body);
      const updatedBillType = await storage.updateBillMasterType(id, updates);
      if (!updatedBillType) {
        return res.status(404).json({ error: "Bill master type not found" });
      }
      res.json(updatedBillType);
    } catch (error) {
      console.error("Error updating bill master type:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid bill master type data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update bill master type" });
    }
  });

  app.delete("/api/bill-master/types/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBillMasterType(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bill master type:", error);
      res.status(500).json({ error: "Failed to delete bill master type" });
    }
  });

  app.post("/api/bill-master/fields", async (req, res) => {
    try {
      const fieldData = insertBillMasterFieldSchema.parse(req.body);
      const newField = await storage.createBillMasterField(fieldData);
      res.status(201).json(newField);
    } catch (error) {
      console.error("Error creating bill master field:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid bill master field data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create bill master field" });
    }
  });

  app.put("/api/bill-master/fields/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertBillMasterFieldSchema.partial().parse(req.body);
      const updatedField = await storage.updateBillMasterField(id, updates);
      if (!updatedField) {
        return res.status(404).json({ error: "Bill master field not found" });
      }
      res.json(updatedField);
    } catch (error) {
      console.error("Error updating bill master field:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid bill master field data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update bill master field" });
    }
  });

  app.delete("/api/bill-master/fields/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBillMasterField(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bill master field:", error);
      res.status(500).json({ error: "Failed to delete bill master field" });
    }
  });

  // External API proxy routes for cost center attributes
  app.get("/api/external/filter-data", requireAuth, async (req, res) => {
    try {
      const filterTypeId = req.query.filter_type_id || '2';
      console.log(`Proxying external API call for filter-data with filter_type_id=${filterTypeId}`);
      
      // Get JWT token from the request (set by JWT middleware)
      const jwtToken = (req as any).jwtTokenRaw || process.env.EXTERNAL_API_JWT_TOKEN;
      
      if (!jwtToken) {
        console.error('No JWT token available for external API call');
        return res.status(502).json({ 
          error: 'External API authentication required. Please ensure you are properly authenticated.',
          code: 'EXTERNAL_API_AUTH_REQUIRED'
        });
      }
      
      console.log('Using JWT token for external API:', 'Token available');

      const response = await fetch(`https://qa-api.resolveindia.com/organization/filter-data?filter_type_id=${filterTypeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`External API error: ${response.status} ${response.statusText}`);
        throw new Error(`External API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('External API filter-data response:', data);
      res.json(data);
    } catch (error: any) {
      console.error('Error proxying filter-data request:', error);
      res.status(500).json({ error: 'Failed to fetch filter data from external API', details: error.message });
    }
  });

  app.get("/api/external/attribute-details/:attributeId", requireAuth, async (req, res) => {
    try {
      const { attributeId } = req.params;
      console.log(`Proxying external API call for attribute-details with attributeId=${attributeId}`);
      
      // Get JWT token from the request (set by JWT middleware)
      const jwtToken = (req as any).jwtTokenRaw || process.env.EXTERNAL_API_JWT_TOKEN;
      
      if (!jwtToken) {
        console.error('No JWT token available for external API call');
        return res.status(502).json({ 
          error: 'External API authentication required. Please ensure you are properly authenticated.',
          code: 'EXTERNAL_API_AUTH_REQUIRED'
        });
      }
      
      console.log('Using JWT token for external API:', 'Token available');

      const response = await fetch(`https://qa-api.resolveindia.com/organization/attribute-details/${attributeId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`External API error: ${response.status} ${response.statusText}`);
        throw new Error(`External API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`External API attribute-details response for ${attributeId}:`, data);
      res.json(data);
    } catch (error: any) {
      console.error('Error proxying attribute-details request:', error);
      res.status(500).json({ error: 'Failed to fetch attribute details from external API', details: error.message });
    }
  });

  // Dashboard widget routes
  app.get("/api/dashboard/widgets", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const widgets = await storage.getDashboardWidgets(userId);
      res.json(widgets);
    } catch (error) {
      console.error("Error fetching dashboard widgets:", error);
      res.status(500).json({ message: "Failed to fetch dashboard widgets" });
    }
  });

  // Cost to Company breakdown by expense source
  app.get("/api/dashboard/cost-to-company-breakdown", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const orgId = getOrgId(req);
      if (!orgId) {
        return res.status(401).json({ message: "JWT Authentication required - missing org" });
      }
      const userRole = getWorkflowRole(req) || 'Employee';
      const currentRole = req.query.role || userRole;
      const period = req.query.period || 'last6months';
      
      const breakdown = await storage.getCostToCompanyBreakdown(
        userId, 
        currentRole, 
        orgId,
        { period }
      );
      res.json(breakdown);
    } catch (error) {
      console.error("Error fetching cost-to-company breakdown:", error);
      res.status(500).json({ message: "Failed to fetch cost-to-company breakdown" });
    }
  });

  app.post("/api/dashboard/widgets", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      const widgetData = {
        ...req.body,
        userId
      };
      const widget = await storage.createDashboardWidget(widgetData);
      res.json(widget);
    } catch (error) {
      console.error("Error creating dashboard widget:", error);
      res.status(500).json({ message: "Failed to create dashboard widget" });
    }
  });

  app.put("/api/dashboard/widgets/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updatedWidget = await storage.updateDashboardWidget(id, req.body);
      if (!updatedWidget) {
        return res.status(404).json({ message: "Widget not found" });
      }
      res.json(updatedWidget);
    } catch (error) {
      console.error("Error updating dashboard widget:", error);
      res.status(500).json({ message: "Failed to update dashboard widget" });
    }
  });

  app.delete("/api/dashboard/widgets/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDashboardWidget(id);
      res.json({ message: "Widget deleted successfully" });
    } catch (error) {
      console.error("Error deleting dashboard widget:", error);
      res.status(500).json({ message: "Failed to delete dashboard widget" });
    }
  });

  app.get("/api/dashboard/analytics", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      const userRole = getUserRole(req);
      if (!userId || !orgId || !userRole) {
        return res.status(401).json({ message: "JWT Authentication required - missing user info" });
      }
      const currentRole = req.query.role || userRole; // Allow role override via query param
      
      // OPTIMIZED VERSION: Batch fetch all data upfront to avoid N+1 queries
      const [allClaims, allExpenseRequests] = await Promise.all([
        storage.getExpenseClaims({}),
        storage.getExpenseRequests({}).then(requests => 
          requests.filter(request => !['approved', 'rejected', 'paid'].includes(request.status))
        )
      ]);
      
      // OPTIMIZATION 1: Batch fetch all users to avoid N+1 queries
      const allUserIds = new Set([
        ...allClaims.map(claim => claim.userId),
        ...allExpenseRequests.map(request => request.userId)
      ]);
      
      const userIdsArray = Array.from(allUserIds);
      const allUsers = await Promise.all(userIdsArray.map(uid => storage.getUser(uid)));
      const userMap = new Map();
      allUsers.forEach((user, idx) => {
        if (user) userMap.set(userIdsArray[idx], user);
      });

      // OPTIMIZATION 2: Batch fetch workflow instances to avoid N+1 queries  
      const allEntityIds = [
        ...allClaims.map(claim => ({ id: claim.id, type: 'claim' })),
        ...allExpenseRequests.map(request => ({ id: request.id, type: 'request' }))
      ];

      const workflowInstances = await Promise.all(
        allEntityIds.map(async entity => {
          try {
            return await storage.getWorkflowInstance(entity.id, entity.type);
          } catch (error) {
            return null;
          }
        })
      );
      
      const workflowInstanceMap = new Map();
      allEntityIds.forEach((entity, idx) => {
        if (workflowInstances[idx]) {
          workflowInstanceMap.set(entity.id, workflowInstances[idx]);
        }
      });
      
      const workflowEngine = getWorkflowEngine(storage);
      
      // Filter claims and requests using optimized workflow logic
      let pendingCount = 0;
      
      // Count expense claims that can be approved by this user (OPTIMIZED VERSION)
      for (const claim of allClaims) {
        try {
          // Use pre-fetched user data instead of individual queries
          const claimSubmitter = userMap.get(claim.userId);
          if (!claimSubmitter) continue;
          
          const context = {
            processType: 'claim' as const,
            amount: parseFloat(claim.totalAmount),
            submitterId: claim.userId,
            companyId: claimSubmitter.companyId || orgId,
            vendorId: claim.vendorId || undefined
          };
          
          // Check if workflow exists for this process type
          let workflow;
          if (claim.workflowId) {
            workflow = { id: claim.workflowId };
          } else {
            workflow = await workflowEngine.determineWorkflow(context);
          }
          
          if (!workflow) continue;
          
          // Get current workflow level using pre-fetched data
          let currentLevel = 1;
          const workflowInstance = workflowInstanceMap.get(claim.id);
          if (workflowInstance) {
            currentLevel = workflowInstance.currentLevel;
          }
          
          const approvers = await workflowEngine.getApproversForLevel(workflow.id, currentLevel, context);
          const canApprove = approvers.includes(userId);
          
          if (canApprove) pendingCount++;
        } catch (error) {
          // Skip claims that can't be processed
        }
      }
      
      // Count expense requests that can be approved by this user (OPTIMIZED VERSION)
      for (const request of allExpenseRequests) {
        try {
          // Use pre-fetched user data instead of individual queries
          const requestSubmitter = userMap.get(request.userId);
          if (!requestSubmitter) continue;
          
          const context = {
            processType: 'request' as const,
            amount: parseFloat(request.estimatedAmount || '0'),
            submitterId: request.userId,
            companyId: requestSubmitter?.companyId || orgId,
            vendorId: undefined
          };
          
          // Check if workflow exists for this process type
          let workflow;
          if (request.workflowId) {
            workflow = { id: request.workflowId };
          } else {
            workflow = await workflowEngine.determineWorkflow(context);
          }
          
          if (!workflow) continue;
          
          // Get current workflow level
          let currentLevel = 1;
          try {
            const workflowInstance = await storage.getWorkflowInstance(request.id, 'request');
            if (workflowInstance) {
              currentLevel = workflowInstance.currentLevel;
            }
          } catch (error) {
            // Use default level 1
          }
          
          const approvers = await workflowEngine.getApproversForLevel(workflow.id, currentLevel, context);
          const canApprove = approvers.includes(userId);
          
          // CRITICAL FIX: Add self-approval deadlock detection (same as pending approval endpoint)
          let isSelfApproval = false;
          if (!canApprove && request.userId === userId) {
            const isSelfApprovalDeadlock = await workflowEngine.checkSelfApprovalDeadlock(workflow.id, context);
            if (isSelfApprovalDeadlock) {
              isSelfApproval = true;
            }
          }
          
          if (canApprove || isSelfApproval) pendingCount++;
        } catch (error) {
          // Skip requests that can't be processed
        }
      }
      
      // Get regular analytics but override pending approvals count
      const analytics = await storage.getDashboardAnalytics(userId, currentRole, orgId);
      analytics.pendingApprovals = pendingCount; // Override with workflow-based count
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard analytics" });
    }
  });

  // NOTE: Removed duplicate /api/vendor-claims route - already defined above with proper getVendorClaims method

  // Get payment due dates for calendar widget
  app.get("/api/dashboard/payment-dues/:year/:month", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      if (!userId || !orgId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month); // 0-based month
      
      const paymentDues = [];
      
      // Get expense claims with vendor due dates - RECURRING MONTHLY LOGIC
      const allClaims = await storage.getExpenseClaims({ orgId });
      for (const claim of allClaims) {
        // Only include claims that have vendor due dates set
        if (claim.vendorDueDate) {
          const originalDueDate = new Date(claim.vendorDueDate);
          const dayOfMonth = originalDueDate.getDate(); // Get the day (7, 11, etc.)
          
          // Generate recurring monthly due date for the requested month
          const recurringDueDate = new Date(year, month, dayOfMonth);
          
          // Check if this day exists in the requested month (handles month-end edge cases)
          if (recurringDueDate.getMonth() === month && recurringDueDate.getFullYear() === year) {
            const isOverdue = recurringDueDate < new Date() && claim.status !== 'paid';
            const dueDateStr = recurringDueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            paymentDues.push({
              id: `${claim.id}-${year}-${month}`, // Unique ID per month
              type: 'vendor',
              title: `Vendor Payment: ${claim.description || 'Expense Claim'}`,
              amount: parseFloat(claim.totalAmount || '0'),
              dueDate: dueDateStr,
              status: isOverdue ? 'overdue' : 'pending'
            });
          }
        }
      }
      
      // Get contracts with due dates - RECURRING MONTHLY LOGIC
      const contracts = await storage.getContracts({ orgId });
      for (const contract of contracts) {
        if (contract.dueDate) {
          const originalDueDate = new Date(contract.dueDate);
          const dayOfMonth = originalDueDate.getDate(); // Get the day (15, 20, 25, etc.)
          
          // Generate recurring monthly due date for the requested month
          const recurringDueDate = new Date(year, month, dayOfMonth);
          
          // Check if this day exists in the requested month (handles month-end edge cases)
          if (recurringDueDate.getMonth() === month && recurringDueDate.getFullYear() === year) {
            const isOverdue = recurringDueDate < new Date() && contract.status !== 'paid';
            const dueDateStr = recurringDueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Safely parse contract amount with fallback
            const contractAmount = contract.amount ? parseFloat(contract.amount.toString()) : 0;
            paymentDues.push({
              id: `${contract.id}-${year}-${month}`, // Unique ID per month
              type: 'contract',
              title: `Contract: ${contract.title || contract.vendorName || 'Unknown Contract'}`,
              amount: contractAmount,
              dueDate: dueDateStr,
              status: isOverdue ? 'overdue' : 'pending'
            });
          }
        }
      }
      
      res.json(paymentDues);
    } catch (error) {
      console.error("Error fetching payment due dates:", error);
      res.status(500).json({ message: "Failed to fetch payment due dates" });
    }
  });

  // Process Master Routes
  app.get("/api/process-master", requireAuth, async (req: any, res) => {
    try {
      const processes = await storage.getProcessMasters();
      res.json(processes);
    } catch (error) {
      console.error("Error fetching process masters:", error);
      res.status(500).json({ message: "Failed to fetch process masters" });
    }
  });

  // Report Builder API Routes
  app.get("/api/report-builder/fields/:processType", requireAuth, async (req: any, res) => {
    try {
      const processType = req.params.processType;
      
      // Define field mappings for each process type
      const fieldMappings = {
        request: [
          { value: 'id', label: 'Request ID', type: 'string' },
          { value: 'title', label: 'Title', type: 'string' },
          { value: 'description', label: 'Description', type: 'string' },
          { value: 'type', label: 'Request Type', type: 'string' },
          { value: 'estimatedAmount', label: 'Estimated Amount', type: 'number' },
          { value: 'status', label: 'Status', type: 'string' },
          { value: 'urgency', label: 'Urgency', type: 'string' },
          { value: 'justification', label: 'Justification', type: 'string' },
          { value: 'expectedDate', label: 'Expected Date', type: 'date' },
          { value: 'createdAt', label: 'Created Date', type: 'date' },
          { value: 'approvedAt', label: 'Approved Date', type: 'date' },
          { value: 'userId', label: 'Requester ID', type: 'string' },
          { value: 'approvedBy', label: 'Approved By', type: 'string' },
          { value: 'employerName', label: 'Employee Initiated', type: 'string' },
          { value: 'employeeNumber', label: 'Employee Number', type: 'string' },
          { value: 'employeeEmail', label: 'Email', type: 'string' }
        ],
        claim: [
          { value: 'id', label: 'Claim ID', type: 'string' },
          { value: 'title', label: 'Title', type: 'string' },
          { value: 'description', label: 'Description', type: 'string' },
          { value: 'totalAmount', label: 'Total Amount', type: 'number' },
          { value: 'balancePayment', label: 'Balance Payment', type: 'number' },
          { value: 'currency', label: 'Currency', type: 'string' },
          { value: 'status', label: 'Status', type: 'string' },
          { value: 'submittedAt', label: 'Submitted Date', type: 'date' },
          { value: 'approvedAt', label: 'Approved Date', type: 'date' },
          { value: 'paidAt', label: 'Paid Date', type: 'date' },
          { value: 'vendorDueDate', label: 'Vendor Due Date', type: 'date' },
          { value: 'userId', label: 'Employee ID', type: 'string' },
          { value: 'approvedBy', label: 'Approved By', type: 'string' },
          { value: 'processedBy', label: 'Processed By', type: 'string' },
          { value: 'employerName', label: 'Employee Initiated', type: 'string' },
          { value: 'employeeNumber', label: 'Employee Number', type: 'string' },
          { value: 'employeeEmail', label: 'Email', type: 'string' }
        ],
        payment: [
          { value: 'id', label: 'Batch ID', type: 'string' },
          { value: 'name', label: 'Batch Name', type: 'string' },
          { value: 'description', label: 'Description', type: 'string' },
          { value: 'totalAmount', label: 'Total Amount', type: 'number' },
          { value: 'status', label: 'Status', type: 'string' },
          { value: 'paymentMethod', label: 'Payment Method', type: 'string' },
          { value: 'scheduledDate', label: 'Scheduled Date', type: 'date' },
          { value: 'processedAt', label: 'Processed Date', type: 'date' },
          { value: 'createdAt', label: 'Created Date', type: 'date' },
          { value: 'createdBy', label: 'Created By', type: 'string' },
          { value: 'processedBy', label: 'Processed By', type: 'string' }
        ],
        vendor: [
          { value: 'id', label: 'Vendor ID', type: 'string' },
          { value: 'name', label: 'Vendor Name', type: 'string' },
          { value: 'email', label: 'Email', type: 'string' },
          { value: 'phone', label: 'Phone', type: 'string' },
          { value: 'address', label: 'Address', type: 'string' },
          { value: 'city', label: 'City', type: 'string' },
          { value: 'state', label: 'State', type: 'string' },
          { value: 'pincode', label: 'Pincode', type: 'string' },
          { value: 'panNumber', label: 'PAN Number', type: 'string' },
          { value: 'gstNumber', label: 'GST Number', type: 'string' },
          { value: 'bankName', label: 'Bank Name', type: 'string' },
          { value: 'accountNumber', label: 'Account Number', type: 'string' },
          { value: 'ifscCode', label: 'IFSC Code', type: 'string' },
          { value: 'status', label: 'Status', type: 'string' },
          { value: 'createdAt', label: 'Created Date', type: 'date' },
          { value: 'employerName', label: 'Employee Initiated', type: 'string' },
          { value: 'employeeNumber', label: 'Employee Number', type: 'string' },
          { value: 'employeeEmail', label: 'Email', type: 'string' }
        ],
        vendorclaim: [
          { value: 'id', label: 'Vendor Claim ID', type: 'string' },
          { value: 'requestType', label: 'Request Type', type: 'string' },
          { value: 'companyName', label: 'Company Name', type: 'string' },
          { value: 'contactPerson', label: 'Contact Person', type: 'string' },
          { value: 'email', label: 'Email', type: 'string' },
          { value: 'phone', label: 'Phone', type: 'string' },
          { value: 'address', label: 'Address', type: 'string' },
          { value: 'gstin', label: 'GSTIN', type: 'string' },
          { value: 'pan', label: 'PAN', type: 'string' },
          { value: 'bankName', label: 'Bank Name', type: 'string' },
          { value: 'accountNumber', label: 'Account Number', type: 'string' },
          { value: 'ifscCode', label: 'IFSC Code', type: 'string' },
          { value: 'status', label: 'Status', type: 'string' },
          { value: 'requestedBy', label: 'Requested By', type: 'string' },
          { value: 'createdAt', label: 'Created Date', type: 'date' },
          { value: 'approvedAt', label: 'Approved Date', type: 'date' },
          { value: 'approvedBy', label: 'Approved By', type: 'string' },
          { value: 'employerName', label: 'Employee Initiated', type: 'string' },
          { value: 'employeeNumber', label: 'Employee Number', type: 'string' },
          { value: 'employeeEmail', label: 'Email', type: 'string' }
        ],
        pettycash: [
          { value: 'id', label: 'Transaction ID', type: 'string' },
          { value: 'cashboxId', label: 'Cashbox ID', type: 'string' },
          { value: 'type', label: 'Transaction Type', type: 'string' },
          { value: 'amount', label: 'Amount', type: 'number' },
          { value: 'currency', label: 'Currency', type: 'string' },
          { value: 'description', label: 'Description', type: 'string' },
          { value: 'payee', label: 'Payee', type: 'string' },
          { value: 'payeeType', label: 'Payee Type', type: 'string' },
          { value: 'category', label: 'Category', type: 'string' },
          { value: 'receiptUrl', label: 'Receipt URL', type: 'string' },
          { value: 'transactionDate', label: 'Transaction Date', type: 'date' },
          { value: 'recordedBy', label: 'Recorded By', type: 'string' },
          { value: 'approvedBy', label: 'Approved By', type: 'string' },
          { value: 'status', label: 'Status', type: 'string' },
          { value: 'createdAt', label: 'Created Date', type: 'date' },
          { value: 'employerName', label: 'Employee Initiated', type: 'string' },
          { value: 'employeeNumber', label: 'Employee Number', type: 'string' },
          { value: 'employeeEmail', label: 'Email', type: 'string' }
        ],
        directexpense: [
          { value: 'id', label: 'Expense ID', type: 'string' },
          { value: 'categoryId', label: 'Category ID', type: 'string' },
          { value: 'description', label: 'Description', type: 'string' },
          { value: 'amount', label: 'Amount', type: 'number' },
          { value: 'currency', label: 'Currency', type: 'string' },
          { value: 'date', label: 'Expense Date', type: 'date' },
          { value: 'vendorName', label: 'Vendor Name', type: 'string' },
          { value: 'invoiceNumber', label: 'Invoice Number', type: 'string' },
          { value: 'receiptUrl', label: 'Receipt URL', type: 'string' },
          { value: 'status', label: 'Status', type: 'string' },
          { value: 'createdBy', label: 'Created By', type: 'string' },
          { value: 'approvedBy', label: 'Approved By', type: 'string' },
          { value: 'createdAt', label: 'Created Date', type: 'date' },
          { value: 'approvedAt', label: 'Approved Date', type: 'date' },
          { value: 'employerName', label: 'Employee Initiated', type: 'string' },
          { value: 'employeeNumber', label: 'Employee Number', type: 'string' },
          { value: 'employeeEmail', label: 'Email', type: 'string' }
        ]
      };
      
      const fields = fieldMappings[processType as keyof typeof fieldMappings];
      if (!fields) {
        return res.status(400).json({ message: "Invalid process type" });
      }
      
      res.json(fields);
    } catch (error) {
      console.error("Error fetching report builder fields:", error);
      res.status(500).json({ message: "Failed to fetch fields" });
    }
  });

  // Get distinct values for a field in a process type
  app.get("/api/report-builder/field-values/:processType/:fieldName", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      if (!userId || !orgId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      const { processType, fieldName } = req.params;
      
      let data = [];
      
      // Get data based on process type (similar to generate endpoint)
      switch (processType) {
        case 'request':
          const requests = await storage.getExpenseRequests({ orgId });
          data = requests.map((req: any) => ({
            id: req.id,
            title: req.title,
            description: req.description,
            type: req.type,
            estimatedAmount: req.estimatedAmount,
            status: req.status,
            urgency: req.urgency,
            justification: req.justification,
            expectedDate: req.expectedDate,
            createdAt: req.createdAt,
            approvedAt: req.approvedAt,
            userId: req.userId,
            userName: req.user?.firstName || 'N/A',
            approvedBy: req.approvedBy || 'N/A',
            employerName: req.employerName || 'N/A',
            employeeNumber: req.employeeNumber || 'N/A',
            employeeEmail: req.employeeEmail || 'N/A'
          }));
          break;
          
        case 'claim':
          const claims = await storage.getExpenseClaims({ orgId });
          data = claims.map((claim: any) => ({
            id: claim.id,
            title: claim.title,
            description: claim.description,
            totalAmount: claim.totalAmount,
            balancePayment: claim.balancePayment,
            currency: claim.currency,
            status: claim.status,
            submittedAt: claim.submittedAt,
            approvedAt: claim.approvedAt,
            paidAt: claim.paidAt,
            vendorDueDate: claim.vendorDueDate,
            userId: claim.userId,
            userName: claim.user?.firstName || claim.user?.name || 'N/A',
            approvedBy: claim.approvedBy || 'N/A',
            processedBy: claim.processedBy || 'N/A',
            employerName: claim.employerName || 'N/A',
            employeeNumber: claim.employeeNumber || 'N/A',
            employeeEmail: claim.employeeEmail || 'N/A'
          }));
          break;
          
        case 'payment':
          const payments = await storage.getPaymentBatches();
          // Filter by orgId for multi-tenant security
          data = payments
            .filter((payment: any) => payment.orgId === orgId)
            .map((payment: any) => ({
              id: payment.id,
              name: payment.name,
              description: payment.description,
              totalAmount: payment.totalAmount,
              status: payment.status,
              paymentMethod: payment.paymentMethod,
              scheduledDate: payment.scheduledDate,
              processedAt: payment.processedAt,
              createdAt: payment.createdAt,
              createdBy: payment.createdBy,
              processedBy: payment.processedBy
            }));
          break;
          
        case 'vendor':
          const vendors = await storage.getVendors();
          // Filter by orgId for multi-tenant security  
          data = vendors
            .filter((vendor: any) => vendor.orgId === orgId)
            .map((vendor: any) => ({
            id: vendor.id,
            name: vendor.name,
            email: vendor.email,
            phone: vendor.phone,
            address: vendor.address,
            city: vendor.city,
            state: vendor.state,
            pincode: vendor.pincode,
            panNumber: vendor.panNumber,
            gstNumber: vendor.gstNumber,
            bankName: vendor.bankName,
            accountNumber: vendor.accountNumber,
            ifscCode: vendor.ifscCode,
            status: vendor.status,
            createdAt: vendor.createdAt,
            employerName: vendor.employerName || 'N/A',
            employeeNumber: vendor.employeeNumber || 'N/A',
            employeeEmail: vendor.employeeEmail || 'N/A'
          }));
          break;
          
        case 'vendorclaim':
          const vendorRequests = await storage.getVendorOnboardingRequests();
          // Filter by orgId for multi-tenant security
          data = vendorRequests
            .filter((request: any) => request.orgId === orgId)
            .map((request: any) => ({
              id: request.id,
              requestType: request.requestType,
              companyName: request.companyName,
              contactPerson: request.contactPerson,
              email: request.email,
              phone: request.phone,
              address: request.address,
              gstin: request.gstin,
              pan: request.pan,
              bankName: request.bankName,
              accountNumber: request.accountNumber,
              ifscCode: request.ifscCode,
              status: request.status,
              requestedBy: request.requestedBy,
              createdAt: request.createdAt,
              approvedAt: request.approvedAt,
              approvedBy: request.approvedBy || 'N/A',
              employerName: request.employerName || 'N/A',
              employeeNumber: request.employeeNumber || 'N/A',
              employeeEmail: request.employeeEmail || 'N/A'
            }));
          break;

        case 'pettycash':
          const pettyCashTransactions = await storage.getPettyCashTransactions();
          // Filter by orgId for multi-tenant security
          data = pettyCashTransactions
            .filter((transaction: any) => transaction.orgId === orgId)
            .map((transaction: any) => ({
              id: transaction.id,
              cashboxId: transaction.cashboxId,
              type: transaction.type,
              amount: transaction.amount,
              currency: transaction.currency,
              description: transaction.description,
              payee: transaction.payee,
              payeeType: transaction.payeeType,
              category: transaction.category,
              receiptUrl: transaction.receiptUrl,
              transactionDate: transaction.transactionDate,
              recordedBy: transaction.recordedBy,
              approvedBy: transaction.approvedBy || 'N/A',
              status: transaction.status,
              createdAt: transaction.createdAt,
              employerName: transaction.employerName || 'N/A',
              employeeNumber: transaction.employeeNumber || 'N/A',
              employeeEmail: transaction.employeeEmail || 'N/A'
            }));
          break;

        case 'directexpense':
          const directExpenses = await storage.getDirectExpenses();
          // Filter by orgId for multi-tenant security
          data = directExpenses
            .filter((expense: any) => expense.orgId === orgId)
            .map((expense: any) => ({
              id: expense.id,
              categoryId: expense.categoryId,
              description: expense.description,
              amount: expense.amount,
              currency: expense.currency,
              date: expense.date,
              vendorName: expense.vendorName,
              invoiceNumber: expense.invoiceNumber,
              receiptUrl: expense.receiptUrl,
              status: expense.status,
              createdBy: expense.createdBy,
              approvedBy: expense.approvedBy || 'N/A',
              createdAt: expense.createdAt,
              approvedAt: expense.approvedAt,
              employerName: expense.employerName || 'N/A',
              employeeNumber: expense.employeeNumber || 'N/A',
              employeeEmail: expense.employeeEmail || 'N/A'
            }));
          break;
          
        default:
          return res.status(400).json({ message: "Invalid process type" });
      }
      
      // Extract distinct values for the specified field
      const distinctValues = new Set();
      
      data.forEach((item: any) => {
        const value = item[fieldName];
        if (value !== null && value !== undefined && value !== '' && value !== 'N/A') {
          distinctValues.add(value);
        }
      });
      
      // Convert Set to sorted array
      const sortedValues = Array.from(distinctValues).sort((a, b) => {
        // Sort strings alphabetically, numbers numerically
        if (typeof a === 'string' && typeof b === 'string') {
          return a.localeCompare(b);
        }
        if (typeof a === 'number' && typeof b === 'number') {
          return a - b;
        }
        // Mixed types - convert to string for comparison
        return String(a).localeCompare(String(b));
      });
      
      res.json(sortedValues);
    } catch (error) {
      console.error("Error fetching field values:", error);
      res.status(500).json({ message: "Failed to fetch field values" });
    }
  });

  app.post("/api/report-builder/generate", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      if (!userId || !orgId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }
      
      const { tableName, process, period, columns, filters } = req.body;
      
      console.log(`🔍 Multi-Process Report: Request received`);
      console.log(`🔍 Multi-Process Report: tableName=${tableName}, process=${process}`);
      console.log(`🔍 Multi-Process Report: columns=${JSON.stringify(columns)}`);
      console.log(`🔍 Multi-Process Report: filters=${JSON.stringify(filters)}`);
      
      if (!columns || columns.length === 0) {
        return res.status(400).json({ message: "Columns are required" });
      }
      
      // Detect if this is a multi-process report (columns have process prefixes)
      const isMultiProcess = columns.some((col: string) => col.includes('.'));
      console.log(`🔍 Multi-Process Report: isMultiProcess=${isMultiProcess}`);
      
      let resultData = [];
      let resultTableName = "Custom Report";
      
      if (isMultiProcess) {
        // Extract unique processes from column prefixes
        const processes = [...new Set(
          columns
            .filter((col: string) => col.includes('.'))
            .map((col: string) => col.split('.')[0])
        )];
        console.log(`🔍 Multi-Process Report: Detected processes:`, processes);
        
        // Fetch data for each process
        const processDataMap: { [key: string]: any[] } = {};
        
        for (const proc of processes) {
          console.log(`🔍 Multi-Process Report: Fetching data for process: ${proc}`);
          let processData = [];
          
          // Build filters for this process
          const processFilters: any = { orgId };
          if (filters && typeof filters === 'object') {
            Object.keys(filters).forEach(filterKey => {
              if (filterKey.startsWith(`${proc}.`)) {
                const fieldName = filterKey.replace(`${proc}.`, '');
                processFilters[fieldName] = filters[filterKey];
              }
            });
          }
          console.log(`🔍 Multi-Process Report: Applying filters for ${proc}:`, processFilters);
          
          switch (proc) {
            case 'request':
              const requests = await storage.getExpenseRequests(processFilters);
              processData = requests.map((req: any) => ({
                id: req.id,
                title: req.title,
                description: req.description,
                type: req.type,
                estimatedAmount: req.estimatedAmount,
                status: req.status,
                urgency: req.urgency,
                justification: req.justification,
                expectedDate: req.expectedDate,
                createdAt: req.createdAt,
                approvedAt: req.approvedAt,
                userId: req.userId,
                userName: req.user?.firstName || 'N/A',
                approvedBy: req.approvedBy || 'N/A',
                employerName: req.employerName || 'N/A',
                employeeNumber: req.employeeNumber || 'N/A',
                employeeEmail: req.employeeEmail || 'N/A'
              }));
              break;
              
            case 'claim':
              const claims = await storage.getExpenseClaims(processFilters);
              processData = claims.map((claim: any) => ({
                id: claim.id,
                title: claim.title,
                description: claim.description,
                totalAmount: claim.totalAmount,
                balancePayment: claim.balancePayment,
                currency: claim.currency,
                status: claim.status,
                submittedAt: claim.submittedAt,
                approvedAt: claim.approvedAt,
                paidAt: claim.paidAt,
                vendorDueDate: claim.vendorDueDate,
                userId: claim.userId,
                userName: claim.user?.firstName || claim.user?.name || 'N/A',
                approvedBy: claim.approvedBy || 'N/A',
                processedBy: claim.processedBy || 'N/A',
                employerName: claim.employerName || 'N/A',
                employeeNumber: claim.employeeNumber || 'N/A',
                employeeEmail: claim.employeeEmail || 'N/A'
              }));
              break;
              
            case 'payment':
              const payments = await storage.getPaymentBatches();
              processData = payments.map((payment: any) => ({
                id: payment.id,
                name: payment.name,
                description: payment.description,
                totalAmount: payment.totalAmount,
                status: payment.status,
                paymentMethod: payment.paymentMethod,
                scheduledDate: payment.scheduledDate,
                processedAt: payment.processedAt,
                createdAt: payment.createdAt,
                createdBy: payment.createdBy,
                processedBy: payment.processedBy
              }));
              break;
              
            case 'vendor':
              const vendors = await storage.getVendors();
              processData = vendors.map((vendor: any) => ({
                id: vendor.id,
                name: vendor.name,
                email: vendor.email,
                phone: vendor.phone,
                address: vendor.address,
                city: vendor.city,
                state: vendor.state,
                pincode: vendor.pincode,
                panNumber: vendor.panNumber,
                gstNumber: vendor.gstNumber,
                bankName: vendor.bankName,
                accountNumber: vendor.accountNumber,
                ifscCode: vendor.ifscCode,
                status: vendor.status,
                createdAt: vendor.createdAt,
                employerName: vendor.employerName || 'N/A',
                employeeNumber: vendor.employeeNumber || 'N/A',
                employeeEmail: vendor.employeeEmail || 'N/A'
              }));
              break;
              
            case 'vendorclaim':
              const vendorRequests = await storage.getVendorOnboardingRequests();
              processData = vendorRequests.map((request: any) => ({
                id: request.id,
                requestType: request.requestType,
                companyName: request.companyName,
                contactPerson: request.contactPerson,
                email: request.email,
                phone: request.phone,
                address: request.address,
                gstin: request.gstin,
                pan: request.pan,
                bankName: request.bankName,
                accountNumber: request.accountNumber,
                ifscCode: request.ifscCode,
                status: request.status,
                requestedBy: request.requestedBy,
                createdAt: request.createdAt,
                approvedAt: request.approvedAt,
                approvedBy: request.approvedBy || 'N/A',
                employerName: request.employerName || 'N/A',
                employeeNumber: request.employeeNumber || 'N/A',
                employeeEmail: request.employeeEmail || 'N/A'
              }));
              break;

            case 'pettycash':
              const pettyCashTransactions = await storage.getPettyCashTransactions();
              processData = pettyCashTransactions.map((transaction: any) => ({
                id: transaction.id,
                cashboxId: transaction.cashboxId,
                type: transaction.type,
                amount: transaction.amount,
                currency: transaction.currency,
                description: transaction.description,
                payee: transaction.payee,
                payeeType: transaction.payeeType,
                category: transaction.category,
                receiptUrl: transaction.receiptUrl,
                transactionDate: transaction.transactionDate,
                recordedBy: transaction.recordedBy,
                approvedBy: transaction.approvedBy || 'N/A',
                status: transaction.status,
                createdAt: transaction.createdAt,
                employerName: transaction.employerName || 'N/A',
                employeeNumber: transaction.employeeNumber || 'N/A',
                employeeEmail: transaction.employeeEmail || 'N/A'
              }));
              break;

            case 'directexpense':
              const directExpensesList = await storage.getDirectExpenses();
              processData = directExpensesList.map((expense: any) => ({
                id: expense.id,
                categoryId: expense.categoryId,
                description: expense.description,
                amount: expense.amount,
                currency: expense.currency,
                date: expense.date,
                vendorName: expense.vendorName,
                invoiceNumber: expense.invoiceNumber,
                receiptUrl: expense.receiptUrl,
                status: expense.status,
                createdBy: expense.createdBy,
                approvedBy: expense.approvedBy || 'N/A',
                createdAt: expense.createdAt,
                approvedAt: expense.approvedAt,
                employerName: expense.employerName || 'N/A',
                employeeNumber: expense.employeeNumber || 'N/A',
                employeeEmail: expense.employeeEmail || 'N/A'
              }));
              break;
          }
          
          processDataMap[proc] = processData;
          console.log(`🔍 Multi-Process Report: Found ${processData.length} records for ${proc}`);
        }
        
        // Create separate data groups for each process
        const processGroups: { [key: string]: any[] } = {};
        
        // Always include default employee columns in multi-process reports
        const defaultEmployeeColumns = ['employerName', 'employeeNumber', 'employeeEmail'];
        const allColumnsWithDefaults = [...new Set([...defaultEmployeeColumns, ...columns])];
        
        Object.entries(processDataMap).forEach(([processName, processData]) => {
          const processRows = processData.map(record => {
            const row: any = {};
            
            // Add all columns (including defaults and process-specific)
            allColumnsWithDefaults.forEach((column: string) => {
              if (column.includes('.')) {
                const [colProcessName, fieldName] = column.split('.');
                
                if (colProcessName === processName) {
                  // This column belongs to the current process
                  row[column] = record[fieldName] || 'N/A';
                }
              } else {
                // Handle non-prefixed columns (default employee fields + backward compatibility)
                if (record[column] !== undefined) {
                  row[column] = record[column];
                } else {
                  row[column] = 'N/A';
                }
              }
            });
            
            return row;
          });
          
          processGroups[processName] = processRows;
        });
        
        // Format result for separate table display
        resultData = {
          tablesByProcess: processGroups,
          totalRecords: Object.values(processGroups).reduce((sum, data) => sum + data.length, 0)
        };
        
        console.log(`🔍 Multi-Process Report: Generated ${resultData.totalRecords} total rows in ${Object.keys(processGroups).length} separate tables`);
        
        resultTableName = `Multi-Process Report (${processes.join(', ')})`;
        
      } else {
        // Single process mode (backward compatibility)
        const selectedTable = tableName || process;
        console.log(`🔍 Single-Process Report: Using table: ${selectedTable}`);
        
        if (!selectedTable) {
          return res.status(400).json({ message: "Process type is required for single-process reports" });
        }
        
        let data = [];
        
        switch (selectedTable) {
          case 'request':
            resultTableName = "Expense Requests";
            const requests = await storage.getExpenseRequests({ orgId });
            data = requests.map((req: any) => ({
              id: req.id,
              title: req.title,
              description: req.description,
              type: req.type,
              estimatedAmount: req.estimatedAmount,
              status: req.status,
              urgency: req.urgency,
              justification: req.justification,
              expectedDate: req.expectedDate,
              createdAt: req.createdAt,
              approvedAt: req.approvedAt,
              userId: req.userId,
              userName: req.user?.firstName || 'N/A',
              approvedBy: req.approvedBy || 'N/A',
              employerName: req.employerName || 'N/A',
              employeeNumber: req.employeeNumber || 'N/A',
              employeeEmail: req.employeeEmail || 'N/A'
            }));
            break;
            
          case 'claim':
            resultTableName = "Expense Claims";
            const claims = await storage.getExpenseClaims({ orgId });
            data = claims.map((claim: any) => ({
              id: claim.id,
              title: claim.title,
              description: claim.description,
              totalAmount: claim.totalAmount,
              balancePayment: claim.balancePayment,
              currency: claim.currency,
              status: claim.status,
              submittedAt: claim.submittedAt,
              approvedAt: claim.approvedAt,
              paidAt: claim.paidAt,
              vendorDueDate: claim.vendorDueDate,
              userId: claim.userId,
              userName: claim.user?.firstName || claim.user?.name || 'N/A',
              approvedBy: claim.approvedBy || 'N/A',
              processedBy: claim.processedBy || 'N/A',
              employerName: claim.employerName || 'N/A',
              employeeNumber: claim.employeeNumber || 'N/A',
              employeeEmail: claim.employeeEmail || 'N/A'
            }));
            break;
            
          case 'payment':
            resultTableName = "Payment Batches";
            const payments = await storage.getPaymentBatches();
            data = payments.map((payment: any) => ({
              id: payment.id,
              name: payment.name,
              description: payment.description,
              totalAmount: payment.totalAmount,
              status: payment.status,
              paymentMethod: payment.paymentMethod,
              scheduledDate: payment.scheduledDate,
              processedAt: payment.processedAt,
              createdAt: payment.createdAt,
              createdBy: payment.createdBy,
              processedBy: payment.processedBy
            }));
            break;
            
          case 'vendor':
            resultTableName = "Vendors";
            const vendors = await storage.getVendors();
            data = vendors.map((vendor: any) => ({
              id: vendor.id,
              name: vendor.name,
              email: vendor.email,
              phone: vendor.phone,
              address: vendor.address,
              city: vendor.city,
              state: vendor.state,
              pincode: vendor.pincode,
              panNumber: vendor.panNumber,
              gstNumber: vendor.gstNumber,
              bankName: vendor.bankName,
              accountNumber: vendor.accountNumber,
              ifscCode: vendor.ifscCode,
              status: vendor.status,
              createdAt: vendor.createdAt,
              employerName: vendor.employerName || 'N/A',
              employeeNumber: vendor.employeeNumber || 'N/A',
              employeeEmail: vendor.employeeEmail || 'N/A'
            }));
            break;
            
          case 'vendorclaim':
            resultTableName = "Vendor Claims";
            const vendorRequests = await storage.getVendorOnboardingRequests();
            data = vendorRequests
              .filter((request: any) => request.orgId === orgId)
              .map((request: any) => ({
                id: request.id,
                requestType: request.requestType,
                companyName: request.companyName,
                contactPerson: request.contactPerson,
                email: request.email,
                phone: request.phone,
                address: request.address,
                gstin: request.gstin,
                pan: request.pan,
                bankName: request.bankName,
                accountNumber: request.accountNumber,
                ifscCode: request.ifscCode,
                status: request.status,
                requestedBy: request.requestedBy,
                createdAt: request.createdAt,
                approvedAt: request.approvedAt,
                approvedBy: request.approvedBy || 'N/A',
                employerName: request.employerName || 'N/A',
                employeeNumber: request.employeeNumber || 'N/A',
                employeeEmail: request.employeeEmail || 'N/A'
              }));
            break;

          case 'pettycash':
            resultTableName = "Petty Cash Transactions";
            const pettyCashTransactions = await storage.getPettyCashTransactions();
            data = pettyCashTransactions
              .filter((transaction: any) => transaction.orgId === orgId)
              .map((transaction: any) => ({
                id: transaction.id,
                cashboxId: transaction.cashboxId,
                type: transaction.type,
                amount: transaction.amount,
                currency: transaction.currency,
                description: transaction.description,
                payee: transaction.payee,
                payeeType: transaction.payeeType,
                category: transaction.category,
                receiptUrl: transaction.receiptUrl,
                transactionDate: transaction.transactionDate,
                recordedBy: transaction.recordedBy,
                approvedBy: transaction.approvedBy || 'N/A',
                status: transaction.status,
                createdAt: transaction.createdAt,
                employerName: transaction.employerName || 'N/A',
                employeeNumber: transaction.employeeNumber || 'N/A',
                employeeEmail: transaction.employeeEmail || 'N/A'
              }));
            break;

          case 'directexpense':
            resultTableName = "Direct Expenses";
            const directExpensesList = await storage.getDirectExpenses();
            data = directExpensesList
              .filter((expense: any) => expense.orgId === orgId)
              .map((expense: any) => ({
                id: expense.id,
                categoryId: expense.categoryId,
                description: expense.description,
                amount: expense.amount,
                currency: expense.currency,
                date: expense.date,
                vendorName: expense.vendorName,
                invoiceNumber: expense.invoiceNumber,
                receiptUrl: expense.receiptUrl,
                status: expense.status,
                createdBy: expense.createdBy,
                approvedBy: expense.approvedBy || 'N/A',
                createdAt: expense.createdAt,
                approvedAt: expense.approvedAt,
                employerName: expense.employerName || 'N/A',
                employeeNumber: expense.employeeNumber || 'N/A',
                employeeEmail: expense.employeeEmail || 'N/A'
              }));
            break;
            
          default:
            return res.status(400).json({ message: "Invalid process type" });
        }
        
        // Apply filters for single process
        if (filters && Object.keys(filters).length > 0) {
          data = data.filter((item: any) => {
            return Object.entries(filters).every(([key, value]) => {
              if (key === 'period') return true;
              if (!value || value === '') return true;
              
              const itemValue = item[key];
              if (itemValue === null || itemValue === undefined) return false;
              
              if (Array.isArray(value)) {
                if (value.length === 0) return true;
                return value.some(filterValue => {
                  const itemStr = itemValue.toString().toLowerCase().trim();
                  const filterStr = filterValue.toString().toLowerCase().trim();
                  return itemStr === filterStr;
                });
              }
              
              const itemStr = itemValue.toString().toLowerCase().trim();
              const filterStr = value.toString().toLowerCase().trim();
              return itemStr === filterStr;
            });
          });
        }
        
        // Apply period filtering
        if (period && period !== 'all') {
          const now = new Date();
          let startDate = new Date();
          
          switch (period) {
            case 'thisMonth':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            case 'lastMonth':
              startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
              data = data.filter((item: any) => {
                const itemDate = new Date(item.createdAt);
                return itemDate >= startDate && itemDate <= endDate;
              });
              break;
            case 'thisQuarter':
              const quarter = Math.floor(now.getMonth() / 3);
              startDate = new Date(now.getFullYear(), quarter * 3, 1);
              break;
            case 'thisYear':
              startDate = new Date(now.getFullYear(), 0, 1);
              break;
          }
          
          if (period !== 'lastMonth') {
            data = data.filter((item: any) => new Date(item.createdAt) >= startDate);
          }
        }
        
        // Select only requested columns for single process
        resultData = data.map((item: any) => {
          const filteredItem: any = {};
          columns.forEach((column: string) => {
            filteredItem[column] = item[column];
          });
          return filteredItem;
        });
      }
      
      // Handle response format for multi-process vs single process
      if (isMultiProcess && typeof resultData === 'object' && resultData.tablesByProcess) {
        console.log(`🔍 Final Report: Generated ${resultData.totalRecords} records across ${Object.keys(resultData.tablesByProcess).length} processes`);
        console.log(`🔍 Final Report: Process breakdown:`, Object.entries(resultData.tablesByProcess).map(([proc, data]) => `${proc}: ${data.length} records`));
        
        // Get the allColumnsWithDefaults from the multi-process logic
        const defaultEmployeeColumns = ['employerName', 'employeeNumber', 'employeeEmail'];
        const allColumnsWithDefaults = [...new Set([...defaultEmployeeColumns, ...columns])];
        
        res.json({
          tableName: resultTableName,
          columns: allColumnsWithDefaults,
          data: resultData.tablesByProcess,
          totalRecords: resultData.totalRecords,
          isMultiProcess: true,
          processes: Object.keys(resultData.tablesByProcess)
        });
      } else {
        console.log(`🔍 Final Report: Generated ${Array.isArray(resultData) ? resultData.length : 0} records`);
        console.log(`🔍 Final Report: Sample row:`, Array.isArray(resultData) ? resultData[0] : resultData);
        
        res.json({
          tableName: resultTableName,
          columns,
          data: resultData,
          totalRecords: Array.isArray(resultData) ? resultData.length : 0,
          isMultiProcess: false
        });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // ===================== CUSTOM REPORTS API =====================

  // Save/Publish a custom report
  app.post("/api/custom-reports", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      console.log("🔍 Save Custom Report - Received data:", JSON.stringify(req.body, null, 2));
      console.log("🔍 Save Custom Report - selectedColumns length from frontend:", req.body.selectedColumns?.length || 0);
      console.log("🔍 Save Custom Report - columns (if any) from frontend:", req.body.columns?.length || 0);
      
      // Map allowedRoles to sharedRoles for database compatibility
      const { allowedRoles, ...rest } = req.body;
      const reportData = {
        ...rest,
        sharedRoles: allowedRoles || [],
        ownerId: userId,
        orgId: orgId
      };
      
      console.log("🔍 Save Custom Report - Final data to save:", JSON.stringify(reportData, null, 2));
      console.log("🔍 Save Custom Report - Final selectedColumns length:", reportData.selectedColumns?.length || 0);

      const savedReport = await storage.saveCustomReport(reportData);
      console.log("🔍 Save Custom Report - Saved report selectedColumns length:", savedReport.selectedColumns?.length || 0);
      console.log("🔍 Save Custom Report - Saved report full:", JSON.stringify(savedReport, null, 2));
      res.json(savedReport);
    } catch (error) {
      console.error("Error saving custom report:", error);
      res.status(500).json({ message: "Failed to save report" });
    }
  });

  // Get saved reports for user/organization
  app.get("/api/custom-reports", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      const { process, visibility } = req.query;

      const reports = await storage.getCustomReports({
        ownerId: userId,
        orgId: orgId,
        process: process as string,
        visibility: visibility as string
      });

      // Filter role-based reports based on user permissions
      const userWorkflowRole = getWorkflowRole(req);
      const filteredReports = reports.filter(report => {
        // Allow private reports owned by the user
        if (report.visibility === "private" && report.ownerId === userId) {
          return true;
        }
        
        // Allow shared reports within the org
        if (report.visibility === "shared") {
          return true;
        }
        
        // For role-based reports, check if user has required role
        if (report.visibility === "role-based" && report.sharedRoles && Array.isArray(report.sharedRoles)) {
          return report.sharedRoles.includes(userWorkflowRole);
        }
        
        // Default allow if no role restrictions
        return true;
      });

      res.json(filteredReports);
    } catch (error) {
      console.error("Error fetching custom reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Get specific custom report by ID
  app.get("/api/custom-reports/:id", requireAuth, async (req: any, res) => {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;

      const report = await storage.getCustomReport(id);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Check if user has access to this report
      if (report.orgId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // For role-based visibility, check if user has the required roles
      if (report.visibility === "role-based" && report.sharedRoles && Array.isArray(report.sharedRoles)) {
        const userWorkflowRole = getWorkflowRole(req);
        const userHasAccess = report.sharedRoles.includes(userWorkflowRole);
        
        if (!userHasAccess) {
          return res.status(403).json({ message: "Insufficient role permissions to access this report" });
        }
      }

      res.json(report);
    } catch (error) {
      console.error("Error fetching custom report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // Update custom report
  app.put("/api/custom-reports/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      const { id } = req.params;

      // Check if report exists and user owns it
      const existingReport = await storage.getCustomReport(id);
      if (!existingReport) {
        return res.status(404).json({ message: "Report not found" });
      }

      if (existingReport.ownerId !== userId || existingReport.orgId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedReport = await storage.updateCustomReport(id, req.body);
      res.json(updatedReport);
    } catch (error) {
      console.error("Error updating custom report:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // Delete custom report
  app.delete("/api/custom-reports/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      const { id } = req.params;

      // Check if report exists and user owns it
      const existingReport = await storage.getCustomReport(id);
      if (!existingReport) {
        return res.status(404).json({ message: "Report not found" });
      }

      if (existingReport.ownerId !== userId || existingReport.orgId !== orgId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deleted = await storage.deleteCustomReport(id);
      
      if (deleted) {
        res.json({ message: "Report deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete report" });
      }
    } catch (error) {
      console.error("Error deleting custom report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // ========== OCR ENDPOINTS ==========
  
  // Upload and process receipt/bill with OCR
  app.post("/api/ocr/process", requireAuth, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = getUserId(req);
      const { module, description } = req.body;

      console.log(`📸 Processing OCR for file: ${req.file.originalname} (${req.file.size} bytes)`);

      // Process file with OCR
      const fs = await import('fs');
      const fileBuffer = fs.readFileSync(req.file.path);
      const ocrData = await ocrService.processImage(
        fileBuffer,
        req.file.originalname,
        req.file.mimetype,
        module || 'general'
      );

      // Save OCR result to database with temp ID
      const tempId = `temp_${Date.now()}`;
      const ocrResultData = {
        id: tempId,
        fileName: req.file.originalname,
        fileUrl: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        status: 'completed',
        extractedData: ocrData,
        confidenceScore: ocrData.confidence?.overall ? (ocrData.confidence.overall * 100).toString() : '80',
        processingMethod: 'tesseract',
        processingTimeMs: 0,
        userId: userId,
        orgId: '13',
        module: module || 'employee_claims',
        amount: ocrData.amount ? ocrData.amount.toString() : null,
        vendorName: ocrData.vendorName || null,
        invoiceNumber: ocrData.invoiceNumber || null,
        description: ocrData.description || null,
        date: ocrData.date ? new Date(ocrData.date) : null
      };

      // Insert temp OCR result into database
      const savedOcrResult = await storage.createOcrResult(ocrResultData);
      console.log(`✅ OCR processing completed and saved to database for user ${userId} with ID: ${tempId}`);
      
      res.json({
        message: "OCR processing completed",
        result: {
          id: tempId,
          originalFileName: req.file.originalname,
          extractedData: ocrData,
          confidence: ocrData.confidence?.overall || 0.8,
          status: 'completed',
          isConfirmed: false,
          filePath: req.file.path,
          createdAt: savedOcrResult.createdAt?.toISOString() || new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("❌ OCR processing error:", error);
      res.status(500).json({ 
        message: "Failed to process image", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get OCR results for user
  app.get("/api/ocr/results", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { module } = req.query;

      const results = await storage.getOcrResultsByUser(userId, module as string);
      res.json(results);
    } catch (error) {
      console.error("Error fetching OCR results:", error);
      res.status(500).json({ message: "Failed to fetch OCR results" });
    }
  });

  // Get specific OCR result
  app.get("/api/ocr/results/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const result = await storage.getOcrResult(id);
      
      if (!result) {
        return res.status(404).json({ message: "OCR result not found" });
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching OCR result:", error);
      res.status(500).json({ message: "Failed to fetch OCR result" });
    }
  });

  // Confirm OCR extracted data
  app.post("/api/ocr/confirm/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const { confirmedData } = req.body;

      console.log(`✅ OCR data confirmed for ${id} by user ${userId}`);
      console.log(`📤 RETURNING confirmed data for auto-fill:`, JSON.stringify(confirmedData, null, 2));
      
      // Return the confirmedData directly in the format expected by auto-fill
      res.json({
        message: "OCR data confirmed successfully",
        confirmedData: confirmedData, // Direct access for auto-fill
        result: {
          id,
          userId,
          confirmedData,
          confirmedAt: new Date().toISOString(),
          status: 'confirmed'
        }
      });
    } catch (error) {
      console.error("Error confirming OCR data:", error);
      res.status(500).json({ message: "Failed to confirm OCR data" });
    }
  });

  // Save OCR data with claim title mapping
  app.post("/api/ocr/save-with-title/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = getUserId(req);
      const { claimTitle } = req.body;

      if (!claimTitle || !claimTitle.trim()) {
        return res.status(400).json({ message: "Claim title is required" });
      }

      console.log(`💾 Saving OCR data ${id} with claim title: "${claimTitle}" by user ${userId}`);

      // Update the OCR result with claim title
      await storage.updateOcrResultClaimTitle(id, claimTitle.trim(), userId);
      
      res.json({
        message: "OCR data saved with claim title successfully",
        ocrId: id,
        claimTitle: claimTitle.trim(),
        savedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving OCR data with claim title:", error);
      res.status(500).json({ message: "Failed to save OCR data with claim title" });
    }
  });

  // Lookup OCR data by claim title
  app.get("/api/ocr/by-claim-title/:title", requireAuth, async (req: any, res) => {
    try {
      const { title } = req.params;
      const userId = getUserId(req);

      console.log(`🔍 Looking up OCR data by claim title: "${title}" for user ${userId}`);

      const ocrData = await storage.getOcrResultByClaimTitle(title, userId);
      
      if (!ocrData) {
        return res.status(404).json({ message: "No OCR data found for this claim title" });
      }

      // Apply smart mapping to the extracted data
      const { smartMapOcrData } = await import('./lib/ocrMapping.js');
      let mappedData = {};
      
      if (ocrData.extractedData?.extractedData) {
        mappedData = smartMapOcrData(ocrData.extractedData.extractedData);
      } else if (ocrData.extractedData) {
        mappedData = smartMapOcrData(ocrData.extractedData);
      }

      console.log(`📤 Returning mapped OCR data for claim title "${title}":`, mappedData);

      res.json({
        ocrId: ocrData.id,
        claimTitle: title,
        originalData: ocrData.extractedData,
        mappedData: mappedData,
        confidence: ocrData.confidence,
        fileName: ocrData.fileName
      });
    } catch (error) {
      console.error("Error looking up OCR data by claim title:", error);
      res.status(500).json({ message: "Failed to lookup OCR data" });
    }
  });

  // ========== CASH FLOW PROJECTIONS API ==========

  // Get historical cash flow data
  app.get("/api/cash-flow/historical", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }

      const { startDate, endDate, period = "monthly" } = req.query;
      
      // Get historical financial data
      const historicalData = await storage.getHistoricalCashFlow(startDate, endDate, period);
      
      res.json(historicalData);
    } catch (error) {
      console.error("Error fetching historical cash flow:", error);
      res.status(500).json({ message: "Failed to fetch historical cash flow data" });
    }
  });

  // Get cash flow projections
  app.get("/api/cash-flow/projections", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }

      const { months = 6, method = "trend" } = req.query;
      
      // Get projections based on historical data
      const projections = await storage.getCashFlowProjections(parseInt(months), method);
      
      res.json(projections);
    } catch (error) {
      console.error("Error generating cash flow projections:", error);
      res.status(500).json({ message: "Failed to generate cash flow projections" });
    }
  });

  // Get cash flow summary and insights
  app.get("/api/cash-flow/summary", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }

      const { period = "last12months" } = req.query;
      
      // Get summary with insights
      const summary = await storage.getCashFlowSummary(period);
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching cash flow summary:", error);
      res.status(500).json({ message: "Failed to fetch cash flow summary" });
    }
  });

  // ========== TUTORIAL API ==========

  // Get user tutorial progress
  app.get("/api/tutorials/progress", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      if (!userId || !orgId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }

      const progress = await storage.getUserTutorialProgress(userId, orgId);
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching tutorial progress:", error);
      res.status(500).json({ message: "Failed to fetch tutorial progress" });
    }
  });

  // Mark tutorial step as completed
  app.post("/api/tutorials/complete", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      if (!userId || !orgId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }

      const { tutorialName, stepId } = req.body;
      
      if (!tutorialName || !stepId) {
        return res.status(400).json({ message: "Tutorial name and step ID are required" });
      }

      const tutorial = await storage.markTutorialCompleted({
        userId,
        orgId,
        tutorialName,
        stepId
      });
      
      res.json({ message: "Tutorial step marked as completed", tutorial });
    } catch (error) {
      console.error("Error marking tutorial as completed:", error);
      res.status(500).json({ message: "Failed to mark tutorial as completed" });
    }
  });

  // Mark tutorial step as skipped
  app.post("/api/tutorials/skip", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      if (!userId || !orgId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }

      const { tutorialName, stepId } = req.body;
      
      if (!tutorialName || !stepId) {
        return res.status(400).json({ message: "Tutorial name and step ID are required" });
      }

      const tutorial = await storage.markTutorialSkipped(userId, orgId, tutorialName, stepId);
      
      res.json({ message: "Tutorial step marked as skipped", tutorial });
    } catch (error) {
      console.error("Error marking tutorial as skipped:", error);
      res.status(500).json({ message: "Failed to mark tutorial as skipped" });
    }
  });

  // Disable all tutorials for user
  app.post("/api/tutorials/disable-all", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      if (!userId || !orgId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }

      await storage.disableAllTutorials(userId, orgId);
      
      res.json({ message: "All tutorials disabled successfully" });
    } catch (error) {
      console.error("Error disabling tutorials:", error);
      res.status(500).json({ message: "Failed to disable tutorials" });
    }
  });

  // Enable all tutorials for user (reset tutorial state)
  app.post("/api/tutorials/enable-all", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      if (!userId || !orgId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }

      await storage.enableAllTutorials(userId, orgId);
      
      res.json({ message: "All tutorials enabled successfully" });
    } catch (error) {
      console.error("Error enabling tutorials:", error);
      res.status(500).json({ message: "Failed to enable tutorials" });
    }
  });

  // Check if tutorials are disabled for user
  app.get("/api/tutorials/disabled", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      if (!userId || !orgId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }

      const disabled = await storage.checkTutorialDisabled(userId, orgId);
      
      res.json({ disabled });
    } catch (error) {
      console.error("Error checking tutorial disabled status:", error);
      res.status(500).json({ message: "Failed to check tutorial status" });
    }
  });

  // Check if user is first-time user
  app.get("/api/tutorials/first-time", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      if (!userId || !orgId) {
        return res.status(401).json({ message: "JWT Authentication required" });
      }

      const isFirstTime = await storage.isFirstTimeUser(userId, orgId);
      
      res.json({ isFirstTime });
    } catch (error) {
      console.error("Error checking first-time user status:", error);
      res.status(500).json({ message: "Failed to check user status" });
    }
  });

  // Start a tutorial
  app.post("/api/tutorials/start", requireAuth, async (req: any, res) => {
    console.log(`🚀 TUTORIAL START ENDPOINT HIT - Body:`, req.body);
    
    try {
      const { tutorialName } = req.body;
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      console.log(`🚀 Parsed data - tutorialName: ${tutorialName}, userId: ${userId}, orgId: ${orgId}`);
      
      if (!userId || !orgId) {
        console.log(`❌ Auth failed - userId: ${userId}, orgId: ${orgId}`);
        return res.status(401).json({ message: "JWT Authentication required" });
      }

      if (!tutorialName) {
        console.log(`❌ Missing tutorial name`);
        return res.status(400).json({ message: "Tutorial name is required" });
      }

      // Log the tutorial start request for debugging
      console.log(`🎯 Starting tutorial: ${tutorialName} for user ${userId} in org ${orgId}`);
      
      // Create initial tutorial progress record to mark tutorial as started
      const tutorialData = {
        userId,
        orgId,
        tutorialName,
        stepId: 'started',
        isCompleted: false,
        stepProgress: 1
      };
      
      console.log(`🎯 Tutorial data to insert:`, tutorialData);
      
      const tutorial = await storage.startTutorial(tutorialData);
      
      console.log(`✅ Tutorial created successfully:`, tutorial);
      
      res.json({ message: "Tutorial started successfully", tutorial });
    } catch (error) {
      console.error("❌ Error starting tutorial:", error);
      res.status(500).json({ message: "Failed to start tutorial", error: error.message });
    }
  });

  // ===== PRODUCT TOUR API ROUTES =====

  // Complete a tour
  app.post("/api/tours/:tourId/complete", requireAuth, async (req: any, res) => {
    try {
      const { tourId } = req.params;
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      if (!userId || !orgId) {
        return res.status(400).json({ message: "User ID and Organization ID required" });
      }

      // Record tour completion
      await storage.markTutorialCompleted(userId, orgId, tourId);
      
      res.json({ 
        message: "Tour completed successfully",
        tourId,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error completing tour:", error);
      res.status(500).json({ message: "Failed to complete tour" });
    }
  });

  // Skip a tour
  app.post("/api/tours/:tourId/skip", requireAuth, async (req: any, res) => {
    try {
      const { tourId } = req.params;
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      if (!userId || !orgId) {
        return res.status(400).json({ message: "User ID and Organization ID required" });
      }

      // Record tour as skipped
      await storage.markTutorialSkipped(userId, orgId, tourId);
      
      res.json({ 
        message: "Tour skipped successfully",
        tourId,
        skippedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error skipping tour:", error);
      res.status(500).json({ message: "Failed to skip tour" });
    }
  });

  // Get tour progress for current user
  app.get("/api/tours/progress", requireAuth, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const orgId = getOrgId(req);
      
      if (!userId || !orgId) {
        return res.status(400).json({ message: "User ID and Organization ID required" });
      }

      const progress = await storage.getTutorialProgress(userId, orgId);
      res.json(progress || []);
    } catch (error) {
      console.error("Error fetching tour progress:", error);
      res.status(500).json({ message: "Failed to fetch tour progress" });
    }
  });

  // Download Routes for Documentation
  app.get('/api/download/user-manual.pdf', (req, res) => {
    try {
      // In a real implementation, this would serve an actual PDF file
      // For now, we'll redirect to the user manual page or provide a placeholder
      const pdfPath = path.join(process.cwd(), 'public', 'user-manual.pdf');
      
      // Check if PDF exists, otherwise send a response indicating it should be generated
      if (fs.existsSync(pdfPath)) {
        res.download(pdfPath, 'expense-management-user-manual.pdf');
      } else {
        // Generate or return a placeholder response
        res.status(404).json({
          success: false,
          message: 'PDF manual is being generated. Please use the online version at /user-manual',
          onlineVersion: '/user-manual'
        });
      }
    } catch (error) {
      console.error('Error downloading user manual:', error);
      res.status(500).json({
        success: false,
        message: 'Error downloading user manual'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
