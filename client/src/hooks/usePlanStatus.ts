import { useQuery } from '@tanstack/react-query';

interface PlanStatusResponse {
  message: string;
  expiryFlag: boolean;
  isAdmin: boolean;
  isSaas: boolean;
  isPartner: boolean;
  organizationLogo: string;
}

export function usePlanStatus() {
  return useQuery<PlanStatusResponse>({
    queryKey: ['planStatus'],
    queryFn: async () => {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        throw new Error('No JWT token found');
      }

      const response = await fetch('https://qa-api.resolveindia.com/organization/plan-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plan status: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });
}