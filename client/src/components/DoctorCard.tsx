import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Star, MapPin, Clock, Shield, Video, Calendar, Phone } from 'lucide-react';
import { Doctor } from '@/lib/types';
import { formatCurrency, getInitials, generateStars } from '@/lib/utils';

interface DoctorCardProps {
  doctor: Doctor;
  onBookAppointment?: (doctorId: number) => void;
}

export default function DoctorCard({ doctor, onBookAppointment }: DoctorCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const stars = generateStars(parseFloat(doctor.rating));
  const availableSlots = doctor.availabilitySlots?.filter(slot => !slot.isBooked) || [];
  const nextSlot = availableSlots[0];

  const handleBookAppointment = () => {
    if (onBookAppointment) {
      onBookAppointment(doctor.id);
    }
  };

  return (
    <Card 
      className="doctor-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${doctor.user.email}`} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(doctor.user.firstName, doctor.user.lastName)}
                </AvatarFallback>
              </Avatar>
              {doctor.user.isVerified && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Shield className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Dr. {doctor.user.firstName} {doctor.user.lastName}
                </h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {doctor.specialty}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {doctor.clinicName}
              </p>
              
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center">
                  <div className="flex">
                    {stars.map((star, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
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
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{doctor.clinicAddress}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {doctor.servicesOffered.slice(0, 3).map((service) => (
                  <Badge 
                    key={service}
                    variant="outline"
                    className="text-xs"
                  >
                    {service}
                  </Badge>
                ))}
                {doctor.servicesOffered.includes('telemedicine') && (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                    <Video className="h-3 w-3 mr-1" />
                    Telehealth
                  </Badge>
                )}
                {nextSlot && (
                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Available Today
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
            <div className="text-right mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Starting from</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(doctor.consultationFee)}
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={handleBookAppointment}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
              
              <Link href={`/doctor/${doctor.id}`}>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Availability Slots */}
        {availableSlots.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Next Available:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableSlots.slice(0, 3).map((slot) => (
                <Button
                  key={slot.id}
                  variant="outline"
                  size="sm"
                  className="text-xs hover:bg-primary hover:text-white transition-colors"
                  onClick={() => handleBookAppointment()}
                >
                  {new Date(slot.startTime).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })} {new Date(slot.startTime).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
