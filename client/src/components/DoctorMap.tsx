import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation } from 'lucide-react';
import { Doctor } from '@/lib/types';

interface DoctorMapProps {
  doctors: Doctor[];
  selectedDoctorId?: number;
  onDoctorSelect?: (doctorId: number) => void;
}

export default function DoctorMap({ doctors, selectedDoctorId, onDoctorSelect }: DoctorMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleMarkerClick = (doctorId: number) => {
    if (onDoctorSelect) {
      onDoctorSelect(doctorId);
    }
  };

  const getMarkerPosition = (index: number) => {
    // Generate mock positions for demonstration
    const positions = [
      { top: '20%', left: '15%' },
      { top: '35%', right: '20%' },
      { bottom: '30%', left: '25%' },
      { bottom: '20%', right: '15%' },
      { top: '50%', left: '50%' },
      { top: '25%', right: '40%' },
      { bottom: '40%', left: '40%' },
      { top: '60%', right: '30%' },
    ];
    
    return positions[index % positions.length];
  };

  if (!mapLoaded) {
    return (
      <Card className="h-[500px] bg-gray-200 dark:bg-gray-700">
        <CardContent className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="loading-spinner mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] overflow-hidden">
      <CardContent className="p-0 h-full relative">
        {/* Mock Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900">
          {/* Grid pattern to simulate map */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 grid-rows-8 h-full">
              {[...Array(64)].map((_, i) => (
                <div key={i} className="border border-gray-300 dark:border-gray-600" />
              ))}
            </div>
          </div>
          
          {/* Streets simulation */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-600" />
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-600" />
            <div className="absolute top-3/4 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-600" />
            <div className="absolute top-0 bottom-0 left-1/4 w-1 bg-gray-300 dark:bg-gray-600" />
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-300 dark:bg-gray-600" />
            <div className="absolute top-0 bottom-0 left-3/4 w-1 bg-gray-300 dark:bg-gray-600" />
          </div>
        </div>

        {/* User Location Marker */}
        {userLocation && (
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ top: '50%', left: '50%' }}
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full absolute -top-2 -left-2 opacity-25 animate-ping" />
            </div>
          </div>
        )}

        {/* Doctor Markers */}
        {doctors.slice(0, 8).map((doctor, index) => {
          const position = getMarkerPosition(index);
          const isSelected = selectedDoctorId === doctor.id;

          return (
            <div
              key={doctor.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-200 ${
                isSelected ? 'scale-110' : 'hover:scale-105'
              }`}
              style={position}
              onClick={() => handleMarkerClick(doctor.id)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ${
                isSelected ? 'bg-red-500' : 'bg-primary'
              }`}>
                {index + 1}
              </div>
              
              {/* Doctor Info Popup */}
              <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 transition-all duration-200 ${
                isSelected ? 'opacity-100 visible' : 'opacity-0 invisible'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {doctor.user.firstName[0]}{doctor.user.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      Dr. {doctor.user.firstName} {doctor.user.lastName}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {doctor.specialty}
                    </Badge>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {doctor.clinicName}
                    </p>
                  </div>
                </div>
                
                {/* Arrow pointing to marker */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800" />
              </div>
            </div>
          );
        })}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-30 space-y-2">
          <button className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <span className="text-xl font-bold text-gray-600 dark:text-gray-300">+</span>
          </button>
          <button className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <span className="text-xl font-bold text-gray-600 dark:text-gray-300">-</span>
          </button>
          <button className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Navigation className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-30 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-primary rounded-full" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Doctor Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Your Location</span>
          </div>
        </div>

        {/* Map Title */}
        <div className="absolute top-4 left-4 z-30 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {doctors.length} doctors found
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
