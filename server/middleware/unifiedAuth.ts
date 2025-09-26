import { Request, Response, NextFunction } from 'express';
import { getUserId, getUserRole, getOrgId } from './jwtAuth';
import { getWorkflowRole, hasAdminRole } from './jwtRoleMapping';

// JWT-only authentication middleware - NO session auth fallback
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated via JWT ONLY
    const jwtUserId = getUserId(req);
    const jwtOrgId = getOrgId(req);
    const jwtRole = getUserRole(req);
    
    if (jwtUserId && jwtOrgId && jwtRole) {
      const workflowRole = getWorkflowRole(req);
      
      // Set req.user object for use in route handlers
      (req as any).user = {
        userId: jwtUserId,
        orgId: jwtOrgId,
        role: jwtRole,
        workflowRole: workflowRole
      };
      
      console.log('✅ JWT Auth successful:', { 
        userId: jwtUserId, 
        orgId: jwtOrgId, 
        jwtRole: jwtRole,
        mappedWorkflowRole: workflowRole 
      });
      return next();
    }
    
    // No valid JWT authentication found - reject request
    console.log('❌ No valid JWT authentication found');
    return res.status(401).json({ message: 'JWT Authentication required' });
    
  } catch (error) {
    console.error('JWT Auth middleware error:', error);
    return res.status(401).json({ message: 'JWT Authentication failed' });
  }
};