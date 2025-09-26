import { useQuery } from '@tanstack/react-query';
import { employeeService, type Employee } from '@/services/employeeService';

export const useEmployees = () => {
  return useQuery<Employee[] | null, Error>({
    queryKey: ['/external/employees'],
    queryFn: () => employeeService.getEmployees(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Only fetch if no cached data
  });
};