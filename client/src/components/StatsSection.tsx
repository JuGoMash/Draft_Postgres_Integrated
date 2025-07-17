import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Stat {
  value: string;
  label: string;
  isLoading?: boolean;
}

export default function StatsSection() {
  const [animatedStats, setAnimatedStats] = useState<Stat[]>([
    { value: '0', label: 'Verified Doctors', isLoading: true },
    { value: '0', label: 'Specialties', isLoading: true },
    { value: '0', label: 'Booking', isLoading: true },
  ]);

  // Simulate fetching real stats
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        doctorsCount: 10000,
        specialtiesCount: 50,
        availability: '24/7',
      };
    },
  });

  useEffect(() => {
    if (stats) {
      // Animate the numbers
      const finalStats = [
        { value: `${stats.doctorsCount.toLocaleString()}+`, label: 'Verified Doctors' },
        { value: `${stats.specialtiesCount}+`, label: 'Specialties' },
        { value: stats.availability, label: 'Booking' },
      ];

      finalStats.forEach((stat, index) => {
        setTimeout(() => {
          setAnimatedStats(prev => 
            prev.map((s, i) => i === index ? { ...stat, isLoading: false } : s)
          );
        }, index * 200);
      });
    }
  }, [stats]);

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      {animatedStats.map((stat, index) => (
        <div key={index} className="relative">
          <div className={`text-2xl font-bold text-primary transition-all duration-500 ${
            stat.isLoading ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
          }`}>
            {stat.isLoading ? (
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
            ) : (
              stat.value
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
