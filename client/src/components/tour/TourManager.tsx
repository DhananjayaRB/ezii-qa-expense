import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { InteractiveProductTour } from './InteractiveProductTour';
import { TOUR_FLOWS, getFlowsByCategory } from './TourFlows';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, Users, Shield, Play, BookOpen } from 'lucide-react';

interface TourManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TourManager({ isOpen, onClose }: TourManagerProps) {
  const [selectedTour, setSelectedTour] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine user role/category for relevant tours
  const userRole = user?.role_name?.toLowerCase() || 'employee';
  const tourCategory = userRole === 'admin' ? 'admin' : 
                      userRole === 'manager' ? 'manager' : 'employee';

  // Get relevant tours based on user role
  const availableTours = [
    ...getFlowsByCategory(tourCategory),
    ...getFlowsByCategory('all')
  ];

  const handleStartTour = (tourId: string) => {
    const flow = TOUR_FLOWS[tourId];
    if (!flow) {
      toast({
        title: "Tour Not Found",
        description: "The selected tour could not be found.",
        variant: "destructive",
      });
      return;
    }

    setSelectedTour(tourId);
    onClose(); // Close the tour selection dialog
  };

  const handleTourComplete = () => {
    setSelectedTour(null);
    // Invalidate tutorial-related queries
    queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
    
    toast({
      title: "🎉 Tour Completed!",
      description: "Great job! You can restart any tour anytime from the Help menu.",
      variant: "default",
    });
  };

  const handleTourSkip = () => {
    setSelectedTour(null);
    toast({
      title: "Tour Skipped",
      description: "You can restart the tour anytime from the Help menu.",
      variant: "default",
    });
  };

  const handleTourClose = () => {
    setSelectedTour(null);
  };

  // Render active tour
  if (selectedTour) {
    const flow = TOUR_FLOWS[selectedTour];
    return (
      <InteractiveProductTour
        flow={flow}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
        onClose={handleTourClose}
      />
    );
  }

  // Render tour selection dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Product Tours & Guides
          </DialogTitle>
          <DialogDescription>
            Choose a guided tour to learn how to use your expense management system effectively.
            Tours are interactive and will guide you step-by-step through key features.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {availableTours.map((tour) => {
            const categoryIcon = tour.category === 'admin' ? Shield :
                               tour.category === 'manager' ? Users : User;
            const CategoryIcon = categoryIcon;

            return (
              <Card 
                key={tour.id} 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200"
                onClick={() => handleStartTour(tour.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CategoryIcon className="w-5 h-5 text-blue-600" />
                        {tour.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {tour.category.charAt(0).toUpperCase() + tour.category.slice(1)}
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tour.estimatedTime}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" className="shrink-0">
                      <Play className="w-4 h-4 mr-1" />
                      Start Tour
                    </Button>
                  </div>
                  <CardDescription className="text-sm">
                    {tour.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="text-xs text-muted-foreground">
                    <strong>{tour.steps.length} steps</strong> • Interactive guide with hands-on practice
                  </div>
                  {tour.completionReward && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                      🎁 <strong>Completion Reward:</strong> {tour.completionReward}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> You can pause, skip, or restart any tour at any time.
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}