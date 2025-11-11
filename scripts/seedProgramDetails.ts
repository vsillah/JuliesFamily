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

// Program detail data based on JFLP Student Classes document
const PROGRAM_DETAILS = [
  {
    id: 'adult-basic-education',
    title: 'Adult Basic Education (ABE)/Career Services',
    description: 'Academic classes for adults 16+ seeking high school credentials with up to 10 hours/week commitment',
    imageName: 'service-adult',
    overview: "The Adult Basic Education (ABE)/Career Services strand partners with learners to advance and accelerate their academic achievement to the level required for success in postsecondary education/training or employment. One key goal is to provide opportunities for participants to secure their HiSET diploma. Many students are already employed and need their HiSET diploma to advance within their current organization or to qualify for additional career opportunities. Once this important milestone is achieved, staff work with graduates to chart a transition plan to higher education, job training, union apprenticeships and/or employment.",
    ageRange: '16+ years',
    schedule: 'Mornings & evenings (up to 10 hours/week, 2 hours/day)',
    location: 'In-person & online',
    cost: 'Free',
    features: [
      'Four levels of instruction offered mornings and evenings',
      'In-person and online classes to accommodate work schedules',
      'High school equivalency prep (HiSET diploma)',
      'Digital literacy classes',
      'Individual tutoring',
      'Career services and counseling',
      'Support services to help with various needs',
      'Flexible scheduling for working adults',
      'Transition planning to higher education or employment',
      'Union apprenticeship connections'
    ],
    enrollmentSteps: [
      'Fill out the registration form at juliesfamily.org',
      'Complete initial assessment to determine your skill level',
      'Meet with education coordinator to create your personalized plan',
      'Begin classes with flexible morning or evening options'
    ],
    faqs: [
      {
        question: 'How much time do I need to commit?',
        answer: 'The program requires up to 10 hours per week (about 2 hours per day). We offer flexible scheduling with both morning and evening classes to accommodate work schedules and other commitments.'
      },
      {
        question: 'Can I take classes online?',
        answer: 'Yes! We offer both in-person and online classes so you can choose the format that works best for your situation.'
      },
      {
        question: 'What happens after I get my HiSET diploma?',
        answer: 'Our staff will work with you to chart a transition plan to higher education, job training programs, union apprenticeships, or direct employment based on your goals.'
      },
      {
        question: 'I already have a job. Can this program still help me?',
        answer: 'Absolutely! Many of our ABE students are already employed and need their HiSET diploma to advance within their current organization or qualify for new career opportunities. We offer evening classes specifically for working adults.'
      }
    ],
    defaultPersona: 'student' as const
  },
  {
    id: 'family-development',
    title: 'Family Development Services',
    description: 'Multigenerational learning for mothers and their young children combining parent education with licensed early childhood programs',
    imageName: 'cdc-UqTrGSohyCs-unsplash',
    overview: "Julie's Family Development Services strand offers learning opportunities to mothers and their young children by employing a unique multigenerational approach to family development. All adult participants are mothers who are determined to be both effective parents and their child's first and best teacher. The program offers each mother an intensive, integrated curriculum that emphasizes both life management and academic skills needed for future success, while engaging her infant, toddler, and pre-school children in a high-quality, fully licensed, early childhood development program.",
    ageRange: 'Mothers with children (infants, toddlers, pre-school)',
    schedule: 'Compatible schedules for mothers with preschool and school-aged children',
    location: 'On-site',
    cost: 'Free',
    features: [
      'Unique multigenerational approach to family development',
      'Family literacy activities on-site for parent and child together',
      'High-quality, fully licensed early childhood development program',
      'Parenting, Health, Home Management classes',
      'Financial Literacy classes',
      'Reading, Writing, Math, Science, and Social Studies classes',
      'Topics shaped by learner input',
      'Advocacy and support services for housing, health, employment, education, and legal needs',
      'Compatible class schedules for mothers with children',
      'Focus on mothers as their child\'s first and best teacher'
    ],
    enrollmentSteps: [
      'Fill out the registration form online',
      'Schedule an initial meeting to discuss program fit and your goals',
      'Complete enrollment for both adult and early childhood programs',
      'Begin classes with integrated support for you and your child'
    ],
    faqs: [
      {
        question: 'Who is this program for?',
        answer: 'This program is specifically designed for mothers with young children (infants, toddlers, and preschoolers) who want to advance their own education while ensuring their children receive high-quality early education.'
      },
      {
        question: 'What makes this program unique?',
        answer: 'Our multigenerational approach means both mother and child learn together. While you\'re in adult education classes, your child receives quality early childhood education, and you participate in family literacy activities together that foster a mutual love of learning.'
      },
      {
        question: 'What kind of support services are available?',
        answer: 'We provide advocacy and support when housing, health, employment, education, and legal emergencies or crises arise. We\'re here to support your whole family, not just academic needs.'
      },
      {
        question: 'What will I learn in the classes?',
        answer: 'You\'ll take core academic classes (Reading, Writing, Math, Science, Social Studies) as well as life skills classes in Parenting, Health, Home Management, and Financial Literacy. Topics are shaped by learner input to meet your specific needs.'
      }
    ],
    defaultPersona: 'parent' as const
  },
  {
    id: 'tech-goes-home',
    title: 'Tech Goes Home',
    description: 'FREE 15-hour digital literacy program with brand new Chromebook and 1 year of internet access',
    imageName: 'sebastian-leon-prado-dBiIcdxMWfE-unsplash',
    overview: "Tech Goes Home strives to ensure that all residents of Greater Boston are equipped with the tools, training, and access to support 21st century skill development. This FREE program delivers at least 15 hours of face-to-face or Zoom courses focused on fundamental digital skills. Upon completion, participants receive a brand new Chromebook and 1 year of FREE internet service.",
    ageRange: 'All ages',
    schedule: 'At least 15 hours (in-person or Zoom)',
    location: 'Julie\'s Family Learning Program',
    cost: 'FREE (includes Chromebook + internet)',
    features: [
      'At least 15 hours of in-person or Zoom classes',
      'Curriculum designed to access powerful online resources',
      'FREE brand new Chromebook laptop upon completion',
      '1 year of FREE internet service through TGH',
      'Using popular applications and the internet as resources',
      'Effectively using technology for distance learning',
      'Accessing essential goods and services online',
      'Staying up to date with health and safety information',
      'Programs and resources for school, work, and daily life',
      'Fundamental digital skills training'
    ],
    enrollmentSteps: [
      'Talk to your teacher at Julie\'s Family Learning Program',
      'Call the main office at (617) 269-6663',
      'Email speckham@juliesfamily.org to express interest',
      'Complete enrollment and begin your 15-hour course'
    ],
    faqs: [
      {
        question: 'Is this program really free?',
        answer: 'Yes! Tech Goes Home is completely FREE. Upon completion of at least 15 hours of classes, you receive a brand new Chromebook laptop and 1 year of FREE internet service at no cost to you.'
      },
      {
        question: 'What will I learn?',
        answer: 'You\'ll learn fundamental digital skills including how to use popular applications, access online resources for school and work, use technology for distance learning, access essential services online, and stay up to date with important health and safety information.'
      },
      {
        question: 'Can I take classes online?',
        answer: 'Yes! Classes are offered both in-person and via Zoom to accommodate your schedule and preferences.'
      },
      {
        question: 'How do I sign up?',
        answer: 'You can talk to your teacher at Julie\'s Family Learning Program, call our main office at (617) 269-6663, or email speckham@juliesfamily.org to get started.'
      },
      {
        question: 'What are the requirements?',
        answer: 'You need to complete at least 15 hours of face-to-face or Zoom courses. Classes are held at Julie\'s Family Learning Program and focus on building your digital literacy skills.'
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
