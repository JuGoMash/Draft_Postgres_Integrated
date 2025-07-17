# IronLedgerMedMap - Medical Appointment Platform

## Overview

IronLedgerMedMap is a comprehensive medical appointment platform that connects patients with healthcare providers. The application features a modern React frontend with TypeScript, a Node.js/Express backend, and utilizes Drizzle ORM with PostgreSQL for data management. The platform supports doctor discovery, appointment booking, real-time notifications, and payment processing through Stripe.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and build processes

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Real-time Communication**: WebSocket support for live updates
- **API Design**: RESTful API with structured error handling

## Key Components

### Database Schema
The application uses a comprehensive database schema with the following key entities:
- **Users**: Base user accounts with authentication and profile information
- **Doctors**: Extended user profiles with medical credentials, specialties, and availability
- **Appointments**: Booking records linking patients to doctors with scheduling details
- **Reviews**: Patient feedback and ratings for doctors
- **Notifications**: System-wide messaging for appointment updates
- **Availability Slots**: Time-based booking slots for doctors

### Authentication System
- JWT token-based authentication
- Role-based access control (patient, doctor, admin)
- Password hashing with bcrypt
- Middleware for route protection

### Search and Discovery
- Advanced filtering by specialty, location, insurance, and availability
- Geographic search with latitude/longitude coordinates
- Rating-based sorting and recommendations
- Real-time availability checking

### Appointment Management
- Real-time booking system with conflict prevention
- Automated availability slot management
- Appointment status tracking and notifications
- Calendar integration support

### Payment Processing
- Stripe integration for secure payment processing
- Payment intent creation and management
- Subscription and customer management
- Refund processing capabilities

## Data Flow

1. **User Registration/Login**: Users authenticate and receive JWT tokens
2. **Doctor Discovery**: Patients search and filter doctors based on criteria
3. **Appointment Booking**: Real-time availability checking and slot reservation
4. **Payment Processing**: Stripe handles secure payment transactions
5. **Notification System**: WebSocket connections provide real-time updates
6. **Review System**: Post-appointment feedback and rating collection

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@stripe/stripe-js**: Payment processing integration
- **@sendgrid/mail**: Email notification system
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI component primitives

### Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first CSS framework
- **Drizzle Kit**: Database schema management and migrations

### Authentication & Security
- **jsonwebtoken**: JWT token generation and verification
- **bcrypt**: Password hashing and security
- **CORS**: Cross-origin resource sharing configuration

## Deployment Strategy

### Build Process
- Frontend builds to `dist/public` directory via Vite
- Backend transpiles TypeScript to ES modules using esbuild
- Single command deployment with `npm run build`

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- JWT secret configuration for authentication
- Stripe API keys for payment processing
- SendGrid API key for email notifications

### Development Workflow
- Hot module replacement for frontend development
- TypeScript compilation checking
- Database schema synchronization via Drizzle Kit
- Unified development server handling both frontend and API routes

The architecture emphasizes type safety, real-time capabilities, and modern web development practices while maintaining a clean separation of concerns between frontend and backend systems.