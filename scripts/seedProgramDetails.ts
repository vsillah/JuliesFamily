import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import ws from 'ws';
import * as schema from '../shared/schema';

// Database connection
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Program detail data based on juliesfamily.org/services
const PROGRAM_DETAILS = [
  {
    id: 'adult-education',
    title: 'Adult Education',
    description: 'High school equivalency preparation, basic education, and family literacy programs',
    imageName: 'service-adult',
    overview: "Our Adult Education program provides comprehensive support for adult learners seeking to complete their high school education or improve their basic skills. We offer personalized instruction in a supportive, family-centered environment that recognizes the unique challenges adult learners face.",
    ageRange: '16+ years',
    schedule: 'Flexible',
    location: 'On-site',
    cost: 'Free',
    features: [
      'Adult Basic Education (ABE) classes for reading, writing, and math fundamentals',
      'High school equivalency prep classes (HiSet, GED)',
      'Academic tutoring tailored to individual learning needs',
      'Digital literacy classes to build computer and technology skills',
      'Parenting skills and parent-as-teacher support groups',
      'Family health, home management, and relationship classes',
      'Monthly "parent and child together" activities',
      'Guest speakers on topics of parental concern',
      'Family financial literacy classes'
    ],
    enrollmentSteps: [
      'Fill out our online interest form or call our office',
      'Schedule an initial assessment to determine your skill level and goals',
      'Meet with our education coordinator to create your personalized learning plan',
      'Begin classes at your own pace with ongoing support from our instructors'
    ],
    faqs: [
      {
        question: 'Do I need a high school diploma to enroll?',
        answer: 'No! Our program is designed for adults who want to complete their high school education or improve their basic skills. We welcome learners at all levels.'
      },
      {
        question: 'How long does it take to prepare for the HiSet or GED?',
        answer: 'The timeline varies by individual. Some students are ready within a few months, while others may need a year or more. We work at your pace and provide support every step of the way.'
      },
      {
        question: 'Can I attend if I have young children?',
        answer: 'Yes! We offer onsite childcare for children ages 3 months to 6 years while you attend classes. This is one of our core services to support family success.'
      },
      {
        question: 'What if I work during the day?',
        answer: 'We offer flexible scheduling options including evening classes. Contact us to discuss what works best for your situation.'
      }
    ],
    defaultPersona: 'student' as const
  },
  {
    id: 'childrens-services',
    title: "Children's Services",
    description: 'Licensed early education center for children ages 3 months to 6 years',
    imageName: 'cdc-UqTrGSohyCs-unsplash',
    overview: "Our licensed early education center provides a nurturing, educational environment for children ages 3 months to 6 years. We partner with Boston Public Schools' Pre-K program and offer comprehensive support to help your child thrive and prepare for school success.",
    ageRange: '3 months - 6 years',
    schedule: 'Monday-Friday, flexible hours',
    location: 'On-site licensed center',
    cost: 'Income-based',
    features: [
      'Licensed onsite early education center with certified teachers',
      'Age-appropriate curriculum for infants, toddlers, and preschoolers',
      'Boston Pre-K partnership for 4-year-olds',
      'Early intervention referrals and developmental screenings',
      'Assistance with transition to public school enrollment',
      'Regular parent-teacher meetings and communication',
      'Daily progress reports to keep families informed',
      'Nutritious meals and snacks provided',
      'Safe, stimulating learning environment'
    ],
    enrollmentSteps: [
      'Contact us to schedule a tour of our early education center',
      'Complete the enrollment application and provide required documentation',
      'Meet with our childcare director to discuss your child\'s needs and our program',
      'Complete enrollment paperwork and schedule your child\'s start date'
    ],
    faqs: [
      {
        question: 'What ages do you serve?',
        answer: 'We provide care and education for children from 3 months old through 6 years old, including infants, toddlers, and preschoolers.'
      },
      {
        question: 'Are you licensed?',
        answer: 'Yes, we are a fully licensed early education center that meets all state requirements for health, safety, and educational quality.'
      },
      {
        question: 'Do you offer Boston Pre-K?',
        answer: 'Yes! We are a Boston Pre-K partner site, offering high-quality preschool programming for 4-year-olds at no cost to eligible Boston families.'
      },
      {
        question: 'What are your hours?',
        answer: 'We are open Monday through Friday with flexible scheduling options. Contact us to discuss specific hours that work for your family\'s needs.'
      },
      {
        question: 'How much does it cost?',
        answer: 'Our fees are income-based, and we work with families to ensure childcare is affordable. Many families qualify for subsidies. We can discuss payment options during enrollment.'
      }
    ],
    defaultPersona: 'parent' as const
  },
  {
    id: 'workforce-development',
    title: 'Workforce Development',
    description: 'Career counseling, college readiness, and support services for your next steps',
    imageName: 'sebastian-leon-prado-dBiIcdxMWfE-unsplash',
    overview: "Our Workforce Development program helps you take the next steps toward a better future. Whether you're pursuing college, starting a new career, or need support during transitions, we provide comprehensive guidance, resources, and advocacy to help you succeed.",
    ageRange: 'Adults 18+',
    schedule: 'Flexible appointments',
    location: 'On-site & virtual',
    cost: 'Free',
    features: [
      'College and career readiness classes to prepare for your next steps',
      'Professional resume preparation and interview practice',
      'Assistance with financial aid, scholarships, and college applications',
      'Support for transitioning to jobs, school, or training programs',
      'Post-employment and post-college support to ensure continued success',
      'Individual career counseling tailored to your goals',
      'Onsite case management and personal advocacy',
      'Referrals to our network of partner organizations and resources',
      'Food and emergency assistance when needed',
      'Transportation assistance to remove barriers to success',
      'Housing, health, legal, and financial advocacy support',
      'Testing accommodations for learners with special needs',
      'Access to technology, tutoring, and childcare during programs'
    ],
    enrollmentSteps: [
      'Fill out our interest form or contact our office to schedule a meeting',
      'Meet with a career counselor to discuss your goals and current situation',
      'Create an individualized plan with action steps and milestones',
      'Access services and support as needed, with ongoing guidance from your counselor'
    ],
    faqs: [
      {
        question: 'Do I need to be enrolled in other programs to access workforce services?',
        answer: 'No, our workforce development services are available to all community members. However, many of our students benefit from combining workforce services with our education programs.'
      },
      {
        question: 'Can you help me find a job?',
        answer: 'We provide career counseling, resume preparation, interview practice, and connections to employers. While we don\'t place people in jobs directly, we give you all the tools and support you need to succeed in your job search.'
      },
      {
        question: 'What if I need help with things like housing or food while I\'m looking for work?',
        answer: 'We provide emergency assistance and can connect you with our network of partner organizations for housing, food, transportation, and other critical needs. We believe in addressing the whole person, not just employment.'
      },
      {
        question: 'Do you help with college applications?',
        answer: 'Yes! We assist with every step of the college application process, including filling out applications, writing essays, applying for financial aid, and finding scholarships.'
      }
    ],
    defaultPersona: 'student' as const
  }
];

async function seedProgramDetails() {
  console.log('Starting program details seeding...\n');

  try {
    let createdCount = 0;
    let updatedCount = 0;

    console.log('=== Seeding Program Details ===');

    for (const programData of PROGRAM_DETAILS) {
      // Check if this program detail already exists
      const existing = await db
        .select()
        .from(schema.contentItems)
        .where(eq(schema.contentItems.type, 'program_detail'));

      const existingProgram = existing.find(p => {
        const meta = p.metadata as any;
        return meta?.programId === programData.id;
      });

      if (existingProgram) {
        // Update existing program detail
        await db
          .update(schema.contentItems)
          .set({
            title: programData.title,
            description: programData.description,
            imageName: programData.imageName,
            metadata: {
              programId: programData.id,
              overview: programData.overview,
              ageRange: programData.ageRange,
              schedule: programData.schedule,
              location: programData.location,
              cost: programData.cost,
              features: programData.features,
              enrollmentSteps: programData.enrollmentSteps,
              faqs: programData.faqs,
              defaultPersona: programData.defaultPersona
            }
          })
          .where(eq(schema.contentItems.id, existingProgram.id));

        updatedCount++;
        console.log(`  ✓ Updated: ${programData.title}`);
      } else {
        // Create new program detail
        await db
          .insert(schema.contentItems)
          .values({
            type: 'program_detail',
            title: programData.title,
            description: programData.description,
            imageName: programData.imageName,
            order: 0,
            isActive: true,
            metadata: {
              programId: programData.id,
              overview: programData.overview,
              ageRange: programData.ageRange,
              schedule: programData.schedule,
              location: programData.location,
              cost: programData.cost,
              features: programData.features,
              enrollmentSteps: programData.enrollmentSteps,
              faqs: programData.faqs,
              defaultPersona: programData.defaultPersona
            }
          });

        createdCount++;
        console.log(`  ✓ Created: ${programData.title}`);
      }
    }

    console.log(`\n=== Seeding Complete ===`);
    console.log(`Created: ${createdCount} program details`);
    console.log(`Updated: ${updatedCount} program details`);
    console.log(`Total: ${PROGRAM_DETAILS.length} program details in database\n`);
  } catch (error) {
    console.error('Error seeding program details:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed function
seedProgramDetails()
  .then(() => {
    console.log('Program details seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Program details seed failed:', error);
    process.exit(1);
  });
