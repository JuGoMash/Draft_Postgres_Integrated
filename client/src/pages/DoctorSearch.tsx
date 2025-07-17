import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import Navigation from '@/components/Navigation';
import SearchFilters from '@/components/SearchFilters';
import DoctorCard from '@/components/DoctorCard';
import DoctorMap from '@/components/DoctorMap';
import BookingModal from '@/components/BookingModal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchFilters as SearchFiltersType, Doctor } from '@/lib/types';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function DoctorSearch() {
  const [location, navigate] = useLocation();
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { lastMessage } = useWebSocket();

  // Parse URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilters: SearchFiltersType = {};
    
    if (urlParams.get('specialty')) initialFilters.specialty = urlParams.get('specialty') || '';
    if (urlParams.get('location')) initialFilters.location = urlParams.get('location') || '';
    if (urlParams.get('insurance')) initialFilters.insurance = urlParams.get('insurance') || '';
    
    setFilters(initialFilters);
  }, []);

  const { data: doctors, isLoading, refetch } = useQuery({
    queryKey: ['/api/doctors', filters, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });
      
      if (sortBy !== 'relevance') {
        params.append('sortBy', sortBy);
      }
      
      const response = await fetch(`/api/doctors?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }
      return response.json();
    },
  });

  // Listen for real-time updates
  useEffect(() => {
    if (lastMessage?.type === 'APPOINTMENT_CREATED' || lastMessage?.type === 'APPOINTMENT_CANCELLED') {
      refetch();
    }
  }, [lastMessage, refetch]);

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    
    // Update URL with new filters
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          params.append(key, value.join(','));
        } else {
          params.append(key, value.toString());
        }
      }
    });
    
    const newUrl = `/search${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleSearch = () => {
    refetch();
  };

  const handleBookAppointment = (doctorId: number) => {
    setSelectedDoctorId(doctorId);
    setShowBookingModal(true);
  };

  const handleBookingComplete = () => {
    setShowBookingModal(false);
    setSelectedDoctorId(null);
    refetch(); // Refresh doctors to update availability
  };

  const sortOptions = [
    { value: 'relevance', label: 'Best Match' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest' },
    { value: 'price', label: 'Lowest Price' },
    { value: 'availability', label: 'Earliest Available' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
          
          <div className="mt-8 flex flex-col lg:flex-row gap-8">
            {/* Map Section */}
            <div className="lg:w-1/3">
              <div className="sticky top-20">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Doctor Locations
                </h3>
                <DoctorMap doctors={doctors || []} />
              </div>
            </div>
            
            {/* Results Section */}
            <div className="lg:w-2/3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Search Results
                </h3>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isLoading ? 'Searching...' : `${doctors?.length || 0} doctors found`}
                  </span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Doctor Cards */}
              <div className="space-y-6">
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-start space-x-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-64" />
                          <div className="flex space-x-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-24" />
                          <Skeleton className="h-10 w-32" />
                          <Skeleton className="h-10 w-32" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : doctors?.length ? (
                  doctors.map((doctor: Doctor) => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      onBookAppointment={handleBookAppointment}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400 text-lg">
                      No doctors found matching your criteria
                    </div>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">
                      Try adjusting your search filters or location
                    </p>
                  </div>
                )}
              </div>
              
              {/* Load More Button */}
              {doctors?.length && doctors.length >= 10 && (
                <div className="text-center mt-8">
                  <Button
                    variant="outline"
                    className="px-8 py-3 border-primary text-primary hover:bg-primary/10"
                    onClick={() => refetch()}
                  >
                    Load More Doctors
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Booking Modal */}
      {showBookingModal && selectedDoctorId && (
        <BookingModal
          doctorId={selectedDoctorId}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </div>
  );
}
