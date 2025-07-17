import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, Shield, Clock, MapPin, Star } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Doctor } from '@/lib/types';
import { formatCurrency, getInitials } from '@/lib/utils';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const appointmentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  appointmentDate: z.string().min(1, 'Please select a date and time'),
  reason: z.string().min(10, 'Please provide a reason for your visit'),
  insurance: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface PaymentFormProps {
  doctor: Doctor;
  appointmentData: AppointmentFormData;
  onSuccess: () => void;
}

function PaymentForm({ doctor, appointmentData, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create appointment first
      const appointmentResponse = await apiRequest('POST', '/api/appointments', {
        doctorId: doctor.id,
        appointmentDate: appointmentData.appointmentDate,
        reason: appointmentData.reason,
        type: 'in-person',
        duration: 30,
      });

      const appointment = await appointmentResponse.json();

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/appointment-confirmed`,
        },
      });

      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Appointment Booked!',
          description: 'Your appointment has been successfully booked.',
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: 'There was an error booking your appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Payment Information
        </h3>
        <PaymentElement />
      </div>

      <div className="flex space-x-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-primary hover:bg-primary/90"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <div className="loading-spinner mr-2" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          {isProcessing ? 'Processing...' : `Pay ${formatCurrency(doctor.consultationFee)}`}
        </Button>
      </div>
    </form>
  );
}

export default function BookAppointment() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [appointmentData, setAppointmentData] = useState<AppointmentFormData | null>(null);

  const { data: doctor, isLoading } = useQuery({
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

  const { data: availableSlots } = useQuery({
    queryKey: ['/api/doctors', doctorId, 'availability'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/doctors/${doctorId}/availability?date=${today}`);
      return response.json();
    },
    enabled: !!doctorId,
  });

  const createPaymentIntent = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/create-payment-intent', { 
        amount,
        doctorId: parseInt(doctorId || '0'),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setStep(2);
    },
    onError: (error) => {
      toast({
        title: 'Payment Setup Failed',
        description: 'Unable to set up payment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      appointmentDate: '',
      reason: '',
      insurance: '',
      termsAccepted: false,
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    setAppointmentData(data);
    createPaymentIntent.mutate(parseFloat(doctor.consultationFee));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Doctor Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The doctor you're trying to book with doesn't exist or is no longer available.
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

  const handleBookingComplete = () => {
    navigate('/appointments');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  1
                </div>
                <span className="ml-2 font-medium">Appointment Details</span>
              </div>
              <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
              <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  2
                </div>
                <span className="ml-2 font-medium">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {step === 1 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Book Your Appointment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            {...form.register('firstName')}
                            className="mt-1"
                          />
                          {form.formState.errors.firstName && (
                            <p className="text-red-500 text-sm mt-1">
                              {form.formState.errors.firstName.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            {...form.register('lastName')}
                            className="mt-1"
                          />
                          {form.formState.errors.lastName && (
                            <p className="text-red-500 text-sm mt-1">
                              {form.formState.errors.lastName.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            {...form.register('email')}
                            className="mt-1"
                          />
                          {form.formState.errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                              {form.formState.errors.email.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            {...form.register('phone')}
                            className="mt-1"
                          />
                          {form.formState.errors.phone && (
                            <p className="text-red-500 text-sm mt-1">
                              {form.formState.errors.phone.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="appointmentDate">Date & Time</Label>
                        <Select onValueChange={(value) => form.setValue('appointmentDate', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select date and time" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSlots?.map((slot: any) => (
                              <SelectItem key={slot.id} value={slot.startTime}>
                                {new Date(slot.startTime).toLocaleDateString()} at{' '}
                                {new Date(slot.startTime).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit' 
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.appointmentDate && (
                          <p className="text-red-500 text-sm mt-1">
                            {form.formState.errors.appointmentDate.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="reason">Reason for Visit</Label>
                        <Textarea
                          id="reason"
                          {...form.register('reason')}
                          className="mt-1"
                          rows={3}
                          placeholder="Please describe your concerns or reason for the visit..."
                        />
                        {form.formState.errors.reason && (
                          <p className="text-red-500 text-sm mt-1">
                            {form.formState.errors.reason.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="insurance">Insurance Provider</Label>
                        <Select onValueChange={(value) => form.setValue('insurance', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select your insurance" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aetna">Aetna</SelectItem>
                            <SelectItem value="bluecross">Blue Cross Blue Shield</SelectItem>
                            <SelectItem value="cigna">Cigna</SelectItem>
                            <SelectItem value="humana">Humana</SelectItem>
                            <SelectItem value="medicare">Medicare</SelectItem>
                            <SelectItem value="medicaid">Medicaid</SelectItem>
                            <SelectItem value="unitedhealthcare">UnitedHealthcare</SelectItem>
                            <SelectItem value="self-pay">Self Pay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="terms"
                          {...form.register('termsAccepted')}
                        />
                        <Label htmlFor="terms" className="text-sm">
                          I agree to the{' '}
                          <a href="#" className="text-primary hover:underline">
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a href="#" className="text-primary hover:underline">
                            Privacy Policy
                          </a>
                        </Label>
                      </div>
                      {form.formState.errors.termsAccepted && (
                        <p className="text-red-500 text-sm">
                          {form.formState.errors.termsAccepted.message}
                        </p>
                      )}

                      <div className="flex space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => navigate(`/doctor/${doctorId}`)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-primary hover:bg-primary/90"
                          disabled={createPaymentIntent.isPending}
                        >
                          {createPaymentIntent.isPending ? (
                            <div className="loading-spinner mr-2" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          Continue to Payment
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clientSecret && appointmentData && (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm
                          doctor={doctor}
                          appointmentData={appointmentData}
                          onSuccess={handleBookingComplete}
                        />
                      </Elements>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Doctor Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Appointment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 mb-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${doctor.user.email}`} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(doctor.user.firstName, doctor.user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Dr. {doctor.user.firstName} {doctor.user.lastName}
                      </h3>
                      <Badge variant="secondary" className="mb-2">
                        {doctor.specialty}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        {doctor.rating} ({doctor.reviewCount} reviews)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {doctor.clinicName}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        30 minute consultation
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Shield className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Verified doctor
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Consultation Fee
                      </span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(doctor.consultationFee)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
