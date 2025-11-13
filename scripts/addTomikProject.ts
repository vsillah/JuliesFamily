import { storage } from "../server/storage";
import type { InsertContentItem } from "@shared/schema";
import fs from "fs";
import path from "path";

async function addTomikProject() {
  try {
    // Find Tomik's user record
    const users = await storage.getAllUsers();
    const tomik = users.find(u => u.email === "tomik.t@example.com");
    
    if (!tomik) {
      console.log("❌ Tomik Thompson not found");
      return;
    }

    const pdfFile = "My-pet-newsletter-_1763037994749.pdf";
    const pdfPath = path.join(process.cwd(), "attached_assets", pdfFile);
    
    if (!fs.existsSync(pdfPath)) {
      console.log(`❌ PDF file not found: ${pdfFile}`);
      return;
    }

    const projectContent: InsertContentItem = {
      type: "student_project",
      title: "My Pet Newsletter - Dwarf Hamster",
      description: "A comprehensive newsletter about dwarf hamsters covering their characteristics, habitat, care requirements, and interesting facts. Includes research on hamster population, varieties, and proper care techniques.",
      imageUrl: `/attached_assets/${pdfFile}`,
      order: 0,
      isActive: true,
      passionTags: ["stem", "literacy"],
      metadata: {
        submittingUserId: tomik.id,
        submittingUserEmail: tomik.email,
        submittingUserName: tomik.name,
        programId: "tech-goes-home",
        classId: "fall-2024",
        files: [
          {
            url: `/attached_assets/${pdfFile}`,
            alt: "My Pet Newsletter - Dwarf Hamster",
            uploadedAt: new Date("2024-11-15").toISOString(),
          }
        ],
        status: "approved",
        reviewedBy: "Admin",
        reviewedAt: new Date("2024-11-16").toISOString(),
      }
    };

    await storage.createContentItem(projectContent);
    console.log("✅ Successfully created project for Tomik Thompson");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

addTomikProject().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
