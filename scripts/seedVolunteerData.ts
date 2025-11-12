import { storage } from "../server/storage";
import type { InsertVolunteerEvent, InsertVolunteerShift, InsertVolunteerEnrollment } from "@shared/schema";

async function seedVolunteerData() {
  console.log("Starting volunteer data seeding...\n");

  const event: InsertVolunteerEvent = {
    name: "Adult Tutor Volunteer",
    description: "Help adult learners with reading, writing, math, and computer skills. Work one-on-one or in small groups during class time.",
    programArea: "Adult Basic Education",
    coordinatorName: "Sarah Johnson",
    coordinatorEmail: "sarah.johnson@jflp.org",
    coordinatorPhone: "(555) 123-4567",
    requirementsDescription: "No teaching experience required. Patient, supportive attitude and commitment to 1-2 hours per week.",
    isActive: true,
  };

  console.log("Creating volunteer event...");
  const createdEvent = await storage.createVolunteerEvent(event);
  console.log(`  ✓ Created event: ${createdEvent.name}`);

  const today = new Date();
  const shifts: InsertVolunteerShift[] = [];

  for (let week = 0; week < 8; week++) {
    for (let day = 1; day <= 4; day++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + (week * 7) + day);

      const morningShift: InsertVolunteerShift = {
        eventId: createdEvent.id,
        shiftDate: new Date(shiftDate),
        startTime: "09:30",
        endTime: "11:30",
        location: "Julie's Family Learning Program - Main Campus",
        maxVolunteers: 4,
        currentEnrollments: 0,
        notes: "Orientation attendance required",
      };

      const eveningShift: InsertVolunteerShift = {
        eventId: createdEvent.id,
        shiftDate: new Date(shiftDate),
        startTime: "18:00",
        endTime: "20:00",
        location: "Julie's Family Learning Program - Main Campus",
        maxVolunteers: 3,
        currentEnrollments: 0,
        notes: "Orientation attendance required",
      };

      shifts.push(morningShift, eveningShift);
    }
  }

  console.log(`Creating ${shifts.length} volunteer shifts...`);
  const createdShifts = [];
  for (const shift of shifts) {
    const created = await storage.createVolunteerShift(shift);
    createdShifts.push(created);
  }
  console.log(`  ✓ Created ${createdShifts.length} shifts for next 8 weeks`);

  console.log("\n✅ Volunteer data seeding completed!");
  console.log("\nTo create enrollments for a specific user, use the admin interface or run:");
  console.log("  storage.createVolunteerEnrollment({ userId: 'USER_ID', shiftId: 'SHIFT_ID', ... })");
  
  process.exit(0);
}

seedVolunteerData().catch((error) => {
  console.error("Error seeding volunteer data:", error);
  process.exit(1);
});
