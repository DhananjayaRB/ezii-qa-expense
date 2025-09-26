import { apiRequest } from '@/lib/queryClient';

const API_BASE_URL = 'https://qa-api.resolveindia.com';

export interface Employee {
  // We'll define this based on the actual API response
  [key: string]: any;
}

export const employeeService = {
  async getEmployees(): Promise<Employee[] | null> {
    try {
      // Get JWT token from localStorage
      const jwtToken = localStorage.getItem('jwt_token');
      
      console.log('JWT Token for employees:', jwtToken ? 'Found' : 'Not found');
      
      if (!jwtToken) {
        console.warn('No JWT token found in localStorage - Employee API call will not be made');
        return null;
      }

      // Hardcoded payload as requested
      const payload = {
        "userBlocks": [1, 3, 4],
        "userWise": 0,
        "workerType": 0,
        "attribute": 0,
        "subAttributeId": 0
      };

      const response = await fetch(`${API_BASE_URL}/reports/worker-master-leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Employee API response:', data);
      return data;
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      return null;
    }
  }
};