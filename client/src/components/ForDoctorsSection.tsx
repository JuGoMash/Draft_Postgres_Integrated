import { Button } from '@/components/ui/button';
import { Users, Calendar, Shield, BarChart } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Grow Your Practice',
    description: 'Reach new patients in your area and expand your practice with our patient matching system.',
  },
  {
    icon: Calendar,
    title: 'Manage Schedule',
    description: 'Streamline your appointment scheduling with our integrated calendar and booking system.',
  },
  {
    icon: Shield,
    title: 'Secure & Compliant',
    description: 'HIPAA-compliant platform with enterprise-grade security to protect patient information.',
  },
  {
    icon: BarChart,
    title: 'Analytics & Insights',
    description: 'Track your practice performance with detailed analytics and patient insights.',
  },
];

export default function ForDoctorsSection() {
  return (
    <section id="for-doctors" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary to-secondary text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            For Healthcare Professionals
          </h2>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Join thousands of doctors who use our platform to manage their practice and reach more patients.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-primary-100 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button className="bg-white text-primary hover:bg-gray-100 px-8 py-3">
            <Users className="h-4 w-4 mr-2" />
            Join as a Doctor
          </Button>
        </div>
      </div>
    </section>
  );
}
