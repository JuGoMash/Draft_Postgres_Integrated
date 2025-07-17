import { Card, CardContent } from '@/components/ui/card';
import { Search, UserCheck, Calendar } from 'lucide-react';

const steps = [
  {
    id: 1,
    icon: Search,
    title: 'Search & Filter',
    description: 'Find doctors by specialty, location, insurance, availability, and more with our advanced search filters.',
  },
  {
    id: 2,
    icon: UserCheck,
    title: 'Compare Options',
    description: 'View doctor profiles with ratings, reviews, pricing, and availability to make an informed choice.',
  },
  {
    id: 3,
    icon: Calendar,
    title: 'Book Instantly',
    description: 'View real-time availability and book appointments instantly. No waiting on hold or playing phone tag.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Finding and booking the right doctor has never been easier. Here's how we make healthcare accessible.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <Card key={step.id} className="text-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {step.id}. {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
