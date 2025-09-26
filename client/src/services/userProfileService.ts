const API_BASE_URL = 'https://qa-api.resolveindia.com';

export interface UserProfile {
  // We'll define this based on the actual API response
  [key: string]: any;
}

export const userProfileService = {
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      // Get JWT token from localStorage
      const jwtToken = localStorage.getItem('jwt_token');
      
      console.log('JWT Token from localStorage:', jwtToken ? 'Found' : 'Not found');
      
      if (!jwtToken) {
        console.warn('No JWT token found in localStorage - API call will not be made');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/organization/user-profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('User profile API response:', data);
      return data;
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
};