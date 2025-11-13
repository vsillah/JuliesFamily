// Script to seed Tech Goes Home students with enrollment records and final projects
// Run with: npx tsx scripts/seedTechGoesHomeStudents.ts

import { storage } from "../server/storage";
import type { InsertUser, InsertTechGoesHomeEnrollment, InsertContentItem } from "@shared/schema";
import fs from "fs";
import path from "path";

// Student data based on the submitted projects
const students = [
  {
    name: "Tomik Thompson",
    email: "tomik.t@example.com",
    project: {
      title: "My Pet Newsletter - Dwarf Hamster",
      description: "A comprehensive newsletter about dwarf hamsters covering their characteristics, habitat, care requirements, and interesting facts. Includes research on hamster population, varieties, and proper care techniques.",
      pdfFile: "My-pet-newsletter-_1763037994749.pdf",
      passionTags: ["stem", "literacy"]
    }
  },
  {
    name: "Sammy Ortiz",
    email: "sammy.o@example.com",
    project: {
      title: "Loaded Shrimp Baked Potato Recipe",
      description: "A delicious recipe combining baked potatoes with seasoned jumbo shrimp, featuring detailed preparation steps, ingredient lists, and cooking tips. Created as part of the Tech Goes Home program.",
      pdfFile: "Recipe-3_1763037995008.pdf",
      passionTags: ["nutrition", "literacy"]
    }
  },
  {
    name: "Maria Santos",
    email: "maria.s@example.com",
    project: {
      title: "Banana Bread Recipe",
      description: "A classic banana bread recipe with detailed ingredients, preparation steps, and helpful tips. Features measurements, baking times, and suggestions for variations using raisins or cranberries.",
      pdfFile: "banana-bread-recipe_1763037992686.pdf",
      passionTags: ["nutrition", "literacy"]
    }
  },
  {
    name: "Jessica Rivera",
    email: "jessica.r@example.com",
    project: {
      title: "Philly Cheesesteak Egg Rolls",
      description: "An innovative fusion recipe combining the classic Philly cheesesteak with crispy egg roll wrappers. Includes ingredient lists, step-by-step preparation, and cooking instructions.",
      pdfFile: "Philly-cheesesteak-egg-rolls_1763037994902.pdf",
      passionTags: ["nutrition", "literacy"]
    }
  },
  {
    name: "Lisa Johnson",
    email: "lisa.j@example.com",
    project: {
      title: "Julie's Family Learning Program Benefits",
      description: "An informative newsletter highlighting the benefits and statistics of Julie's Family Learning Program, including education offerings, child development programs, and success percentages in life skills, math, science, and writing.",
      pdfFile: "Julies-Recipe_1763037994389.pdf",
      passionTags: ["literacy", "community"]
    }
  }
];

async function seedTechGoesHomeStudents() {
  console.log("Starting Tech Goes Home student seeding...\n");

  const programStartDate = new Date("2024-09-01");
  const programEndDate = new Date("2024-11-15");
  
  for (const student of students) {
    try {
      console.log(`\n📝 Processing student: ${student.name}`);
      
      // 1. Create or find user account
      console.log("  → Creating user account...");
      let user;
      try {
        const existingUsers = await storage.getAllUsers();
        user = existingUsers.find(u => u.email === student.email);
        
        if (!user) {
          const newUser: InsertUser = {
            email: student.email,
            name: student.name,
            role: "student",
            persona: "student",
            funnelStage: "retention", // Completed program
            isActive: true,
          };
          user = await storage.createUser(newUser);
          console.log(`    ✓ Created user: ${student.name}`);
        } else {
          console.log(`    ℹ User already exists: ${student.name}`);
        }
      } catch (error) {
        console.error(`    ✗ Error creating user: ${error}`);
        continue;
      }

      // 2. Create enrollment record
      console.log("  → Creating enrollment record...");
      try {
        const enrollment: InsertTechGoesHomeEnrollment = {
          userId: user.id,
          programName: "Tech Goes Home",
          enrollmentDate: new Date("2024-09-01"),
          programStartDate,
          programEndDate,
          status: "completed",
          totalClassesRequired: 15,
          completionDate: new Date("2024-11-15"),
          certificateIssued: true,
          chromebookReceived: true,
          internetActivated: true,
          notes: "Successfully completed all 15 classes and final project. Received Chromebook and internet access.",
        };
        
        const createdEnrollment = await storage.createTechGoesHomeEnrollment(enrollment);
        console.log(`    ✓ Enrollment created`);

        // 3. Create attendance records for 15 classes
        console.log("  → Creating attendance records...");
        let attendanceCount = 0;
        for (let classNum = 1; classNum <= 15; classNum++) {
          const classDate = new Date(programStartDate);
          // Classes are twice a week (Tuesdays and Thursdays)
          const weeksOffset = Math.floor((classNum - 1) / 2);
          const dayOffset = (classNum - 1) % 2 === 0 ? 0 : 2; // Tuesday = 0, Thursday = 2
          classDate.setDate(classDate.getDate() + (weeksOffset * 7) + dayOffset);

          await storage.createTechGoesHomeAttendance({
            enrollmentId: createdEnrollment.id,
            classDate,
            classNumber: classNum,
            attended: true,
            isMakeup: false,
            hoursCredits: 2,
            notes: classNum === 15 ? "Final class - submitted final project" : null,
          });
          attendanceCount++;
        }
        console.log(`    ✓ Created ${attendanceCount} attendance records`);

      } catch (error) {
        console.error(`    ✗ Error creating enrollment: ${error}`);
        continue;
      }

      // 4. Create student project content item
      console.log("  → Creating project content item...");
      try {
        const pdfPath = path.join(process.cwd(), "attached_assets", student.project.pdfFile);
        
        // Check if PDF exists
        if (!fs.existsSync(pdfPath)) {
          console.log(`    ⚠ PDF file not found: ${student.project.pdfFile}, skipping project upload`);
          continue;
        }

        const projectContent: InsertContentItem = {
          type: "student_project",
          title: student.project.title,
          description: student.project.description,
          imageUrl: `/attached_assets/${student.project.pdfFile}`, // Store path to PDF
          order: 0,
          isActive: true,
          passionTags: student.project.passionTags,
          metadata: {
            submittingUserId: user.id,
            submittingUserEmail: user.email,
            submittingUserName: user.name,
            programId: "tech-goes-home",
            classId: "fall-2024",
            files: [
              {
                url: `/attached_assets/${student.project.pdfFile}`,
                alt: student.project.title,
                uploadedAt: new Date("2024-11-15").toISOString(),
              }
            ],
            status: "approved",
            reviewedBy: "Admin",
            reviewedAt: new Date("2024-11-16").toISOString(),
          }
        };

        await storage.createContentItem(projectContent);
        console.log(`    ✓ Project content item created`);
        
      } catch (error) {
        console.error(`    ✗ Error creating project: ${error}`);
        continue;
      }

      console.log(`  ✅ Successfully processed ${student.name}`);
      
    } catch (error) {
      console.error(`\n❌ Failed to process ${student.name}:`, error);
    }
  }

  console.log("\n\n✅ Tech Goes Home student seeding complete!");
  console.log("\nSummary:");
  console.log(`- Created ${students.length} student accounts`);
  console.log(`- Created ${students.length} enrollment records`);
  console.log(`- Created ${students.length * 15} attendance records`);
  console.log(`- Created ${students.length} student project content items`);
  console.log("\n📊 Students can view their dashboard at: /student/tech-goes-home");
  console.log("🔧 Admins can manage projects at: /admin/content");
}

// Run the seed function
seedTechGoesHomeStudents()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  });
