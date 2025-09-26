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
    name: 'Core Master',
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

export function ProductSwitcher() {
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
      <div className="w-16 bg-gray-800 min-h-screen flex flex-col items-center py-6">
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-6 h-6 bg-gray-600 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Handle error state with fallback UI
  if (error || !orgProducts) {
    return (
      <div className="w-16 bg-gray-800 min-h-screen flex flex-col items-center py-6">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <span className="text-xs text-red-400 text-center">
            Products
            <br />
            Unavailable
          </span>
        </div>
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
    <div className="w-16 bg-gray-800 min-h-screen flex flex-col items-center py-6">
      <div className="flex flex-col items-center space-y-4">
        {availableProducts.map((product) => {
          const Icon = product.icon;
          const isDisabled = false; // No longer using async mutation for external redirects
          
          return (
            <div
              key={product.key}
              onClick={() => !isDisabled && handleProductClick(product)}
              className={cn(
                "flex flex-col items-center transition-all duration-200",
                isDisabled ? "opacity-50 cursor-wait" : "cursor-pointer"
              )}
              data-testid={`product-switcher-${product.key}`}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 mb-1",
                product.isActive 
                  ? "text-white" 
                  : "text-gray-400 hover:text-white"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-xs text-center leading-tight",
                product.isActive 
                  ? "text-white" 
                  : "text-gray-400"
              )}>
                {product.name.split(' ').map((word, i) => (
                  <div key={i} className="leading-3">{word}</div>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}