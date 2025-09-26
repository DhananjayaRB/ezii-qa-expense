import { apiRequest } from '@/lib/queryClient';

export interface FilterTypeItem {
  id: string;
  name: string;
}

export interface FilterDataResponse {
  result: string;
  statuscode: number;
  message: string;
  filter_type_data: FilterTypeItem[];
}

export const filterDataService = {
  // Get available filter types (Location, Department, etc.)
  async getFilterTypes(): Promise<FilterTypeItem[]> {
    try {
      console.log('Fetching filter types from external API...');
      const response = await apiRequest('/api/external/filter-data?filter_type_id=2', {
        method: 'GET',
      });

      const data: FilterDataResponse = await response.json();
      console.log('Filter types API response:', data);
      
      if (data.result === 'Success' && data.filter_type_data) {
        return data.filter_type_data;
      }
      
      return [];
      
    } catch (error) {
      console.error('Error fetching filter types:', error);
      return [];
    }
  },

  // Get values for a specific filter type using its ID
  async getFilterTypeValues(filterTypeId: string): Promise<FilterTypeItem[]> {
    try {
      console.log(`Fetching values for filter type ${filterTypeId} from external API...`);
      const response = await apiRequest(`/api/external/attribute-details/${filterTypeId}`, {
        method: 'GET',
      });

      const data = await response.json();
      console.log(`Values for filter type ${filterTypeId}:`, data);
      
      // Transform the API response to match our FilterTypeItem interface
      if (data.result === 'Success' && Array.isArray(data.sub_attributes)) {
        return data.sub_attributes.map((item: any) => ({
          id: item.attribute_sub_id?.toString() || '',
          name: item.attribute_sub || ''
        }));
      }
      
      return [];
      
    } catch (error) {
      console.error(`Error fetching values for filter type ${filterTypeId}:`, error);
      return [];
    }
  },

  // Legacy method for backward compatibility
  async getFilterData(): Promise<FilterTypeItem[]> {
    return this.getFilterTypes();
  },

  // Get cost center values for a specific type using the attribute-details endpoint
  async getCostCenterValues(attributeId: string): Promise<FilterTypeItem[]> {
    try {
      console.log(`Fetching cost center values for attribute ${attributeId} from external API...`);
      const response = await apiRequest(`/api/external/attribute-details/${attributeId}`, {
        method: 'GET',
      });

      const data = await response.json();
      console.log('Cost center values API response for attribute', attributeId, ':', data);
      
      // Transform the API response to match our FilterTypeItem interface
      if (data.result === 'Success' && Array.isArray(data.sub_attributes)) {
        return data.sub_attributes.map((item: any) => ({
          id: item.attribute_sub_id?.toString() || '',
          name: item.attribute_sub || ''
        }));
      }
      
      return [];
      
    } catch (error) {
      console.error('Error fetching cost center values:', error);
      return [];
    }
  },

  // Get mapped cost center values based on selected type and configuration
  async getCostCenterValuesByType(
    selectedTypeName: string, 
    costCenterConfig: any
  ): Promise<FilterTypeItem[]> {
    if (!costCenterConfig) {
      console.warn('No cost center configuration provided');
      return [];
    }

    // Map the type name to the correct ID from configuration
    let attributeId = '';
    
    if (selectedTypeName.toLowerCase() === 'location' && costCenterConfig.costCategory1Name?.toLowerCase() === 'location') {
      attributeId = costCenterConfig.costCategory1Id;
    } else if (selectedTypeName.toLowerCase() === 'department' && costCenterConfig.costCategory2Name?.toLowerCase() === 'department') {
      attributeId = costCenterConfig.costCategory2Id;
    } else if (selectedTypeName.toLowerCase() === costCenterConfig.costCategory3Name?.toLowerCase() && costCenterConfig.costCategory3Id) {
      attributeId = costCenterConfig.costCategory3Id;
    }

    if (!attributeId) {
      console.warn(`No ID found for cost center type: ${selectedTypeName}`);
      return [];
    }

    console.log(`Fetching values for ${selectedTypeName} using attribute ID: ${attributeId}`);
    return this.getCostCenterValues(attributeId);
  }
};