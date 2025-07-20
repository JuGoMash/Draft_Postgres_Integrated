import patientsRoute from "./routes/patients";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { storage } from "./storage";
import { doctorService } from "./services/doctorService";
import { appointmentService } from "./services/appointmentService";
import { paymentService } from "./services/paymentService";
import { aiService } from "./services/aiService";
import { insertUserSchema, insertDoctorSchema, insertAppointmentSchema, insertReviewSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Connected WebSocket clients
const wsClients = new Set<WebSocket>();

// Authentication middleware
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// WebSocket broadcast function
const broadcastToClients = (message: any) => {
  const messageString = JSON.stringify(message);
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    wsClients.add(ws);

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      wsClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    });
  });

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
      
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
      
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get('/api/auth/user', authenticate, async (req: any, res) => {
    res.json({ ...req.user, password: undefined });
  });

  // Doctor routes
  app.get('/api/doctors', async (req, res) => {
    try {
      const filters = {
        specialty: req.query.specialty === 'all' ? undefined : req.query.specialty as string,
        location: req.query.location as string,
        insurance: req.query.insurance === 'all' ? undefined : req.query.insurance as string,
        availability: req.query.availability as string,
        gender: req.query.gender as string,
        language: req.query.language === 'all' ? undefined : req.query.language as string,
        rating: req.query.rating === 'all' ? undefined : req.query.rating ? parseFloat(req.query.rating as string) : undefined,
        services: req.query.services ? (req.query.services as string).split(',') : undefined,
        priceRange: req.query.priceRange as string,
        lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
        lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
        radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
      };

      const doctors = await storage.searchDoctors(filters);
      res.json(doctors);
    } catch (error) {
      console.error('Doctor search error:', error);
      res.status(500).json({ message: "Failed to search doctors" });
    }
  });

  // Top rated doctors
  app.get('/api/doctors/top-rated', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const doctors = await storage.getTopRatedDoctors(limit);
      res.json(doctors);
    } catch (error) {
      console.error('Get top rated doctors error:', error);
      res.status(500).json({ message: "Failed to get top rated doctors" });
    }
  });

  // Nearby doctors
  app.get('/api/doctors/nearby', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = parseFloat(req.query.radius as string) || 10;
      
      const doctors = await storage.getNearbyDoctors(lat, lng, radius);
      res.json(doctors);
    } catch (error) {
      console.error('Get nearby doctors error:', error);
      res.status(500).json({ message: "Failed to get nearby doctors" });
    }
  });

  app.get('/api/doctors/:id', async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const doctor = await storage.getDoctor(doctorId);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      res.json(doctor);
    } catch (error) {
      console.error('Get doctor error:', error);
      res.status(500).json({ message: "Failed to get doctor" });
    }
  });

  app.get('/api/doctors/:id/availability', async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const date = new Date(req.query.date as string);
      
      const slots = await storage.getAvailableSlots(doctorId, date);
      res.json(slots);
    } catch (error) {
      console.error('Get availability error:', error);
      res.status(500).json({ message: "Failed to get availability" });
    }
  });

  app.post('/api/doctors', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const doctorData = insertDoctorSchema.parse(req.body);
      const doctor = await storage.createDoctor({
        ...doctorData,
        userId: req.user.id,
      });

      res.json(doctor);
    } catch (error) {
      console.error('Create doctor error:', error);
      res.status(500).json({ message: "Failed to create doctor profile" });
    }
  });

  app.get('/api/doctors/:id/reviews', async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByDoctor(doctorId);
      res.json(reviews);
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ message: "Failed to get reviews" });
    }
  });

  // Appointment routes
  app.get('/api/appointments', authenticate, async (req: any, res) => {
    try {
      let appointments;
      
      if (req.user.role === 'doctor') {
        const doctor = await storage.getDoctorByUserId(req.user.id);
        if (!doctor) {
          return res.status(404).json({ message: "Doctor profile not found" });
        }
        appointments = await storage.getAppointmentsByDoctor(doctor.id);
      } else {
        appointments = await storage.getAppointmentsByPatient(req.user.id);
      }

      res.json(appointments);
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({ message: "Failed to get appointments" });
    }
  });

  app.post('/api/appointments', authenticate, async (req: any, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      
      const appointment = await storage.createAppointment({
        ...appointmentData,
        patientId: req.user.id,
      });

      // Broadcast real-time update
      broadcastToClients({
        type: 'APPOINTMENT_CREATED',
        data: appointment,
      });

      // Create notification for doctor
      const doctor = await storage.getDoctor(appointmentData.doctorId);
      if (doctor) {
        await storage.createNotification({
          userId: doctor.userId,
          type: 'appointment_booking',
          title: 'New Appointment Booking',
          message: `New appointment scheduled for ${appointment.appointmentDate}`,
          data: { appointmentId: appointment.id },
        });
      }

      res.json(appointment);
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch('/api/appointments/:id', authenticate, async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const updates = req.body;
      
      const appointment = await storage.updateAppointment(appointmentId, updates);
      
      // Broadcast real-time update
      broadcastToClients({
        type: 'APPOINTMENT_UPDATED',
        data: appointment,
      });

      res.json(appointment);
    } catch (error) {
      console.error('Update appointment error:', error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete('/api/appointments/:id', authenticate, async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      
      const appointment = await storage.cancelAppointment(appointmentId);
      
      // Broadcast real-time update
      broadcastToClients({
        type: 'APPOINTMENT_CANCELLED',
        data: appointment,
      });

      res.json(appointment);
    } catch (error) {
      console.error('Cancel appointment error:', error);
      res.status(500).json({ message: "Failed to cancel appointment" });
    }
  });

  // Review routes
  app.post('/api/reviews', authenticate, async (req: any, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      
      const review = await storage.createReview({
        ...reviewData,
        patientId: req.user.id,
      });

      res.json(review);
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Payment routes
  app.post('/api/create-payment-intent', authenticate, async (req: any, res) => {
    try {
      const { amount, appointmentId } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          appointmentId: appointmentId.toString(),
          patientId: req.user.id.toString(),
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Payment intent error:', error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.post('/api/stripe-webhook', async (req, res) => {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature']!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const appointmentId = parseInt(paymentIntent.metadata.appointmentId);
        
        // Update appointment payment status
        await storage.updateAppointment(appointmentId, {
          paymentStatus: 'paid',
          paymentIntentId: paymentIntent.id,
        });
        
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // AI recommendations route
  app.get('/api/doctors/recommendations', authenticate, async (req: any, res) => {
    try {
      const userPreferences = req.query;
      const recommendations = await aiService.getRecommendations(req.user.id, userPreferences);
      res.json(recommendations);
    } catch (error) {
      console.error('AI recommendations error:', error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Notifications routes
  app.get('/api/notifications', authenticate, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', authenticate, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(notificationId);
      res.json(notification);
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  return httpServer;
}

app.use("/api/patients", patientsRoute);