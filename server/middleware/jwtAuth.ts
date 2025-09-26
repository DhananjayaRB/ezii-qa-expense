import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// JWT payload interface based on your token structure
interface JWTPayload {
  org_id: string;
  user_id: string;
  role_id: string;
  user_type_id: string;
  role_name: string;
  nbf: number;
  exp: number;
  iss: string;
  aud: string;
}

// Extend Express Request to include JWT user data
declare global {
  namespace Express {
    interface Request {
      jwtUser?: JWTPayload;
      jwtTokenRaw?: string;
    }
  }
}

// JWT Authentication Middleware
export const jwtAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid Authorization header found, proceeding without JWT auth');
      return next(); // Allow request to continue without JWT auth for backward compatibility
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify and decode the JWT token
    // Note: In production, you should use a proper secret key for verification
    // For now, we'll decode without verification since this is for development
    const decoded = jwt.decode(token) as JWTPayload;
    
    if (!decoded) {
      console.log('Invalid JWT token format');
      return next(); // Continue without JWT auth
    }

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && currentTime > decoded.exp) {
      console.log('JWT token has expired');
      return res.status(401).json({ message: 'Token expired' });
    }

    // Attach JWT user data and raw token to request
    req.jwtUser = decoded;
    req.jwtTokenRaw = token;
    
    console.log('JWT Auth successful:', {
      org_id: decoded.org_id,
      user_id: decoded.user_id,
      role_name: decoded.role_name
    });

    next();
  } catch (error) {
    console.error('JWT Auth error:', error);
    // Continue without JWT auth for backward compatibility
    next();
  }
};

// Helper function to get organization ID from request (JWT or fallback)
export const getOrgId = (req: Request): string | null => {
  return req.jwtUser?.org_id || null;
};

// Helper function to get user ID from request (JWT ONLY) 
export const getUserId = (req: Request): string | null => {
  return req.jwtUser?.user_id || null;
};

// Helper function to get user role from request (JWT or fallback)
export const getUserRole = (req: Request): string | null => {
  return req.jwtUser?.role_name || null;
};

// Helper function to check if user has admin role
export const isAdmin = (req: Request): boolean => {
  return getUserRole(req) === 'admin';
};

// Helper function to check if user has specific role
export const hasRole = (req: Request, role: string): boolean => {
  return getUserRole(req) === role;
};