import { useQuery } from '@tanstack/react-query';
import { userProfileService, UserProfile } from '@/services/userProfileService';

export function useUserProfile() {
  return useQuery<UserProfile | null>({
    queryKey: ['user-profile'],
    queryFn: userProfileService.getUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failure since it might be auth issues
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Only fetch if no cached data
  });
}