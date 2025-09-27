import { useState, useEffect } from "react";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check for JWT token in localStorage (NO Replit token usage)
    const jwtToken = localStorage.getItem('jwt_token');
    
    if (jwtToken) {
      try {
        // Decode JWT token payload
        const payload = JSON.parse(atob(jwtToken.split('.')[1]));
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && currentTime > payload.exp) {
          console.log('JWT token has expired');
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('org_id');
          localStorage.removeItem('user_id');
          localStorage.removeItem('role_name');
          setUser(null);
        } else {
          // Set user from JWT token payload
          setUser({
            id: payload.user_id,
            user_id: payload.user_id, // Added for tutorial system compatibility
            orgId: payload.org_id,
            role: payload.role_name,
            email: payload.email || '',
            firstName: payload.first_name || '',
            lastName: payload.last_name || ''
          });
        }
      } catch (error) {
        console.error('Error decoding JWT token:', error);
        localStorage.removeItem('jwt_token');
        setUser(null);
      }
    }
    
    setIsLoading(false);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
