import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/Navigation';
import BookingModal from '@/components/BookingModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  Shield, 
  GraduationCap, 
  Languages, 
  Briefcase,
  Video,
  MessageSquare
} from 'lucide-react';
import { Doctor, Review } from '@/lib/types';
import { formatCurrency, getInitials, generateStars, formatDate } from '@/lib/utils';

export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const doctorId = parseInt(id || '0');

  const { data: doctor, isLoading, error } = useQuery({
    queryKey: ['/api/doctors', doctorId],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/${doctorId}`);
      if (!response.ok) {
        throw new Error('Doctor not found');
      }
      return response.json();
    },
    enabled: !!doctorId,
  });

  const { data: reviews } = useQuery({
    queryKey: ['/api/doctors', doctorId, 'reviews'],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/${doctorId}/reviews`);
      return response.json();
    },
    enabled: !!doctorId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start space-x-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Doctor Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The doctor you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/search')}>
                Search Doctors
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stars = generateStars(parseFloat(doctor.rating));
  const availableSlots = doctor.availabilitySlots?.filter(slot => !slot.isBooked) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${doctor.user.email}`} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {getInitials(doctor.user.firstName, doctor.user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    {doctor.user.isVerified && (
                      <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Dr. {doctor.user.firstName} {doctor.user.lastName}
                      </h1>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {doctor.specialty}
                      </Badge>
                    </div>
                    
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                      {doctor.clinicName}
                    </p>
                    
                    <div className="flex items-center space-x-6 mb-4">
                      <div className="flex items-center">
                        <div className="flex">
                          {stars.map((star, index) => (
                            <Star
                              key={index}
                              className={`h-5 w-5 ${
                                star === 'full' 
                                  ? 'text-yellow-400 fill-current' 
                                  : star === 'half' 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          {doctor.rating} ({doctor.reviewCount} reviews)
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{doctor.clinicAddress}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1" />
                        <span>{doctor.experience} years experience</span>
                      </div>
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-1" />
                        <span>{doctor.education}</span>
                      </div>
                      <div className="flex items-center">
                        <Languages className="h-4 w-4 mr-1" />
                        <span>{doctor.languages.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 md:mt-0 md:ml-6 flex-shrink-0">
                  <Card className="bg-gray-50 dark:bg-gray-700">
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Consultation Fee</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(doctor.consultationFee)}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90"
                          onClick={() => setShowBookingModal(true)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Book Appointment
                        </Button>
                        
                        <Button variant="outline" className="w-full">
                          <Video className="h-4 w-4 mr-2" />
                          Video Consultation
                        </Button>
                        
                        <Button variant="outline" className="w-full">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About Dr. {doctor.user.lastName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {doctor.bio || `Dr. ${doctor.user.firstName} ${doctor.user.lastName} is a skilled ${doctor.specialty} specialist with ${doctor.experience} years of experience. They are dedicated to providing excellent patient care and staying current with the latest medical advances.`}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{doctor.user.email}</span>
                      </div>
                      {doctor.user.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">{doctor.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Specializations & Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Services Offered
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {doctor.servicesOffered.map((service) => (
                            <Badge key={service} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Insurance Accepted
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {doctor.insurancesAccepted.map((insurance) => (
                            <Badge key={insurance} variant="outline" className="text-xs">
                              {insurance}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="availability" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Time Slots</CardTitle>
                </CardHeader>
                <CardContent>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableSlots.slice(0, 12).map((slot) => (
                        <Button
                          key={slot.id}
                          variant="outline"
                          className="p-4 h-auto justify-start hover:bg-primary hover:text-white"
                          onClick={() => setShowBookingModal(true)}
                        >
                          <div className="text-left">
                            <div className="font-semibold">
                              {formatDate(slot.startTime)}
                            </div>
                            <div className="text-sm opacity-75">
                              {new Date(slot.startTime).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })} - {new Date(slot.endTime).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No available slots at the moment
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Please check back later or contact the clinic directly
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews?.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.slice(0, 10).map((review: Review) => (
                        <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gray-100 dark:bg-gray-700">
                                {review.patientId.toString().slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${
                                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(review.createdAt)}
                                </span>
                                {review.isVerified && (
                                  <Badge variant="outline" className="text-xs">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">
                                {review.comment}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No reviews yet
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Be the first to leave a review after your appointment
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="location" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Clinic Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {doctor.clinicName}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {doctor.clinicAddress}
                        </p>
                      </div>
                    </div>
                    
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">
                          Interactive map would be displayed here
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          doctorId={doctorId}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onBookingComplete={() => {
            setShowBookingModal(false);
            // Refresh doctor data to update availability
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
