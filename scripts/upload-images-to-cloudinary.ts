import fs from 'fs';
import path from 'path';
import { uploadToCloudinary } from '../server/cloudinary';
import { db } from '../server/db';
import { imageAssets } from '../shared/schema';
import { eq } from 'drizzle-orm';

const imageMapping = [
  // Logo
  { 
    localPath: "image_1762053021045.png", 
    name: "site-logo", 
    usage: "branding",
    description: "Julie's Family Learning Program logo"
  },
  
  // Hero Images
  { 
    localPath: "Volunteer-and-student-3-scaled-qdm9920uh1lwqg6bdelecew1fr2owp93s8igmrbu2o_1762056863739.jpg", 
    name: "hero-volunteer-student", 
    usage: "hero",
    description: "Volunteer helping student - main hero image"
  },
  
  // Persona-specific hero images
  { 
    localPath: "Volunteer-and-student-3-scaled-qdm9920uh1lwqg6bdelecew1fr2owp93s8igmrbu2o_1762056863739.jpg", 
    name: "hero-student", 
    usage: "hero",
    description: "Student education hero image"
  },
  { 
    localPath: "PreK-Class-Photo-2025-600x451.jpg_1762056779821.webp", 
    name: "hero-parent", 
    usage: "hero",
    description: "Parent and children hero image"
  },
  { 
    localPath: "grad-pzi78gq1oq1dmudvugdez6xi97qltaefkuknv8rmrk_1762057083020.jpg", 
    name: "hero-donor", 
    usage: "hero",
    description: "Graduation ceremony - donor hero image"
  },
  { 
    localPath: "Volunteer-and-student-3-scaled-qdm9920uh1lwqg6bdelecew1fr2owp93s8igmrbu2o_1762056863739.jpg", 
    name: "hero-volunteer", 
    usage: "hero",
    description: "Volunteer helping student hero image"
  },
  
  // Service Section Images
  { 
    localPath: "PreK-Class-Photo-2025-600x451.jpg_1762056779821.webp", 
    name: "service-children", 
    usage: "services",
    description: "Children's services classroom"
  },
  { 
    localPath: "kathleen-pzi74mjrs2s885yl9an9ansqxknnds5w1uoabkgi68_1762057083009.jpg", 
    name: "service-family", 
    usage: "services",
    description: "Family development and wellness"
  },
  { 
    localPath: "Full-ABE-Classroom-scaled-qdm9b73m1gjf6h2cvbwt0vfu5cisfvr3eu09zg5jwg_1762057083015.jpg", 
    name: "service-adult", 
    usage: "services",
    description: "Adult basic education classroom"
  },
  
  // Event Images
  { 
    localPath: "April-6-Graduation-pzi49dxx55hv6neo81vxc4gp1ypmkznm7wn3q8iscg_1762057083004.jpg", 
    name: "event-anniversary", 
    usage: "events",
    description: "Anniversary celebration event"
  },
  { 
    localPath: "Bobby-and-Zea-scaled-pzi3sypfqd0ibx9h4gbl9rnrelnr3dggamaov6vf28_1762057083010.jpg", 
    name: "event-graduation", 
    usage: "events",
    description: "Graduation ceremony"
  },
  { 
    localPath: "dinoeggs-scaled-qdm9d9cv1dd2no2htq0bzup92scsbyxw11jmwb3g8w_1762057083014.jpg", 
    name: "event-family-fair", 
    usage: "events",
    description: "Family fair event"
  },
  
  // Donation CTA
  { 
    localPath: "grad-pzi78gq1oq1dmudvugdez6xi97qltaefkuknv8rmrk_1762057083020.jpg", 
    name: "donation-cta", 
    usage: "cta",
    description: "Graduation success story for donation CTA"
  },
  
  // Testimonial Images
  { 
    localPath: "generated_images/Testimonial_portrait_woman_22b27ef2.png", 
    name: "testimonial-1", 
    usage: "testimonials",
    description: "Testimonial portrait 1"
  },
  { 
    localPath: "generated_images/Testimonial_portrait_woman_2_0247f113.png", 
    name: "testimonial-2", 
    usage: "testimonials",
    description: "Testimonial portrait 2"
  },
  { 
    localPath: "generated_images/Testimonial_portrait_woman_3_8f3e6a1d.png", 
    name: "testimonial-3", 
    usage: "testimonials",
    description: "Testimonial portrait 3"
  },
];

async function uploadImages() {
  console.log('Starting image upload to Cloudinary...\n');
  
  const assetsDir = path.join(process.cwd(), 'attached_assets');
  
  for (const imageInfo of imageMapping) {
    try {
      const imagePath = path.join(assetsDir, imageInfo.localPath);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`⚠️  Skipping ${imageInfo.name} - file not found: ${imageInfo.localPath}`);
        continue;
      }
      
      console.log(`📤 Uploading ${imageInfo.name}...`);
      
      const imageBuffer = fs.readFileSync(imagePath);
      const originalFilename = path.basename(imageInfo.localPath);
      
      const cloudinaryResult = await uploadToCloudinary(imageBuffer, {
        folder: `julies-family-learning/${imageInfo.usage}`,
        publicId: imageInfo.name,
        upscale: true,
        quality: 'auto:best'
      });
      
      const [existingImage] = await db
        .select()
        .from(imageAssets)
        .where(eq(imageAssets.name, imageInfo.name))
        .limit(1);
      
      if (existingImage) {
        console.log(`   ↻ Updating existing record for ${imageInfo.name}`);
        await db
          .update(imageAssets)
          .set({
            cloudinaryPublicId: cloudinaryResult.publicId,
            cloudinaryUrl: cloudinaryResult.url,
            cloudinarySecureUrl: cloudinaryResult.secureUrl,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            format: cloudinaryResult.format,
            fileSize: cloudinaryResult.bytes,
          })
          .where(eq(imageAssets.name, imageInfo.name));
      } else {
        await db.insert(imageAssets).values({
          name: imageInfo.name,
          originalFilename,
          localPath: imageInfo.localPath,
          cloudinaryPublicId: cloudinaryResult.publicId,
          cloudinaryUrl: cloudinaryResult.url,
          cloudinarySecureUrl: cloudinaryResult.secureUrl,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          format: cloudinaryResult.format,
          fileSize: cloudinaryResult.bytes,
          usage: imageInfo.usage,
          uploadedBy: 'admin-test-004',
          isActive: true,
        });
      }
      
      console.log(`   ✅ ${imageInfo.name} uploaded successfully`);
      console.log(`      URL: ${cloudinaryResult.secureUrl}`);
      console.log(`      Size: ${cloudinaryResult.width}x${cloudinaryResult.height}\n`);
      
    } catch (error) {
      console.error(`   ❌ Error uploading ${imageInfo.name}:`, error);
    }
  }
  
  console.log('\n✨ Image upload complete!');
}

uploadImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
