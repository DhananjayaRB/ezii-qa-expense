import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Home, 
  IndianRupee, 
  FileText, 
  Receipt, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrganizationProducts {
  orgId: number;
  isCore: boolean;
  isPayroll: boolean;
  isAttendance: boolean;
  isLeave: boolean;
  isExpense: boolean;
}

interface ProductItem {
  key: keyof OrganizationProducts;
  name: string;
  icon: any;
  url?: string;
  isActive?: boolean;
}

const PRODUCT_ITEMS: ProductItem[] = [
  {
    key: 'isCore',
    name: 'Core',
    icon: Home,
    url: '#'
  },
  {
    key: 'isPayroll',
    name: 'Payroll',
    icon: IndianRupee,
    url: 'https://qa.resolveindia.com/dashboard/team-dashboard/team-dashboard'
  },
  {
    key: 'isAttendance',
    name: 'Attendance',
    icon: FileText,
    url: '#'
  },
  {
    key: 'isExpense',
    name: 'Expense',
    icon: Receipt,
    url: '/' // Current app - active state computed dynamically
  },
  {
    key: 'isLeave',
    name: 'Leave',
    icon: Calendar,
    url: 'https://leave.ezii.co.in'
  }
];

export function MobileProductSwitcher() {
  const [location, setLocation] = useLocation();

  // Fetch organization products with proper error handling
  const { data: orgProducts, isLoading, error } = useQuery<OrganizationProducts>({
    queryKey: ['/api/organization/products'],
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Direct JWT token redirect for external applications
  const redirectWithToken = (targetUrl: string, useToken = true) => {
    if (!useToken) {
      // For payroll, just redirect to the URL without token
      window.location.href = targetUrl;
      return;
    }

    // Get existing JWT token from localStorage for apps that need it
    const token = localStorage.getItem('jwt_token');
    
    if (!token) {
      console.error('No JWT token found');
      alert('Authentication token not found. Please login again.');
      return;
    }

    // Pass token in URL path as expected by external applications (like Leave)
    // Format: baseUrl/id/{token}
    const redirectUrl = `${targetUrl}${targetUrl.endsWith('/') ? '' : '/'}id/${token}`;
    window.location.href = redirectUrl;
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex space-x-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 bg-gray-600 rounded animate-pulse" />
            <div className="w-12 h-3 bg-gray-600 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Handle error state with fallback UI
  if (error || !orgProducts) {
    return (
      <div className="flex items-center space-x-2 text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs">Products Unavailable</span>
      </div>
    );
  }

  // Filter products based on organization's enabled products
  const availableProducts = PRODUCT_ITEMS.filter(product => 
    orgProducts[product.key] === true
  ).map(product => ({
    ...product,
    // Compute active state dynamically based on current location
    isActive: product.key === 'isExpense' && (location === '/' || location.startsWith('/'))
  }));

  const handleProductClick = (product: ProductItem) => {
    if (product.isActive) {
      // Already on current app
      return;
    }
    
    if (product.url && product.url !== '#') {
      if (product.url.startsWith('http')) {
        // For external URLs, determine if token is needed
        const needsToken = product.key !== 'isPayroll'; // Payroll doesn't need token
        redirectWithToken(product.url, needsToken);
      } else {
        // For internal navigation, use wouter
        setLocation(product.url);
      }
    } else {
      // Product not yet implemented
      alert(`${product.name} will be available soon!`);
    }
  };

  return (
    <>
      {availableProducts.map((product) => {
        const Icon = product.icon;
        const isDisabled = false; // No longer using async mutation for external redirects
        
        return (
          <div
            key={product.key}
            onClick={() => !isDisabled && handleProductClick(product)}
            className={cn(
              "flex flex-col items-center min-w-max transition-all duration-200",
              isDisabled ? "opacity-50 cursor-wait" : "cursor-pointer"
            )}
            data-testid={`mobile-product-switcher-${product.key}`}
          >
            <div className={cn(
              "flex items-center justify-center w-8 h-8 mb-1 rounded-lg",
              product.isActive 
                ? "text-white bg-blue-600" 
                : "text-gray-400 hover:text-white hover:bg-gray-700"
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={cn(
              "text-xs text-center whitespace-nowrap",
              product.isActive 
                ? "text-white font-medium" 
                : "text-gray-400"
            )}>
              {product.name}
            </span>
          </div>
        );
      })}
    </>
  );
}