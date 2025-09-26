/**
 * External API service for fetching user profile data
 * Integrates with https://qa-api.resolveindia.com/organization/user-profile
 */

interface UserProfileResponse {
  result?: string;
  statuscode?: number;
  message?: string;
  data?: {
    employer_name?: string;
    employee_number?: string;
    email?: string;
    org_id?: string;
    organization_name?: string;
    user_id?: string;
    // Add other fields as needed
  };
}

interface UserProfileData {
  employerName: string | null;
  employeeNumber: string | null;
  employeeEmail: string | null;
}

interface RequestContext {
  jwtToken?: string;
  orgId?: string;
  userId: string;
}

/**
 * Fetches user profile data from external API with proper authentication
 * @param context - Request context containing JWT token, org ID, and user ID
 * @returns User profile data or null values if API call fails
 */
export async function fetchUserProfile(context: RequestContext): Promise<UserProfileData> {
  try {
    console.log(`Fetching user profile for user ID: ${context.userId}, org: ${context.orgId}`);
    
    // Build headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add JWT token if available
    if (context.jwtToken) {
      headers['Authorization'] = `Bearer ${context.jwtToken}`;
    }
    
    // Add organization context if available
    if (context.orgId) {
      headers['X-Org-ID'] = context.orgId;
    }
    
    // Build URL with user ID parameter
    const url = new URL('https://qa-api.resolveindia.com/organization/user-profile');
    url.searchParams.append('user_id', context.userId);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      console.warn(`User profile API returned status: ${response.status} for user ${context.userId}`);
      return getDefaultProfileData();
    }

    const profileData: UserProfileResponse = await response.json();
    
    // Extract data from nested response structure
    const userData = profileData.data || {};
    
    // Log success 
    console.log(`✅ User profile fetched and mapped successfully for user ${context.userId}`);
    
    return {
      employerName: userData.employer_name || null,
      employeeNumber: userData.employee_number || null,
      employeeEmail: userData.email || null,
    };
    
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.warn(`User profile API timeout for user ${context.userId}`);
    } else {
      console.error(`Failed to fetch user profile for user ${context.userId}:`, error instanceof Error ? error.message : 'Unknown error');
    }
    return getDefaultProfileData();
  }
}

/**
 * Returns default profile data when API call fails
 */
function getDefaultProfileData(): UserProfileData {
  return {
    employerName: null,
    employeeNumber: null,
    employeeEmail: null,
  };
}