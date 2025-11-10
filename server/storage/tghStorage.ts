// Tech Goes Home Storage Module
// Handles CRUD operations for Tech Goes Home program enrollments and attendance tracking

import { 
  techGoesHomeEnrollments, techGoesHomeAttendance, users,
  type TechGoesHomeEnrollment, type InsertTechGoesHomeEnrollment,
  type TechGoesHomeAttendance, type InsertTechGoesHomeAttendance
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, count, sum, sql } from "drizzle-orm";

export interface ITechGoesHomeStorage {
  // Enrollment operations
  createTechGoesHomeEnrollment(enrollment: InsertTechGoesHomeEnrollment): Promise<TechGoesHomeEnrollment>;
  getTechGoesHomeEnrollment(id: string): Promise<TechGoesHomeEnrollment | undefined>;
  getTechGoesHomeEnrollmentByUserId(userId: string): Promise<TechGoesHomeEnrollment | undefined>;
  getAllTechGoesHomeEnrollments(): Promise<TechGoesHomeEnrollment[]>;
  getActiveTechGoesHomeEnrollments(): Promise<TechGoesHomeEnrollment[]>;
  updateTechGoesHomeEnrollment(id: string, updates: Partial<InsertTechGoesHomeEnrollment>): Promise<TechGoesHomeEnrollment | undefined>;
  
  // Attendance operations
  createTechGoesHomeAttendance(attendance: InsertTechGoesHomeAttendance): Promise<TechGoesHomeAttendance>;
  getTechGoesHomeAttendance(enrollmentId: string): Promise<TechGoesHomeAttendance[]>;
  updateTechGoesHomeAttendance(id: string, updates: Partial<InsertTechGoesHomeAttendance>): Promise<TechGoesHomeAttendance | undefined>;
  deleteTechGoesHomeAttendance(id: string): Promise<void>;
  
  // Progress tracking
  getStudentProgress(userId: string): Promise<{
    enrollment: TechGoesHomeEnrollment | null;
    attendance: TechGoesHomeAttendance[];
    classesCompleted: number;
    classesRemaining: number;
    hoursCompleted: number;
    percentComplete: number;
    isEligibleForRewards: boolean;
  } | null>;
}

export function createTechGoesHomeStorage(): ITechGoesHomeStorage {
  return {
    // Enrollment operations
    async createTechGoesHomeEnrollment(enrollment: InsertTechGoesHomeEnrollment): Promise<TechGoesHomeEnrollment> {
      const [created] = await db.insert(techGoesHomeEnrollments).values(enrollment).returning();
      return created;
    },
    
    async getTechGoesHomeEnrollment(id: string): Promise<TechGoesHomeEnrollment | undefined> {
      const [enrollment] = await db.select().from(techGoesHomeEnrollments).where(eq(techGoesHomeEnrollments.id, id));
      return enrollment;
    },
    
    async getTechGoesHomeEnrollmentByUserId(userId: string): Promise<TechGoesHomeEnrollment | undefined> {
      const [enrollment] = await db.select().from(techGoesHomeEnrollments)
        .where(eq(techGoesHomeEnrollments.userId, userId))
        .orderBy(desc(techGoesHomeEnrollments.createdAt))
        .limit(1);
      return enrollment;
    },
    
    async getAllTechGoesHomeEnrollments(): Promise<TechGoesHomeEnrollment[]> {
      return await db.select().from(techGoesHomeEnrollments).orderBy(desc(techGoesHomeEnrollments.enrollmentDate));
    },
    
    async getActiveTechGoesHomeEnrollments(): Promise<TechGoesHomeEnrollment[]> {
      return await db.select().from(techGoesHomeEnrollments)
        .where(eq(techGoesHomeEnrollments.status, 'active'))
        .orderBy(desc(techGoesHomeEnrollments.enrollmentDate));
    },
    
    async updateTechGoesHomeEnrollment(id: string, updates: Partial<InsertTechGoesHomeEnrollment>): Promise<TechGoesHomeEnrollment | undefined> {
      const [updated] = await db.update(techGoesHomeEnrollments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(techGoesHomeEnrollments.id, id))
        .returning();
      return updated;
    },
    
    // Attendance operations
    async createTechGoesHomeAttendance(attendance: InsertTechGoesHomeAttendance): Promise<TechGoesHomeAttendance> {
      const [created] = await db.insert(techGoesHomeAttendance).values(attendance).returning();
      return created;
    },
    
    async getTechGoesHomeAttendance(enrollmentId: string): Promise<TechGoesHomeAttendance[]> {
      return await db.select().from(techGoesHomeAttendance)
        .where(eq(techGoesHomeAttendance.enrollmentId, enrollmentId))
        .orderBy(techGoesHomeAttendance.classDate);
    },
    
    async updateTechGoesHomeAttendance(id: string, updates: Partial<InsertTechGoesHomeAttendance>): Promise<TechGoesHomeAttendance | undefined> {
      const [updated] = await db.update(techGoesHomeAttendance)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(techGoesHomeAttendance.id, id))
        .returning();
      return updated;
    },
    
    async deleteTechGoesHomeAttendance(id: string): Promise<void> {
      await db.delete(techGoesHomeAttendance).where(eq(techGoesHomeAttendance.id, id));
    },
    
    // Progress tracking with aggregation
    async getStudentProgress(userId: string): Promise<{
      enrollment: TechGoesHomeEnrollment | null;
      attendance: TechGoesHomeAttendance[];
      classesCompleted: number;
      classesRemaining: number;
      hoursCompleted: number;
      percentComplete: number;
      isEligibleForRewards: boolean;
    } | null> {
      // Get the most recent enrollment for this user
      const enrollment = await this.getTechGoesHomeEnrollmentByUserId(userId);
      
      if (!enrollment) {
        return null;
      }
      
      // Guard against invalid totalClassesRequired
      const totalRequired = enrollment.totalClassesRequired || 15;
      if (totalRequired <= 0) {
        return {
          enrollment,
          attendance: [],
          classesCompleted: 0,
          classesRemaining: totalRequired,
          hoursCompleted: 0,
          percentComplete: 0,
          isEligibleForRewards: false,
        };
      }
      
      // Get all attendance records for this enrollment
      const attendance = await this.getTechGoesHomeAttendance(enrollment.id);
      
      // Calculate progress metrics
      const attendedClasses = attendance.filter(a => a.attended);
      const classesCompleted = attendedClasses.length;
      const hoursCompleted = attendedClasses.reduce((total, a) => total + (a.hoursCredits || 0), 0);
      const classesRemaining = Math.max(0, totalRequired - classesCompleted);
      const percentComplete = Math.min(100, Math.round((classesCompleted / totalRequired) * 100));
      const isEligibleForRewards = classesCompleted >= totalRequired;
      
      return {
        enrollment,
        attendance,
        classesCompleted,
        classesRemaining,
        hoursCompleted,
        percentComplete,
        isEligibleForRewards,
      };
    },
  };
}
