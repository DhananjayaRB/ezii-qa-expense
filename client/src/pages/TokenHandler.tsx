import { useEffect } from "react";
import { useLocation } from "wouter";
import { useParams } from "wouter";

// Simple JWT decode function (without verification since we just need to parse)
function decodeJWT(token: string) {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode from base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    throw new Error('Failed to decode JWT token');
  }
}

export default function TokenHandler() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const token = params.token;

  useEffect(() => {
    if (!token) {
      // No token provided, redirect to home
      setLocation('/');
      return;
    }

    try {
      // Decode the JWT token
      const payload = decodeJWT(token);
      
      // Extract and store the required fields in localStorage
      if (payload.org_id) {
        localStorage.setItem('org_id', payload.org_id.toString());
      }
      
      if (payload.user_id) {
        localStorage.setItem('user_id', payload.user_id.toString());
      }
      
      if (payload.role_id) {
        localStorage.setItem('role_id', payload.role_id.toString());
      }
      
      if (payload.user_type_id) {
        localStorage.setItem('user_type_id', payload.user_type_id.toString());
      }
      
      if (payload.role_name) {
        localStorage.setItem('role_name', payload.role_name);
      }
      
      // Store the original JWT token
      localStorage.setItem('jwt_token', token);
      
      console.log('=== TOKEN STORED SUCCESSFULLY ===');
      console.log('Payload data:', {
        org_id: payload.org_id,
        user_id: payload.user_id,
        role_id: payload.role_id,
        user_type_id: payload.user_type_id,
        role_name: payload.role_name
      });
      console.log('JWT token stored:', token.substring(0, 50) + '...');
      console.log('About to redirect to /');
      
      // Redirect to base URL
      setLocation('/');
      
    } catch (error) {
      console.error('Error processing token:', error);
      
      // On error, still redirect to home but don't store anything
      setLocation('/');
    }
  }, [token, setLocation]);

  // Show loading while processing
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing authentication token...</p>
      </div>
    </div>
  );
}