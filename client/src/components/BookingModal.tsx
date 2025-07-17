import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, CreditCard, Clock, Star } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Doctor } from '@/lib/types';
import { formatCurrency, getInitials } from '@/lib/utils';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const bookingSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  appointmentDate: z.string().min(1, 'Please select a date and time'),
  reason: z.string().min(10, 'Please provide a reason for your visit'),
  insurance: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  doctorId: number;
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete: () => void;
}

interface PaymentStepProps {
  doctor: Doctor;
  bookingData: BookingFormData;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentStep({ doctor, bookingData, onSuccess, onCancel }: PaymentStepProps) {
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
      // Create appointment
      const appointmentResponse = await apiRequest('POST', '/api/appointments', {
        doctorId: doctor.id,
        appointmentDate: bookingData.appointmentDate,
        reason: bookingData.reason,
        type: 'in-person',
        duration: 30,
      });

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success!',
          description: 'Your appointment has been booked successfully.',
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: 'Unable to book appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Payment Information
        </h3>
        <PaymentElement />
      </div>

      <div className="flex space-x-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isProcessing}
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

export default function BookingModal({ doctorId, isOpen, onClose, onBookingComplete }: BookingModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState('');
  const [bookingData, setBookingData] = useState<BookingFormData | null>(null);

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['/api/doctors', doctorId],
    queryFn: async () => {
      const response = await fetch(`/api/doctors/${doctorId}`);
      return response.json();
    },
    enabled: !!doctorId && isOpen,
  });

  const { data: availableSlots } = useQuery({
    queryKey: ['/api/doctors', doctorId, 'availability'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/doctors/${doctorId}/availability?date=${today}`);
      return response.json();
    },
    enabled: !!doctorId && isOpen,
  });

  const createPaymentIntent = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/create-payment-intent', { 
        amount,
        doctorId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setStep(2);
    },
    onError: () => {
      toast({
        title: 'Payment Setup Failed',
        description: 'Unable to set up payment. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
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

  const onSubmit = (data: BookingFormData) => {
    setBookingData(data);
    if (doctor) {
      createPaymentIntent.mutate(parseFloat(doctor.consultationFee));
    }
  };

  const handleClose = () => {
    setStep(1);
    setClientSecret('');
    setBookingData(null);
    form.reset();
    onClose();
  };

  const handleBookingSuccess = () => {
    handleClose();
    onBookingComplete();
  };

  if (!doctor && !isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Book Appointment
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ) : doctor ? (
          <div className="space-y-6">
            {/* Doctor Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${doctor.user.email}`} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(doctor.user.firstName, doctor.user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
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
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Fee</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(doctor.consultationFee)}
                </p>
              </div>
            </div>

            {step === 1 ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
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
                    placeholder="Brief description of your concern..."
                  />
                  {form.formState.errors.reason && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.reason.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="insurance">Insurance</Label>
                  <Select onValueChange={(value) => form.setValue('insurance', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select insurance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aetna">Aetna</SelectItem>
                      <SelectItem value="bluecross">Blue Cross Blue Shield</SelectItem>
                      <SelectItem value="cigna">Cigna</SelectItem>
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
                    onClick={handleClose}
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
            ) : (
              clientSecret && bookingData && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentStep
                    doctor={doctor}
                    bookingData={bookingData}
                    onSuccess={handleBookingSuccess}
                    onCancel={() => setStep(1)}
                  />
                </Elements>
              )
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
