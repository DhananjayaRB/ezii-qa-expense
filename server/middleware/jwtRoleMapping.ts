import { Request } from 'express';
import { getUserRole } from './jwtAuth';

// Role mapping configuration
// Maps JWT role_name (case-insensitive) to system workflow roles
const JWT_TO_WORKFLOW_ROLE_MAPPING: Record<string, string> = {
  // JWT role_name -> Workflow Role Name
  'admin': 'Admin',
  'accountant': 'Accountant', 
  'employee': 'Employees',
  'employees': 'Employees',
  'manager': 'Admin', // Map manager to Admin role
  'head': 'Admin', // Map head to Admin role
};

/**
 * Maps JWT role_name to corresponding workflow role (case-insensitive)
 * @param jwtRole - The role from JWT token (e.g., "admin", "Admin", "ADMIN")
 * @returns The corresponding workflow role name or null if no mapping found
 */
export function mapJWTRoleToWorkflowRole(jwtRole: string): string | null {
  if (!jwtRole) return null;
  
  // Convert to lowercase for case-insensitive lookup
  const normalizedRole = jwtRole.toLowerCase();
  return JWT_TO_WORKFLOW_ROLE_MAPPING[normalizedRole] || null;
}

/**
 * Gets the mapped workflow role for the current JWT user
 * @param req - Express request object with JWT user data
 * @returns The mapped workflow role name or null
 */
export function getWorkflowRole(req: Request): string | null {
  const jwtRole = getUserRole(req);
  if (!jwtRole) return null;
  
  return mapJWTRoleToWorkflowRole(jwtRole);
}

/**
 * Checks if JWT user has admin privileges (mapped to Admin workflow role)
 * @param req - Express request object
 * @returns true if user has admin privileges
 */
export function hasAdminRole(req: Request): boolean {
  const jwtRole = getUserRole(req);
  const workflowRole = getWorkflowRole(req);
  
  // Check JWT-based admin role first (new system)
  if (workflowRole === 'Admin') {
    console.log('🔍 hasAdminRole debug (JWT):', {
      jwtRole,
      workflowRole,
      hasJwtUser: !!req.jwtUser,
      result: true
    });
    return true;
  }
  
  // Fallback to session-based admin check (legacy system)
  if (req.user && req.user.role === 'admin') {
    console.log('🔍 hasAdminRole debug (Session):', {
      sessionUser: req.user.id,
      sessionRole: req.user.role,
      result: true
    });
    return true;
  }
  
  console.log('🔍 hasAdminRole debug (Failed):', {
    jwtRole,
    workflowRole,
    hasJwtUser: !!req.jwtUser,
    sessionRole: req.user?.role,
    result: false
  });
  
  return false;
}

/**
 * Checks if JWT user has accountant privileges
 * @param req - Express request object
 * @returns true if user has accountant privileges
 */
export function hasAccountantRole(req: Request): boolean {
  const workflowRole = getWorkflowRole(req);
  return workflowRole === 'Accountant';
}

/**
 * Checks if JWT user has employee privileges
 * @param req - Express request object
 * @returns true if user has employee privileges
 */
export function hasEmployeeRole(req: Request): boolean {
  const workflowRole = getWorkflowRole(req);
  return workflowRole === 'Employees';
}

/**
 * Checks if JWT user has any of the specified workflow roles
 * @param req - Express request object
 * @param allowedRoles - Array of allowed workflow role names
 * @returns true if user has any of the allowed roles
 */
export function hasAnyWorkflowRole(req: Request, allowedRoles: string[]): boolean {
  const userWorkflowRole = getWorkflowRole(req);
  if (!userWorkflowRole) return false;
  
  return allowedRoles.includes(userWorkflowRole);
}

/**
 * Role-based access control helper for admin-only routes
 * @param req - Express request object
 * @returns true if user has admin access, false otherwise
 */
export function requireAdminRole(req: Request): boolean {
  return hasAdminRole(req);
}

/**
 * Role-based access control helper for accountant or admin routes
 * @param req - Express request object
 * @returns true if user has accountant or admin access
 */
export function requireAccountantOrAdminRole(req: Request): boolean {
  return hasAccountantRole(req) || hasAdminRole(req);
}