import OpenAI from "openai";
import { storage } from "../storage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key",
});

export class AIService {
  async getRecommendations(userId: number, preferences: any) {
    try {
      // Get user's appointment history
      const pastAppointments = await storage.getAppointmentsByPatient(userId);
      
      // Get user data
      const user = await storage.getUser(userId);
      
      // Build context for AI
      const context = {
        userAge: preferences.age,
        userGender: preferences.gender,
        location: preferences.location,
        preferredSpecialties: preferences.specialties,
        pastAppointments: pastAppointments.map(apt => ({
          specialty: apt.doctor.specialty,
          rating: apt.doctor.rating,
          date: apt.appointmentDate,
        })),
        preferences: {
          maxDistance: preferences.maxDistance,
          priceRange: preferences.priceRange,
          availabilityPreference: preferences.availabilityPreference,
        },
      };

      const prompt = `
        Based on the following user context, recommend the most suitable doctors:
        ${JSON.stringify(context)}
        
        Consider factors like:
        - Past appointment history and preferences
        - Location and distance preferences
        - Specialty requirements
        - Price range
        - Availability preferences
        - Doctor ratings and reviews
        
        Please provide recommendations in JSON format with the following structure:
        {
          "recommendations": [
            {
              "doctorId": number,
              "reason": "string explaining why this doctor is recommended",
              "matchScore": number (1-10),
              "factors": ["factor1", "factor2", ...]
            }
          ]
        }
      `;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a medical recommendation AI that helps patients find the best doctors based on their needs and preferences.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const recommendations = JSON.parse(response.choices[0].message.content || "{}");
      
      // Get full doctor details for recommendations
      const doctorDetails = await Promise.all(
        recommendations.recommendations.map(async (rec: any) => {
          const doctor = await storage.getDoctor(rec.doctorId);
          return {
            ...doctor,
            recommendation: rec,
          };
        })
      );

      return doctorDetails;
    } catch (error) {
      console.error('AI recommendations error:', error);
      throw new Error('Failed to get AI recommendations');
    }
  }

  async analyzeDoctorSuitability(doctorId: number, patientCondition: string) {
    try {
      const doctor = await storage.getDoctor(doctorId);
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      const reviews = await storage.getReviewsByDoctor(doctorId);
      
      const prompt = `
        Analyze how suitable this doctor is for treating "${patientCondition}":
        
        Doctor Details:
        - Specialty: ${doctor.specialty}
        - Experience: ${doctor.experience} years
        - Rating: ${doctor.rating}/5 (${doctor.reviewCount} reviews)
        - Services: ${doctor.servicesOffered.join(', ')}
        - Bio: ${doctor.bio}
        
        Recent Reviews:
        ${reviews.slice(0, 5).map(r => `"${r.comment}" - Rating: ${r.rating}/5`).join('\n')}
        
        Please analyze and provide a JSON response with:
        {
          "suitabilityScore": number (1-10),
          "analysis": "detailed analysis of doctor's suitability",
          "strengths": ["strength1", "strength2", ...],
          "considerations": ["consideration1", "consideration2", ...],
          "recommendation": "recommend" | "somewhat_suitable" | "not_suitable"
        }
      `;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a medical analysis AI that evaluates doctor-patient compatibility based on conditions and specialties.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error('Doctor suitability analysis error:', error);
      throw new Error('Failed to analyze doctor suitability');
    }
  }
}

export const aiService = new AIService();
