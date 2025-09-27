import { Request, Response, NextFunction } from 'express';
import { getUserId, getUserRole, getOrgId } from './jwtAuth';
import { getWorkflowRole, hasAdminRole } from './jwtRoleMapping';
import { getUserProfile } from '../services/userProfileService';

// Extend Express Request to include user profile data
declare global {
  namespace Express {
    interface Request {
      userProfile?: {
        employer_name: string;
        employee_number: string;
        email: string;
        organization_name?: string;
        org_id?: string;
      };
    }
  }
}

// JWT-only authentication middleware - NO session auth fallback
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated via JWT ONLY
    const jwtUserId = getUserId(req);
    const jwtOrgId = getOrgId(req);
    const jwtRole = getUserRole(req);
    
    if (jwtUserId && jwtOrgId && jwtRole) {
      const workflowRole = getWorkflowRole(req);
      
      // Fetch user profile data from external API
      let userProfile = null;
      const jwtToken = req.jwtTokenRaw;
      
      if (jwtToken) {
        try {
          userProfile = await getUserProfile(jwtToken);
          req.userProfile = userProfile || undefined;
          console.log('✅ User profile fetched:', userProfile ? 
            { employer_name: userProfile.employer_name, employee_number: userProfile.employee_number, email: userProfile.email } : 
            'Profile fetch failed'
          );
        } catch (error) {
          console.warn('⚠️ Failed to fetch user profile:', (error as Error).message);
          // Continue without profile data - don't block authentication
        }
      }
      
      // Set req.user object for use in route handlers
      (req as any).user = {
        userId: jwtUserId,
        orgId: jwtOrgId,
        role: jwtRole,
        workflowRole: workflowRole,
        // Include profile data if available
        ...(userProfile && {
          employer_name: userProfile.employer_name,
          employee_number: userProfile.employee_number,
          email: userProfile.email,
          organization_name: userProfile.organization_name,
        })
      };
      
      console.log('✅ JWT Auth successful:', { 
        userId: jwtUserId, 
        orgId: jwtOrgId, 
        jwtRole: jwtRole,
        mappedWorkflowRole: workflowRole,
        profileLoaded: !!userProfile
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