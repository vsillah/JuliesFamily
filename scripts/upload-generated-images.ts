import { readFileSync } from 'fs';
import { join } from 'path';
import { storage } from '../server/storage';
import { uploadToCloudinary } from '../server/cloudinary';

interface ImageMapping {
  filename: string;
  name: string;
  altText: string;
  category: string;
}

const imageMappings: ImageMapping[] = [
  {
    filename: 'Adult_education_students_learning_781bb5d3.png',
    name: 'hero-student',
    altText: 'Adult education students learning together in classroom',
    category: 'hero'
  },
  {
    filename: 'Adult_student_graduation_portrait_efeec352.png',
    name: 'hero-student-success',
    altText: 'Adult student celebrating graduation with diploma',
    category: 'hero'
  },
  {
    filename: 'PreK_classroom_learning_environment_830015ea.png',
    name: 'hero-parent',
    altText: 'PreK classroom with children engaged in learning activities',
    category: 'hero'
  },
  {
    filename: 'Child_engaged_in_learning_68c28741.png',
    name: 'service-child-learning',
    altText: 'Young child focused on educational activity',
    category: 'service'
  },
  {
    filename: 'Professional_partnership_collaboration_meeting_f14bd523.png',
    name: 'hero-provider',
    altText: 'Professional partners collaborating in meeting',
    category: 'hero'
  },
  {
    filename: 'Volunteer_tutoring_adult_student_4485b0ce.png',
    name: 'hero-volunteer',
    altText: 'Volunteer tutor helping adult student one-on-one',
    category: 'hero'
  },
  {
    filename: 'Volunteers_collaborating_at_event_8c8b3b1f.png',
    name: 'event-volunteer',
    altText: 'Volunteers working together at community event',
    category: 'event'
  },
  {
    filename: 'Families_at_community_event_c4d29d67.png',
    name: 'cta-community',
    altText: 'Diverse families engaged at community center event',
    category: 'cta'
  },
  {
    filename: 'Hands_together_showing_community_b0e0e375.png',
    name: 'hero-donor',
    altText: 'Hands coming together showing community unity and support',
    category: 'hero'
  },
  {
    filename: 'Multigenerational_family_portrait_outdoors_48943ef2.png',
    name: 'testimonial-family',
    altText: 'Multigenerational family portrait outdoors',
    category: 'testimonial'
  }
];

async function uploadGeneratedImages() {
  console.log('Starting upload of generated images to Cloudinary...\n');

  for (const mapping of imageMappings) {
    try {
      const imagePath = join(process.cwd(), 'attached_assets', 'generated_images', mapping.filename);
      
      console.log(`Processing: ${mapping.filename}`);
      console.log(`  → Name: ${mapping.name}`);
      
      // Read image file
      const imageBuffer = readFileSync(imagePath);
      console.log(`  → Size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`);
      
      // Upload to Cloudinary with upscaling
      console.log(`  → Uploading to Cloudinary...`);
      const cloudinaryResult = await uploadToCloudinary(imageBuffer, {
        folder: 'julies-family-learning/generated',
        publicId: mapping.name,
        upscale: true,
        quality: 'auto:best'
      });
      
      console.log(`  → Cloudinary URL: ${cloudinaryResult.secureUrl}`);
      
      // Check if image asset already exists
      const allImages = await storage.getAllImageAssets();
      const existingImage = allImages.find(img => img.name === mapping.name);
      
      if (existingImage) {
        // Update existing image
        console.log(`  → Updating existing image asset in database...`);
        await storage.updateImageAsset(existingImage.id, {
          cloudinaryPublicId: cloudinaryResult.publicId,
          cloudinaryUrl: cloudinaryResult.url,
          cloudinarySecureUrl: cloudinaryResult.secureUrl,
          altText: mapping.altText,
          category: mapping.category,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height
        });
      } else {
        // Create new image asset
        console.log(`  → Creating new image asset in database...`);
        await storage.createImageAsset({
          name: mapping.name,
          cloudinaryPublicId: cloudinaryResult.publicId,
          cloudinaryUrl: cloudinaryResult.url,
          cloudinarySecureUrl: cloudinaryResult.secureUrl,
          altText: mapping.altText,
          category: mapping.category,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height
        });
      }
      
      console.log(`  ✓ Successfully processed ${mapping.name}\n`);
      
    } catch (error) {
      console.error(`  ✗ Error processing ${mapping.filename}:`, error);
      console.log('');
    }
  }
  
  console.log('Upload complete!');
  process.exit(0);
}

uploadGeneratedImages().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
