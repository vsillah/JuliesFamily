// Admin Role Provisioning Storage Module
// Handles programs, admin entitlements, and impersonation sessions
import { eq, and, sql, desc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  programs,
  adminEntitlements,
  adminImpersonationSessions,
  techGoesHomeEnrollments,
  techGoesHomeAttendance,
  volunteerEnrollments,
  volunteerSessionLogs,
  users,
  type Program, type InsertProgram,
  type AdminEntitlement, type InsertAdminEntitlement,
  type AdminImpersonationSession, type InsertAdminImpersonationSession,
  type TechGoesHomeEnrollment, type InsertTechGoesHomeEnrollment,
  type TechGoesHomeAttendance, type InsertTechGoesHomeAttendance,
  type VolunteerEnrollment, type InsertVolunteerEnrollment,
  type VolunteerSessionLog, type InsertVolunteerSessionLog,
  type User,
  type ProgramType,
} from "@shared/schema";

export interface IAdminProvisioningStorage {
  // Program CRUD operations
  createProgram(program: InsertProgram): Promise<Program>;
  getAllPrograms(filters?: { 
    programType?: ProgramType; 
    isActive?: boolean;
    isAvailableForTesting?: boolean;
  }): Promise<Program[]>;
  getProgram(id: string): Promise<Program | undefined>;
  updateProgram(id: string, updates: Partial<InsertProgram>): Promise<Program | undefined>;
  deleteProgram(id: string): Promise<void>;
  
  // Admin Entitlement operations
  createAdminEntitlement(params: {
    adminId: string;
    programId: string;
    metadata?: Record<string, any>;
  }): Promise<{ entitlement: AdminEntitlement; enrollmentId: string }>;
  
  getActiveAdminEntitlements(adminId: string): Promise<AdminEntitlement[]>;
  getAdminEntitlements(adminId: string): Promise<AdminEntitlement[]>;
  getAdminEntitlement(id: string): Promise<AdminEntitlement | undefined>;
  updateAdminEntitlementStatus(id: string, isActive: boolean): Promise<AdminEntitlement | undefined>;
  hasActiveEntitlement(adminId: string, programId: string): Promise<boolean>;
  getActiveAdminEntitlementsWithPrograms(adminId: string): Promise<Array<AdminEntitlement & { program: Program }>>;
  
  // Impersonation Session operations
  createImpersonationSession(session: InsertAdminImpersonationSession): Promise<AdminImpersonationSession>;
  getActiveImpersonationSession(adminId: string): Promise<AdminImpersonationSession | undefined>;
  getImpersonationSessions(adminId: string): Promise<AdminImpersonationSession[]>;
  endImpersonationSession(sessionId: string): Promise<AdminImpersonationSession | undefined>;
  getCurrentlyImpersonatedUser(adminId: string): Promise<User | undefined>;
  hasActiveImpersonation(adminId: string): Promise<boolean>;
}

export function createAdminProvisioningStorage(db: NodePgDatabase<any>): IAdminProvisioningStorage {
  return {
    // ====================
    // Program CRUD
    // ====================
    
    async createProgram(program: InsertProgram): Promise<Program> {
      const [created] = await db.insert(programs).values(program).returning();
      return created;
    },
    
    async getAllPrograms(filters?: { 
      programType?: ProgramType; 
      isActive?: boolean;
      isAvailableForTesting?: boolean;
    }): Promise<Program[]> {
      const conditions = [];
      
      if (filters?.programType) {
        conditions.push(eq(programs.programType, filters.programType));
      }
      if (filters?.isActive !== undefined) {
        conditions.push(eq(programs.isActive, filters.isActive));
      }
      if (filters?.isAvailableForTesting !== undefined) {
        conditions.push(eq(programs.isAvailableForTesting, filters.isAvailableForTesting));
      }
      
      if (conditions.length === 0) {
        return await db.select().from(programs).orderBy(programs.name);
      }
      
      return await db
        .select()
        .from(programs)
        .where(and(...conditions))
        .orderBy(programs.name);
    },
    
    async getProgram(id: string): Promise<Program | undefined> {
      const [program] = await db
        .select()
        .from(programs)
        .where(eq(programs.id, id))
        .limit(1);
      return program;
    },
    
    async updateProgram(id: string, updates: Partial<InsertProgram>): Promise<Program | undefined> {
      const [updated] = await db
        .update(programs)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(programs.id, id))
        .returning();
      return updated;
    },
    
    async deleteProgram(id: string): Promise<void> {
      // Soft delete - set isActive = false
      await db
        .update(programs)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(programs.id, id));
    },
    
    // ====================
    // Admin Entitlements
    // ====================
    
    async createAdminEntitlement(params: {
      adminId: string;
      programId: string;
      metadata?: Record<string, any>;
    }): Promise<{ entitlement: AdminEntitlement; enrollmentId: string }> {
      // Transactional: create entitlement + test enrollment + auto-populate progress
      // Throws on failure, rolls back automatically
      
      return await db.transaction(async (tx) => {
        // 1. Get program details to determine enrollment type
        const [program] = await tx
          .select()
          .from(programs)
          .where(eq(programs.id, params.programId))
          .limit(1);
          
        if (!program) {
          throw new Error(`Program ${params.programId} not found`);
        }
        
        let enrollmentId: string;
        let tghEnrollmentId: string | null = null;
        let volunteerEnrollmentId: string | null = null;
        
        // 2. Create test enrollment based on program type
        if (program.programType === 'student_program' || program.programType === 'student_tgh') {
          // Create Tech Goes Home enrollment with auto-populated progress
          const autoConfig = program.autoPopulateConfig || {};
          const progressPercent = autoConfig.progressPercent || 50;
          const attendanceCount = autoConfig.attendanceCount || 8;
          
          const [enrollment] = await tx
            .insert(techGoesHomeEnrollments)
            .values({
              userId: params.adminId,
              programName: program.name,
              status: 'active',
              totalClassesRequired: 15,
              isTestData: true,
              createdByAdminId: params.adminId,
            })
            .returning();
          
          enrollmentId = enrollment.id;
          tghEnrollmentId = enrollment.id;
          
          // Auto-populate attendance records
          for (let i = 0; i < attendanceCount; i++) {
            const classDate = new Date();
            classDate.setDate(classDate.getDate() - (attendanceCount - i) * 7); // Weekly classes going back
            
            await tx.insert(techGoesHomeAttendance).values({
              enrollmentId: enrollment.id,
              classDate,
              classNumber: i + 1,
              attended: true,
              hoursCredits: 2,
              isTestData: true,
            });
          }
          
        } else if (program.programType === 'volunteer_opportunity') {
          // Create volunteer enrollment
          if (!program.volunteerShiftId) {
            throw new Error(`Program ${program.name} has no volunteer shift configured`);
          }
          
          const [enrollment] = await tx
            .insert(volunteerEnrollments)
            .values({
              shiftId: program.volunteerShiftId,
              userId: params.adminId,
              enrollmentStatus: 'confirmed',
              applicationStatus: 'approved',
              isTestData: true,
              createdByAdminId: params.adminId,
            })
            .returning();
          
          enrollmentId = enrollment.id;
          volunteerEnrollmentId = enrollment.id;
          
          // Auto-populate volunteer session logs
          const autoConfig = program.autoPopulateConfig || {};
          const hoursServed = autoConfig.hoursServed || 2; // Default: 2 hours
          const minutesServed = hoursServed * 60;
          
          const sessionDate = new Date();
          sessionDate.setDate(sessionDate.getDate() - 7); // Last week
          
          await tx.insert(volunteerSessionLogs).values({
            enrollmentId: enrollment.id,
            attended: true,
            checkInTime: sessionDate,
            checkOutTime: new Date(sessionDate.getTime() + minutesServed * 60 * 1000),
            minutesServed,
            isTestData: true,
          });
        } else {
          throw new Error(`Unknown program type: ${program.programType}`);
        }
        
        // 3. Create entitlement record linking to enrollment
        const [entitlement] = await tx
          .insert(adminEntitlements)
          .values({
            adminId: params.adminId,
            programId: params.programId,
            tghEnrollmentId,
            volunteerEnrollmentId,
            metadata: params.metadata,
            isActive: true,
          })
          .returning();
        
        return { entitlement, enrollmentId };
      });
    },
    
    async getActiveAdminEntitlements(adminId: string): Promise<AdminEntitlement[]> {
      return await db
        .select()
        .from(adminEntitlements)
        .where(and(
          eq(adminEntitlements.adminId, adminId),
          eq(adminEntitlements.isActive, true)
        ))
        .orderBy(desc(adminEntitlements.createdAt));
    },
    
    async getAdminEntitlements(adminId: string): Promise<AdminEntitlement[]> {
      return await db
        .select()
        .from(adminEntitlements)
        .where(eq(adminEntitlements.adminId, adminId))
        .orderBy(desc(adminEntitlements.createdAt));
    },
    
    async getAdminEntitlement(id: string): Promise<AdminEntitlement | undefined> {
      const [entitlement] = await db
        .select()
        .from(adminEntitlements)
        .where(eq(adminEntitlements.id, id))
        .limit(1);
      return entitlement;
    },
    
    async updateAdminEntitlementStatus(id: string, isActive: boolean): Promise<AdminEntitlement | undefined> {
      const updateData: Partial<AdminEntitlement> = {
        isActive,
        updatedAt: new Date(),
      };
      
      if (!isActive) {
        updateData.deactivatedAt = new Date();
      }
      
      const [updated] = await db
        .update(adminEntitlements)
        .set(updateData)
        .where(eq(adminEntitlements.id, id))
        .returning();
      
      return updated;
    },
    
    async hasActiveEntitlement(adminId: string, programId: string): Promise<boolean> {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adminEntitlements)
        .where(and(
          eq(adminEntitlements.adminId, adminId),
          eq(adminEntitlements.programId, programId),
          eq(adminEntitlements.isActive, true)
        ));
      
      return (result?.count ?? 0) > 0;
    },
    
    async getActiveAdminEntitlementsWithPrograms(adminId: string): Promise<Array<AdminEntitlement & { program: Program }>> {
      const results = await db
        .select()
        .from(adminEntitlements)
        .innerJoin(programs, eq(adminEntitlements.programId, programs.id))
        .where(and(
          eq(adminEntitlements.adminId, adminId),
          eq(adminEntitlements.isActive, true)
        ))
        .orderBy(desc(adminEntitlements.createdAt));
      
      return results.map(row => ({
        ...row.admin_entitlements,
        program: row.programs,
      }));
    },

    async getAllAdminEntitlementsWithPrograms(): Promise<Array<AdminEntitlement & { program: Program }>> {
      const results = await db
        .select()
        .from(adminEntitlements)
        .innerJoin(programs, eq(adminEntitlements.programId, programs.id))
        .where(eq(adminEntitlements.isActive, true))
        .orderBy(desc(adminEntitlements.createdAt));
      
      return results.map(row => ({
        ...row.admin_entitlements,
        program: row.programs,
      }));
    },
    
    // ====================
    // Impersonation Sessions
    // ====================
    
    async createImpersonationSession(session: InsertAdminImpersonationSession): Promise<AdminImpersonationSession> {
      // Transactional: deactivate any existing active session for this admin
      return await db.transaction(async (tx) => {
        // End any existing active sessions for this admin
        await tx
          .update(adminImpersonationSessions)
          .set({ 
            isActive: false, 
            endedAt: new Date() 
          })
          .where(and(
            eq(adminImpersonationSessions.adminId, session.adminId),
            eq(adminImpersonationSessions.isActive, true)
          ));
        
        // Create new session
        const [created] = await tx
          .insert(adminImpersonationSessions)
          .values({
            ...session,
            isActive: true,
            startedAt: new Date(),
          })
          .returning();
        
        return created;
      });
    },
    
    async getActiveImpersonationSession(adminId: string): Promise<AdminImpersonationSession | undefined> {
      const [session] = await db
        .select()
        .from(adminImpersonationSessions)
        .where(and(
          eq(adminImpersonationSessions.adminId, adminId),
          eq(adminImpersonationSessions.isActive, true)
        ))
        .limit(1);
      
      return session;
    },
    
    async getImpersonationSessions(adminId: string): Promise<AdminImpersonationSession[]> {
      return await db
        .select()
        .from(adminImpersonationSessions)
        .where(eq(adminImpersonationSessions.adminId, adminId))
        .orderBy(desc(adminImpersonationSessions.createdAt));
    },
    
    async endImpersonationSession(sessionId: string): Promise<AdminImpersonationSession | undefined> {
      const [updated] = await db
        .update(adminImpersonationSessions)
        .set({ 
          isActive: false, 
          endedAt: new Date() 
        })
        .where(eq(adminImpersonationSessions.id, sessionId))
        .returning();
      
      return updated;
    },
    
    async getCurrentlyImpersonatedUser(adminId: string): Promise<User | undefined> {
      const results = await db
        .select()
        .from(adminImpersonationSessions)
        .innerJoin(users, eq(adminImpersonationSessions.impersonatedUserId, users.id))
        .where(and(
          eq(adminImpersonationSessions.adminId, adminId),
          eq(adminImpersonationSessions.isActive, true)
        ))
        .limit(1);
      
      return results[0]?.users;
    },
    
    async hasActiveImpersonation(adminId: string): Promise<boolean> {
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adminImpersonationSessions)
        .where(and(
          eq(adminImpersonationSessions.adminId, adminId),
          eq(adminImpersonationSessions.isActive, true)
        ));
      
      return (result?.count ?? 0) > 0;
    },
  };
}
