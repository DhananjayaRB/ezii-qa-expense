import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface PaymentCalendarWidgetProps {
  // No specific props needed - widget is self-contained
}

interface PaymentDue {
  id: string;
  type: 'vendor' | 'contract';
  title: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'overdue';
}

export function PaymentCalendarWidget({}: PaymentCalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get payment due dates for the selected month (with proper URL path)
  const { data: paymentDues, isLoading } = useQuery<PaymentDue[]>({
    queryKey: [`/api/dashboard/payment-dues/${year}/${month}`], // API expects 0-based months as path params
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes - keeps data fresh
  });
  
  // Get first day of month and how many days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  // Navigate months
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Get payments for a specific date (fixed timezone-safe comparison)
  const getPaymentsForDate = (date: number) => {
    if (!paymentDues) return [];
    // Create local date string without timezone conversion
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    return paymentDues.filter((payment: PaymentDue) => {
      const paymentDateStr = payment.dueDate.slice(0, 10); // Get YYYY-MM-DD part only
      return paymentDateStr === targetDateStr;
    });
  };
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Calculate summary statistics
  const contractCount = paymentDues?.filter((p: PaymentDue) => p.type === 'contract').length || 0;
  const vendorCount = paymentDues?.filter((p: PaymentDue) => p.type === 'vendor').length || 0;
  const overdueCount = paymentDues?.filter((p: PaymentDue) => p.status === 'overdue').length || 0;

  // Get today's payments
  const todayPayments = getPaymentsForDate(today.getDate());

  // Calculate calendar grid
  const calendarDays = [];
  
  // Previous month days (grayed out)
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({
      date: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false,
      payments: []
    });
  }
  
  // Current month days
  for (let date = 1; date <= daysInMonth; date++) {
    const isToday = today.getFullYear() === year && 
                    today.getMonth() === month && 
                    today.getDate() === date;
    const payments = getPaymentsForDate(date);
    
    calendarDays.push({
      date,
      isCurrentMonth: true,
      isToday,
      payments
    });
  }
  
  // Next month days to fill grid (if needed)
  const remainingCells = 42 - calendarDays.length; // 6 weeks * 7 days
  for (let date = 1; date <= remainingCells; date++) {
    calendarDays.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      payments: []
    });
  }

  return (
    <Card className="h-fit bg-white shadow-sm hover:shadow-md transition-all duration-300 border-gray-200" data-testid="widget-payment-calendar">
      <CardHeader className="pb-2 space-y-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-700" />
            <span className="text-base font-semibold text-gray-900">Payment Calendar</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-8 px-3 text-xs border-gray-300 text-gray-600 hover:bg-gray-50"
            data-testid="button-today"
          >
            Today
          </Button>
        </CardTitle>

        <p className="text-sm text-muted-foreground">Track upcoming payments</p>
        
        {/* Statistics with better spacing */}
        {!isLoading && paymentDues && paymentDues.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {contractCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-700 font-medium">{contractCount} Contract{contractCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {vendorCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-gray-700 font-medium">{vendorCount} Vendor Claim{vendorCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {overdueCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-700 font-medium">{overdueCount} Overdue</span>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevMonth}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </Button>
          
          <span className="text-lg font-semibold text-gray-900">
            {monthNames[month]} {year}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-3 space-y-3">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">Loading calendar...</div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Clean day headers */}
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Clean and readable calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`
                    relative h-9 w-9 mx-auto rounded-lg text-center text-sm transition-all duration-200 flex items-center justify-center cursor-pointer
                    ${day.isCurrentMonth ? 'text-gray-900 hover:bg-gray-100' : 'text-muted-foreground'}
                    ${day.isToday ? 'ring-2 ring-blue-500 bg-blue-50 font-semibold text-blue-700' : ''}
                  `}
                  data-testid={`calendar-day-${day.date}`}
                  title={day.payments.length > 0 ? day.payments.map(p => `${p.title}: ₹${p.amount.toLocaleString()}`).join(', ') : ''}
                >
                  <div className="text-sm">{day.date}</div>
                  
                  {/* Clean payment indicators */}
                  {day.payments.length > 0 && (
                    <div className="absolute -top-1 -right-1 flex items-center gap-0.5">
                      <div className={`
                        w-3 h-3 rounded-full flex items-center justify-center text-white text-xs font-bold
                        ${day.payments.some(p => p.status === 'overdue') ? 'bg-red-500' : 
                          day.payments.some(p => p.type === 'vendor') ? 'bg-orange-500' : 'bg-blue-500'}
                      `}
                      >
                        {day.payments.length}
                      </div>
                    </div>
                  )}
                </div>
              ))}  
            </div>
            
            {/* Today's section with better typography */}
            <div className="pt-3 border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                Today: {monthNames[today.getMonth()]} {today.getDate()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-600">Contracts: {todayPayments.filter(p => p.type === 'contract').length > 0 ? todayPayments.filter(p => p.type === 'contract').length : 'None'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-gray-600">Vendor Claims: {todayPayments.filter(p => p.type === 'vendor').length > 0 ? todayPayments.filter(p => p.type === 'vendor').length : 'None'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-600">Overdue: {todayPayments.filter(p => p.status === 'overdue').length > 0 ? todayPayments.filter(p => p.status === 'overdue').length : 'None'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}