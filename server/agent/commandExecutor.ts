import { db } from "../db";
import { expenseClaims, expenseRequests, users } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface ExecutionResult {
  success: boolean;
  message: string;
  data?: any;
}

export class CommandExecutor {
  async execute(intent: any, userId: string): Promise<ExecutionResult> {
    try {
      switch (intent.target) {
        case 'approve_all_pending':
          return await this.approveAllPending(userId);
        case 'approve_claims':
          return await this.approveClaims(intent.parameters, userId);
        case 'approve_claim':
          return await this.approveClaim(intent.parameters, userId);
        case 'approve_request':
          return await this.approveRequest(intent.parameters, userId);
        case 'approve_batches':
          return await this.approveBatches(userId);
        case 'approve_batch':
          return await this.approveBatch(intent.parameters, userId);
        default:
          return { 
            success: false, 
            message: "This action isn't supported yet, but I'm learning new commands!" 
          };
      }
    } catch (error) {
      console.error('Command executor error:', error);
      return {
        success: false,
        message: "Sorry, I encountered an error while trying to execute that command. Please try again."
      };
    }
  }

  private async approveAllPending(userId: string): Promise<ExecutionResult> {
    try {
      // Get all pending requests
      const pendingRequests = await db.select({
        id: expenseRequests.id,
        title: expenseRequests.title,
        estimatedAmount: expenseRequests.estimatedAmount,
        userName: users.firstName
      })
      .from(expenseRequests)
      .leftJoin(users, eq(expenseRequests.userId, users.id))
      .where(eq(expenseRequests.status, 'pending'))
      .limit(20);

      // Get all pending claims  
      const pendingClaims = await db.select({
        id: expenseClaims.id,
        title: expenseClaims.title,
        totalAmount: expenseClaims.totalAmount,
        userName: users.firstName
      })
      .from(expenseClaims)
      .leftJoin(users, eq(expenseClaims.userId, users.id))
      .where(eq(expenseClaims.status, 'pending'))
      .limit(20);

      let approvedCount = 0;
      let totalAmount = 0;
      const approvedItems: string[] = [];

      // Approve all pending requests
      for (const request of pendingRequests) {
        try {
          await db.update(expenseRequests)
            .set({ 
              status: 'approved',
              approvedBy: userId,
              approvedAt: new Date()
            })
            .where(eq(expenseRequests.id, request.id));
          
          approvedCount++;
          totalAmount += parseFloat(request.estimatedAmount || '0');
          approvedItems.push(`${request.title} by ${request.userName} - ₹${parseFloat(request.estimatedAmount || '0').toLocaleString()}`);
        } catch (error) {
          console.error(`Failed to approve request ${request.id}:`, error);
        }
      }

      // Approve all pending claims
      for (const claim of pendingClaims) {
        try {
          await db.update(expenseClaims)
            .set({ 
              status: 'approved',
              approvedBy: userId,
              approvedAt: new Date()
            })
            .where(eq(expenseClaims.id, claim.id));
          
          approvedCount++;
          totalAmount += parseFloat(claim.totalAmount || '0');
          approvedItems.push(`${claim.title} by ${claim.userName} - ₹${parseFloat(claim.totalAmount || '0').toLocaleString()}`);
        } catch (error) {
          console.error(`Failed to approve claim ${claim.id}:`, error);
        }
      }

      if (approvedCount === 0) {
        return {
          success: true,
          message: "Great! There were no pending items to approve. Everything is up to date!",
          data: { approvedCount: 0, totalAmount: 0 }
        };
      }

      return {
        success: true,
        message: `✅ Successfully approved ${approvedCount} items worth ₹${totalAmount.toLocaleString()}! Here's what I approved:\n\n${approvedItems.join('\n')}`,
        data: { 
          approvedCount, 
          totalAmount,
          approvedItems: approvedItems
        }
      };

    } catch (error) {
      console.error('Error approving all pending items:', error);
      return {
        success: false,
        message: "I encountered an error while trying to approve the pending items. Please check the dashboard and try again."
      };
    }
  }

  private async approveClaims(parameters: any, userId: string): Promise<ExecutionResult> {
    const maxAmount = parameters.amount;
    
    let query = db.select({
      id: expenseClaims.id,
      title: expenseClaims.title,
      totalAmount: expenseClaims.totalAmount,
      userName: users.firstName
    })
    .from(expenseClaims)
    .leftJoin(users, eq(expenseClaims.userId, users.id))
    .where(eq(expenseClaims.status, 'pending'));

    if (maxAmount) {
      query = query.where(and(
        eq(expenseClaims.status, 'pending'),
        sql`CAST(${expenseClaims.totalAmount} AS DECIMAL) <= ${maxAmount}`
      )) as any;
    }

    const claims = await query.limit(20);
    
    let approvedCount = 0;
    let totalAmount = 0;

    for (const claim of claims) {
      try {
        await db.update(expenseClaims)
          .set({ 
            status: 'approved',
            approvedBy: userId,
            approvedAt: new Date()
          })
          .where(eq(expenseClaims.id, claim.id));
        
        approvedCount++;
        totalAmount += parseFloat(claim.totalAmount || '0');
      } catch (error) {
        console.error(`Failed to approve claim ${claim.id}:`, error);
      }
    }

    const amountText = maxAmount ? ` under ₹${maxAmount.toLocaleString()}` : '';
    
    return {
      success: true,
      message: `✅ Approved ${approvedCount} expense claims${amountText}, totaling ₹${totalAmount.toLocaleString()}!`,
      data: { approvedCount, totalAmount }
    };
  }

  private async approveClaim(parameters: any, userId: string): Promise<ExecutionResult> {
    const claimId = parameters.id;
    
    if (!claimId) {
      return {
        success: false,
        message: "I need a claim ID to approve a specific claim. Try: 'approve claim [claim-id]'"
      };
    }

    const claim = await db.select()
      .from(expenseClaims)
      .where(eq(expenseClaims.id, claimId))
      .limit(1);

    if (claim.length === 0) {
      return {
        success: false,
        message: `I couldn't find a claim with ID ${claimId}. Please check the ID and try again.`
      };
    }

    if (claim[0].status !== 'pending') {
      return {
        success: false,
        message: `This claim is already ${claim[0].status}. Only pending claims can be approved.`
      };
    }

    await db.update(expenseClaims)
      .set({ 
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date()
      })
      .where(eq(expenseClaims.id, claimId));

    return {
      success: true,
      message: `✅ Successfully approved expense claim "${claim[0].title}" worth ₹${parseFloat(claim[0].totalAmount || '0').toLocaleString()}!`,
      data: claim[0]
    };
  }

  private async approveRequest(parameters: any, userId: string): Promise<ExecutionResult> {
    const requestId = parameters.id;
    
    if (!requestId) {
      return {
        success: false,
        message: "I need a request ID to approve a specific request. Try: 'approve request [request-id]'"
      };
    }

    const request = await db.select()
      .from(expenseRequests)
      .where(eq(expenseRequests.id, requestId))
      .limit(1);

    if (request.length === 0) {
      return {
        success: false,
        message: `I couldn't find a request with ID ${requestId}. Please check the ID and try again.`
      };
    }

    if (request[0].status !== 'pending') {
      return {
        success: false,
        message: `This request is already ${request[0].status}. Only pending requests can be approved.`
      };
    }

    await db.update(expenseRequests)
      .set({ 
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date()
      })
      .where(eq(expenseRequests.id, requestId));

    return {
      success: true,
      message: `✅ Successfully approved expense request "${request[0].title}" worth ₹${parseFloat(request[0].estimatedAmount || '0').toLocaleString()}!`,
      data: request[0]
    };
  }

  private async approveBatches(userId: string): Promise<ExecutionResult> {
    return {
      success: false,
      message: "Batch approval feature is not yet implemented. I'm still learning this capability!"
    };
  }

  private async approveBatch(parameters: any, userId: string): Promise<ExecutionResult> {
    return {
      success: false,
      message: "Individual batch approval feature is not yet implemented. I'm still learning this capability!"
    };
  }
}