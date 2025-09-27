import NodeCache from 'node-cache';

// Cache for user profile data - TTL of 5 minutes to balance performance and freshness
const profileCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

interface UserProfile {
  org_id: string;
  organization_name: string;
  organization_logo: string;
  user_id: string;
  email: string;
  employer_name: string;
  employee_number: string;
  user_profile: string | null;
  user_type_id: string;
  backgroundColor: string;
  isKycEnabled: string;
  isPan: boolean;
  isAadhar: boolean;
  isWhatsapp: boolean;
  is_exited: string;
}

interface ProfileApiResponse {
  result: string;
  statuscode: number;
  message: string;
  data: UserProfile;
}

/**
 * Fetch user profile from external API
 */
export async function fetchUserProfile(jwtToken: string): Promise<UserProfile | null> {
  try {
    console.log('🔍 Fetching user profile from external API');
    
    // Check cache first
    const cacheKey = `profile:${jwtToken.slice(-20)}`; // Use last 20 chars as cache key
    const cachedProfile = profileCache.get<UserProfile>(cacheKey);
    
    if (cachedProfile) {
      console.log('✅ Using cached user profile');
      return cachedProfile;
    }
    
    // Make API call
    const response = await fetch('https://qa-api.resolveindia.com/organization/user-profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ User profile API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const apiResponse: ProfileApiResponse = await response.json();
    
    if (apiResponse.result !== 'Success' || !apiResponse.data) {
      console.error('❌ Invalid user profile API response:', apiResponse);
      return null;
    }
    
    const userProfile = apiResponse.data;
    
    // Cache the profile
    profileCache.set(cacheKey, userProfile);
    
    console.log('✅ User profile fetched and cached:', {
      user_id: userProfile.user_id,
      employer_name: userProfile.employer_name,
      employee_number: userProfile.employee_number,
      email: userProfile.email,
      organization_name: userProfile.organization_name
    });
    
    return userProfile;
    
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return null;
  }
}

/**
 * Get user profile with fallback handling
 */
export async function getUserProfile(jwtToken: string): Promise<{
  employer_name: string;
  employee_number: string;
  email: string;
  organization_name?: string;
  org_id?: string;
} | null> {
  const profile = await fetchUserProfile(jwtToken);
  
  if (!profile) {
    console.warn('⚠️ Could not fetch user profile, using fallback values');
    return null;
  }
  
  return {
    employer_name: profile.employer_name || 'Unknown Employee',
    employee_number: profile.employee_number || 'N/A',
    email: profile.email || 'unknown@company.com',
    organization_name: profile.organization_name,
    org_id: profile.org_id
  };
}

/**
 * Clear profile cache for a specific token (useful for logout)
 */
export function clearProfileCache(jwtToken: string): void {
  const cacheKey = `profile:${jwtToken.slice(-20)}`;
  profileCache.del(cacheKey);
  console.log('🗑️ Cleared profile cache for user');
}

/**
 * Clear all profile cache (useful for testing)
 */
export function clearAllProfileCache(): void {
  profileCache.flushAll();
  console.log('🗑️ Cleared all profile cache');
}