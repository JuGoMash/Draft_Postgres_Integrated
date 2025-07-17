import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Navigation from '@/components/Navigation';
import StatsSection from '@/components/StatsSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import ForDoctorsSection from '@/components/ForDoctorsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Info, Star, Shield, Clock } from 'lucide-react';
import { Doctor } from '@/lib/types';

export default function Home() {
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  // Fetch top rated doctors for the hero section
  const { data: topDoctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['/api/doctors/top-rated'],
    queryFn: async () => {
      const response = await fetch('/api/doctors/top-rated?limit=1');
      return response.json();
    },
  });

  const featuredDoctor = topDoctors?.[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="md:grid md:grid-cols-2 md:gap-12 items-center">
            <div className="mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Find the Right Doctor{' '}
                <span className="text-primary">Near You</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Book appointments instantly with verified doctors. Compare prices, ratings, and specialties all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/search">
                  <Button className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium shadow-sm">
                    <Search className="h-4 w-4 mr-2" />
                    Search Doctors
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  className="px-6 py-3 border-primary text-primary hover:bg-primary/10 font-medium shadow-sm"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Info className="h-4 w-4 mr-2" />
                  How It Works
                </Button>
              </div>
              
              <StatsSection />
            </div>
            
            <div className="relative">
              <Card className="bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="relative">
                    <img 
                      src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
                      alt="Doctor consultation scene"
                      className="rounded-lg w-full h-auto"
                      onLoad={() => setHeroImageLoaded(true)}
                    />
                    {!heroImageLoaded && (
                      <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Featured Doctor Card */}
              {featuredDoctor && (
                <Card className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 relative">
                        <img 
                          className="h-12 w-12 rounded-full object-cover" 
                          src={`https://api.dicebear.com/7.x/personas/svg?seed=${featuredDoctor.user.email}`}
                          alt={`Dr. ${featuredDoctor.user.firstName} ${featuredDoctor.user.lastName}`}
                        />
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Shield className="h-2 w-2 text-white" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Dr. {featuredDoctor.user.firstName} {featuredDoctor.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {featuredDoctor.specialty}
                        </p>
                        <div className="flex items-center mt-1">
                          <div className="flex text-yellow-400 text-xs">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${i < Math.floor(parseFloat(featuredDoctor.rating)) ? 'fill-current' : ''}`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            {featuredDoctor.rating} ({featuredDoctor.reviewCount})
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Live Availability Indicator */}
              <Badge className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 text-sm font-medium">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                Available Now
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <HowItWorksSection />
      <ForDoctorsSection />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
