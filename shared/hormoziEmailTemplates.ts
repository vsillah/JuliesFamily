import type { Persona, FunnelStage } from './defaults/personas';

export const OUTREACH_TYPES = [
  'warm_outreach',
  'cold_outreach',
  'warm_broadcast',
  'cold_broadcast'
] as const;
export type OutreachType = typeof OUTREACH_TYPES[number];

export const TEMPLATE_CATEGORIES = [
  'a_c_a',
  'value_first',
  'social_proof',
  'problem_solution',
  'lead_magnet_offer',
  'reengagement',
  'follow_up',
  'referral_request'
] as const;
export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];

export const OUTREACH_TYPE_LABELS: Record<OutreachType, string> = {
  warm_outreach: 'Warm Outreach (1-to-1)',
  cold_outreach: 'Cold Outreach (1-to-1)',
  warm_broadcast: 'Warm Broadcast (1-to-many)',
  cold_broadcast: 'Cold Broadcast (1-to-many)'
};

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  a_c_a: 'A-C-A Framework (Acknowledge-Compliment-Ask)',
  value_first: 'Value First',
  social_proof: 'Social Proof',
  problem_solution: 'Problem-Solution',
  lead_magnet_offer: 'Lead Magnet Offer',
  reengagement: 'Re-engagement',
  follow_up: 'Follow-up',
  referral_request: 'Referral Request'
};

export interface HormoziEmailTemplate {
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  outreachType: OutreachType;
  templateCategory: TemplateCategory;
  persona: Persona | null;
  funnelStage: FunnelStage | null;
  description: string;
  exampleContext: string;
  variables: string[];
}

export const HORMOZI_EMAIL_TEMPLATES: HormoziEmailTemplate[] = [
  {
    name: 'warm_aca_parent_awareness',
    subject: '{firstName}, loved seeing your recent {achievement}!',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>I saw that {achievement} - that\'s wonderful!</p>\n\n<p>I really admire how dedicated you are to {dedication}. It\'s clear you care deeply about {childName}\'s future.</p>\n\n<p>Quick question: Have you explored early learning programs that could help {childName} develop {specificSkill} before kindergarten? We\'ve helped hundreds of families like yours give their children a strong foundation.</p>\n\n<p>Would a free consultation be helpful?</p>\n\n<p>Warmly,<br>Julie</p>',
    textBody: 'Hi {firstName},\n\nI saw that {achievement} - that\'s wonderful!\n\nI really admire how dedicated you are to {dedication}. It\'s clear you care deeply about {childName}\'s future.\n\nQuick question: Have you explored early learning programs that could help {childName} develop {specificSkill} before kindergarten? We\'ve helped hundreds of families like yours give their children a strong foundation.\n\nWould a free consultation be helpful?\n\nWarmly,\nJulie',
    outreachType: 'warm_outreach',
    templateCategory: 'a_c_a',
    persona: 'parent',
    funnelStage: 'awareness',
    description: 'Reconnect with parents you know who have young children, using A-C-A framework',
    exampleContext: 'Parent shared on social media about their child\'s first day of preschool',
    variables: ['firstName', 'achievement', 'dedication', 'childName', 'specificSkill']
  },
  {
    name: 'cold_value_first_parent_awareness',
    subject: 'Free early learning assessment for {childName}',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>I\'m Julie, and I help families in {cityName} prepare their children for academic success.</p>\n\n<p>I\'m offering <strong>free 20-minute learning assessments</strong> this month for children ages 3-5. No strings attached - just valuable insights into {childName}\'s development and personalized recommendations.</p>\n\n<p>We recently helped {similarFamily} discover that their daughter was ready for advanced reading activities. Within 3 months, she was reading at a first-grade level.</p>\n\n<p>Would Thursday or Friday work better for you?</p>\n\n<p>Best,<br>Julie</p>\n\n<p><em>P.S. - The assessment includes a take-home activity guide you can use right away.</em></p>',
    textBody: 'Hi {firstName},\n\nI\'m Julie, and I help families in {cityName} prepare their children for academic success.\n\nI\'m offering free 20-minute learning assessments this month for children ages 3-5. No strings attached - just valuable insights into {childName}\'s development and personalized recommendations.\n\nWe recently helped {similarFamily} discover that their daughter was ready for advanced reading activities. Within 3 months, she was reading at a first-grade level.\n\nWould Thursday or Friday work better for you?\n\nBest,\nJulie\n\nP.S. - The assessment includes a take-home activity guide you can use right away.',
    outreachType: 'cold_outreach',
    templateCategory: 'value_first',
    persona: 'parent',
    funnelStage: 'awareness',
    description: 'Cold outreach offering immediate value with free assessment',
    exampleContext: 'Parent on local community group looking for preschool recommendations',
    variables: ['firstName', 'childName', 'cityName', 'similarFamily']
  },
  {
    name: 'warm_social_proof_student_consideration',
    subject: '{firstName}, thought of you when I saw {mutualConnection}\'s success',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>I hope your English learning journey is going well!</p>\n\n<p>I wanted to share something exciting - {mutualConnection} just achieved {achievement}. She was in a similar position to you {timeframe} ago, and her dedication really paid off.</p>\n\n<p>She credits our {programName} for helping her build confidence and fluency. The interactive classes and personalized feedback made all the difference.</p>\n\n<p>Would you like to chat about how the program could accelerate your progress? I\'d be happy to show you what worked for her.</p>\n\n<p>Best regards,<br>Maria</p>',
    textBody: 'Hi {firstName},\n\nI hope your English learning journey is going well!\n\nI wanted to share something exciting - {mutualConnection} just achieved {achievement}. She was in a similar position to you {timeframe} ago, and her dedication really paid off.\n\nShe credits our {programName} for helping her build confidence and fluency. The interactive classes and personalized feedback made all the difference.\n\nWould you like to chat about how the program could accelerate your progress? I\'d be happy to show you what worked for her.\n\nBest regards,\nMaria',
    outreachType: 'warm_outreach',
    templateCategory: 'social_proof',
    persona: 'student',
    funnelStage: 'consideration',
    description: 'Leverage social proof from mutual connections to encourage enrollment',
    exampleContext: 'Student has shown interest but hasn\'t enrolled yet',
    variables: ['firstName', 'mutualConnection', 'achievement', 'timeframe', 'programName']
  },
  {
    name: 'cold_problem_solution_provider_awareness',
    subject: 'Struggling to find qualified ESL instructors in {cityName}?',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>I noticed your organization provides {serviceType} services. Finding qualified ESL instructors can be challenging, especially ones who understand adult learning principles.</p>\n\n<p>We\'ve helped organizations like {similarOrg} build reliable instructor pools through our training and certification program. Their instructor quality scores increased by {metricImprovement} in the first quarter.</p>\n\n<p>We offer:</p>\n<ul>\n<li>Certified ESL instructor training</li>\n<li>Ongoing professional development</li>\n<li>Quality assurance support</li>\n</ul>\n\n<p>Would a brief call make sense to explore how we might support your mission?</p>\n\n<p>Regards,<br>Carlos</p>',
    textBody: 'Hi {firstName},\n\nI noticed your organization provides {serviceType} services. Finding qualified ESL instructors can be challenging, especially ones who understand adult learning principles.\n\nWe\'ve helped organizations like {similarOrg} build reliable instructor pools through our training and certification program. Their instructor quality scores increased by {metricImprovement} in the first quarter.\n\nWe offer:\n- Certified ESL instructor training\n- Ongoing professional development\n- Quality assurance support\n\nWould a brief call make sense to explore how we might support your mission?\n\nRegards,\nCarlos',
    outreachType: 'cold_outreach',
    templateCategory: 'problem_solution',
    persona: 'provider',
    funnelStage: 'awareness',
    description: 'Identify a specific problem and offer a proven solution',
    exampleContext: 'Service provider listed on directory but haven\'t engaged',
    variables: ['firstName', 'cityName', 'serviceType', 'similarOrg', 'metricImprovement']
  },
  {
    name: 'warm_broadcast_donor_retention',
    subject: 'Your impact this year: {impactMetric} lives changed',
    htmlBody: '<p>Dear {firstName},</p>\n\n<p>As 2024 comes to a close, I wanted to share how your generosity has transformed our community.</p>\n\n<p>Thanks to supporters like you:</p>\n<ul>\n<li>{metric1}: {value1}</li>\n<li>{metric2}: {value2}</li>\n<li>{metric3}: {value3}</li>\n</ul>\n\n<p>Your {previousDonation} donation in {monthYear} directly funded {specificImpact}. We couldn\'t do this without you.</p>\n\n<p>If you\'re able to support us again, even {suggestedAmount} would mean {currentNeed}.</p>\n\n<p><a href="{donationLink}">Make a year-end gift</a></p>\n\n<p>With gratitude,<br>The Literacy Center Team</p>',
    textBody: 'Dear {firstName},\n\nAs 2024 comes to a close, I wanted to share how your generosity has transformed our community.\n\nThanks to supporters like you:\n- {metric1}: {value1}\n- {metric2}: {value2}\n- {metric3}: {value3}\n\nYour {previousDonation} donation in {monthYear} directly funded {specificImpact}. We couldn\'t do this without you.\n\nIf you\'re able to support us again, even {suggestedAmount} would mean {currentNeed}.\n\nMake a year-end gift: {donationLink}\n\nWith gratitude,\nThe Literacy Center Team',
    outreachType: 'warm_broadcast',
    templateCategory: 'social_proof',
    persona: 'donor',
    funnelStage: 'retention',
    description: 'Year-end appeal to previous donors with personalized impact metrics',
    exampleContext: 'Previous donor, last gave 6-12 months ago',
    variables: ['firstName', 'impactMetric', 'metric1', 'value1', 'metric2', 'value2', 'metric3', 'value3', 'previousDonation', 'monthYear', 'specificImpact', 'suggestedAmount', 'currentNeed', 'donationLink']
  },
  {
    name: 'cold_broadcast_volunteer_awareness',
    subject: 'Change a life in just 2 hours per week',
    htmlBody: '<p>Hi there,</p>\n\n<p>What if you could help someone achieve their dream with just 2 hours a week?</p>\n\n<p>Our literacy tutors make that impact every day. People like {volunteerName} spend Tuesday evenings helping adults learn to read, and the transformations are incredible.</p>\n\n<p>Last month, one of our students {successStory}. Her tutor said it was the most rewarding experience of her life.</p>\n\n<p>We\'re looking for {numberOfVolunteers} new tutors this quarter. No teaching experience required - we provide full training and support.</p>\n\n<p>Next orientation: {orientationDate} at {orientationTime}</p>\n\n<p><a href="{signupLink}">Reserve your spot</a></p>\n\n<p>Looking forward to welcoming you,<br>Sarah</p>',
    textBody: 'Hi there,\n\nWhat if you could help someone achieve their dream with just 2 hours a week?\n\nOur literacy tutors make that impact every day. People like {volunteerName} spend Tuesday evenings helping adults learn to read, and the transformations are incredible.\n\nLast month, one of our students {successStory}. Her tutor said it was the most rewarding experience of her life.\n\nWe\'re looking for {numberOfVolunteers} new tutors this quarter. No teaching experience required - we provide full training and support.\n\nNext orientation: {orientationDate} at {orientationTime}\n\nReserve your spot: {signupLink}\n\nLooking forward to welcoming you,\nSarah',
    outreachType: 'cold_broadcast',
    templateCategory: 'value_first',
    persona: 'volunteer',
    funnelStage: 'awareness',
    description: 'Cold broadcast recruiting volunteers with emotional appeal and low barrier',
    exampleContext: 'Community members who haven\'t engaged before',
    variables: ['volunteerName', 'successStory', 'numberOfVolunteers', 'orientationDate', 'orientationTime', 'signupLink']
  },
  {
    name: 'warm_lead_magnet_student_awareness',
    subject: 'Free English fluency assessment + personalized learning plan',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>Thanks for your interest in improving your English!</p>\n\n<p>I\'d love to offer you a complimentary fluency assessment (20 minutes) where we\'ll:</p>\n<ul>\n<li>Identify your current level across speaking, listening, reading, writing</li>\n<li>Understand your specific goals ({goal})</li>\n<li>Create a personalized 90-day learning plan</li>\n</ul>\n\n<p>You\'ll leave with actionable next steps, whether you join our program or not.</p>\n\n<p>Recent students who took this assessment:</p>\n<ul>\n<li>{testimonial1}</li>\n<li>{testimonial2}</li>\n</ul>\n\n<p>Available slots this week: {availableTimes}</p>\n\n<p><a href="{bookingLink}">Schedule your free assessment</a></p>\n\n<p>Best,<br>Maria</p>',
    textBody: 'Hi {firstName},\n\nThanks for your interest in improving your English!\n\nI\'d love to offer you a complimentary fluency assessment (20 minutes) where we\'ll:\n- Identify your current level across speaking, listening, reading, writing\n- Understand your specific goals ({goal})\n- Create a personalized 90-day learning plan\n\nYou\'ll leave with actionable next steps, whether you join our program or not.\n\nRecent students who took this assessment:\n- {testimonial1}\n- {testimonial2}\n\nAvailable slots this week: {availableTimes}\n\nSchedule your free assessment: {bookingLink}\n\nBest,\nMaria',
    outreachType: 'warm_outreach',
    templateCategory: 'lead_magnet_offer',
    persona: 'student',
    funnelStage: 'awareness',
    description: 'Offer valuable free assessment to move prospect toward enrollment',
    exampleContext: 'Prospect filled out inquiry form but hasn\'t booked consultation',
    variables: ['firstName', 'goal', 'testimonial1', 'testimonial2', 'availableTimes', 'bookingLink']
  },
  {
    name: 'warm_reengagement_parent_decision',
    subject: '{firstName}, checking in on {childName}\'s learning journey',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>I hope you\'re doing well! I wanted to follow up on our conversation from {conversationDate} about early childhood education for {childName}.</p>\n\n<p>I know deciding on the right program is a big decision. A few things that might help:</p>\n\n<p><strong>We just updated our schedule</strong> to include {newOffering}. Several families mentioned wanting this option.</p>\n\n<p><strong>New opening:</strong> We have {availableSpots} spots in our {programName} starting {startDate}.</p>\n\n<p>Is there anything specific I can clarify? Happy to answer questions or schedule a visit for {childName} to try a sample class.</p>\n\n<p>No pressure - just want to make sure you have what you need to decide.</p>\n\n<p>Warmly,<br>Julie</p>',
    textBody: 'Hi {firstName},\n\nI hope you\'re doing well! I wanted to follow up on our conversation from {conversationDate} about early childhood education for {childName}.\n\nI know deciding on the right program is a big decision. A few things that might help:\n\nWe just updated our schedule to include {newOffering}. Several families mentioned wanting this option.\n\nNew opening: We have {availableSpots} spots in our {programName} starting {startDate}.\n\nIs there anything specific I can clarify? Happy to answer questions or schedule a visit for {childName} to try a sample class.\n\nNo pressure - just want to make sure you have what you need to decide.\n\nWarmly,\nJulie',
    outreachType: 'warm_outreach',
    templateCategory: 'reengagement',
    persona: 'parent',
    funnelStage: 'decision',
    description: 'Re-engage parents who went cold after initial consultation',
    exampleContext: 'Parent consulted 2-4 weeks ago but didn\'t enroll',
    variables: ['firstName', 'childName', 'conversationDate', 'newOffering', 'availableSpots', 'programName', 'startDate']
  },
  {
    name: 'warm_follow_up_provider_decision',
    subject: 'Following up: Partnership opportunity for {organizationName}',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>I enjoyed our call on {callDate} about how we might support {organizationName}\'s mission.</p>\n\n<p>As promised, here\'s a summary of what we discussed:</p>\n<ul>\n<li>{point1}</li>\n<li>{point2}</li>\n<li>{point3}</li>\n</ul>\n\n<p>Based on your interest in {specificInterest}, I\'ve attached {resourceName} that shows how we helped {similarOrganization} achieve {result}.</p>\n\n<p>Next steps we discussed:</p>\n<ol>\n<li>{nextStep1}</li>\n<li>{nextStep2}</li>\n</ol>\n\n<p>I\'ll follow up next {followUpDay} unless I hear from you sooner. Feel free to call me directly at {phoneNumber} if questions come up.</p>\n\n<p>Best regards,<br>Carlos</p>',
    textBody: 'Hi {firstName},\n\nI enjoyed our call on {callDate} about how we might support {organizationName}\'s mission.\n\nAs promised, here\'s a summary of what we discussed:\n- {point1}\n- {point2}\n- {point3}\n\nBased on your interest in {specificInterest}, I\'ve attached {resourceName} that shows how we helped {similarOrganization} achieve {result}.\n\nNext steps we discussed:\n1. {nextStep1}\n2. {nextStep2}\n\nI\'ll follow up next {followUpDay} unless I hear from you sooner. Feel free to call me directly at {phoneNumber} if questions come up.\n\nBest regards,\nCarlos',
    outreachType: 'warm_outreach',
    templateCategory: 'follow_up',
    persona: 'provider',
    funnelStage: 'decision',
    description: 'Professional follow-up after consultation with clear next steps',
    exampleContext: 'Had consultation call, provider is considering partnership',
    variables: ['firstName', 'organizationName', 'callDate', 'point1', 'point2', 'point3', 'specificInterest', 'resourceName', 'similarOrganization', 'result', 'nextStep1', 'nextStep2', 'followUpDay', 'phoneNumber']
  },
  {
    name: 'warm_referral_request_student_retention',
    subject: '{firstName}, would you help another student like you did?',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>I\'ve loved watching your progress over the past {timeInProgram}! Your {specificAchievement} was particularly impressive.</p>\n\n<p>I have a favor to ask: Do you know anyone who might benefit from our program the way you have?</p>\n\n<p>Many of our best students came through referrals from people like you who understand the value firsthand. If you refer someone who enrolls, we\'d like to thank you with {referralIncentive}.</p>\n\n<p>More importantly, you\'d be giving someone the same opportunity that\'s helped you {studentBenefit}.</p>\n\n<p>Anyone come to mind? You can simply reply with their name and email, or have them mention your name when they reach out.</p>\n\n<p>Thanks for being such a valued member of our community!</p>\n\n<p>Best,<br>Maria</p>',
    textBody: 'Hi {firstName},\n\nI\'ve loved watching your progress over the past {timeInProgram}! Your {specificAchievement} was particularly impressive.\n\nI have a favor to ask: Do you know anyone who might benefit from our program the way you have?\n\nMany of our best students came through referrals from people like you who understand the value firsthand. If you refer someone who enrolls, we\'d like to thank you with {referralIncentive}.\n\nMore importantly, you\'d be giving someone the same opportunity that\'s helped you {studentBenefit}.\n\nAnyone come to mind? You can simply reply with their name and email, or have them mention your name when they reach out.\n\nThanks for being such a valued member of our community!\n\nBest,\nMaria',
    outreachType: 'warm_outreach',
    templateCategory: 'referral_request',
    persona: 'student',
    funnelStage: 'retention',
    description: 'Request referrals from satisfied students with incentive',
    exampleContext: 'Student has been enrolled 3+ months with good progress',
    variables: ['firstName', 'timeInProgram', 'specificAchievement', 'referralIncentive', 'studentBenefit']
  },
  {
    name: 'cold_aca_donor_awareness',
    subject: 'Your {connection} to literacy in {cityName}',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>I noticed you {observedConnection} - that\'s wonderful!</p>\n\n<p>I really admire professionals like you who {compliment}. It shows you understand the power of {value}.</p>\n\n<p>Quick question: Have you considered supporting adult literacy programs in {cityName}? We help {impact} every year, and supporters like you make it possible.</p>\n\n<p>Would you be open to a brief conversation about how you might amplify your impact?</p>\n\n<p>Respectfully,<br>The Literacy Center Team</p>',
    textBody: 'Hi {firstName},\n\nI noticed you {observedConnection} - that\'s wonderful!\n\nI really admire professionals like you who {compliment}. It shows you understand the power of {value}.\n\nQuick question: Have you considered supporting adult literacy programs in {cityName}? We help {impact} every year, and supporters like you make it possible.\n\nWould you be open to a brief conversation about how you might amplify your impact?\n\nRespectfully,\nThe Literacy Center Team',
    outreachType: 'cold_outreach',
    templateCategory: 'a_c_a',
    persona: 'donor',
    funnelStage: 'awareness',
    description: 'Cold outreach to potential donor using A-C-A framework',
    exampleContext: 'Professional who has demonstrated interest in education/community',
    variables: ['firstName', 'connection', 'cityName', 'observedConnection', 'compliment', 'value', 'impact']
  },
  {
    name: 'warm_broadcast_parent_retention',
    subject: 'Fall enrollment: Priority access for {childName}',
    htmlBody: '<p>Dear {firstName},</p>\n\n<p>As a valued member of our {programName} family, I wanted to give you first notice about fall enrollment.</p>\n\n<p>We\'re expanding to offer {newProgram}, based on feedback from parents like you. {childName} would be a great fit given {childStrength}.</p>\n\n<p><strong>Current families get:</strong></p>\n<ul>\n<li>Priority enrollment (72 hours before public)</li>\n<li>{discount} discount on fall tuition</li>\n<li>Free transition assessment</li>\n</ul>\n\n<p>We have {availableSpots} spots reserved for current families. After {deadline}, spots open to the general public.</p>\n\n<p><a href="{enrollLink}">Secure {childName}\'s spot</a></p>\n\n<p>Questions? Call me directly at {phoneNumber}.</p>\n\n<p>Warmly,<br>Julie</p>',
    textBody: 'Dear {firstName},\n\nAs a valued member of our {programName} family, I wanted to give you first notice about fall enrollment.\n\nWe\'re expanding to offer {newProgram}, based on feedback from parents like you. {childName} would be a great fit given {childStrength}.\n\nCurrent families get:\n- Priority enrollment (72 hours before public)\n- {discount} discount on fall tuition\n- Free transition assessment\n\nWe have {availableSpots} spots reserved for current families. After {deadline}, spots open to the general public.\n\nSecure {childName}\'s spot: {enrollLink}\n\nQuestions? Call me directly at {phoneNumber}.\n\nWarmly,\nJulie',
    outreachType: 'warm_broadcast',
    templateCategory: 'lead_magnet_offer',
    persona: 'parent',
    funnelStage: 'retention',
    description: 'Seasonal enrollment broadcast for current families with exclusive benefits',
    exampleContext: 'Current parent whose child is enrolled',
    variables: ['firstName', 'childName', 'programName', 'newProgram', 'childStrength', 'discount', 'availableSpots', 'deadline', 'enrollLink', 'phoneNumber']
  },
  {
    name: 'cold_problem_solution_student_consideration',
    subject: 'Still struggling with {specificProblem}?',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>I noticed you {observedAction} about {specificProblem}. This is one of the most common challenges for {persona}.</p>\n\n<p>The frustrating part? Most traditional approaches don\'t work because {reasonTraditionalFails}.</p>\n\n<p>We\'ve helped {numberStudents} students overcome this exact issue using {methodology}. Most see improvement in {timeframe}.</p>\n\n<p>Our approach works because:</p>\n<ul>\n<li>{benefit1}</li>\n<li>{benefit2}</li>\n<li>{benefit3}</li>\n</ul>\n\n<p>I\'d be happy to share a free resource that addresses {specificProblem}. No strings attached - just genuinely helpful content.</p>\n\n<p><a href="{resourceLink}">Download the free guide</a></p>\n\n<p>Best,<br>Maria</p>',
    textBody: 'Hi {firstName},\n\nI noticed you {observedAction} about {specificProblem}. This is one of the most common challenges for {persona}.\n\nThe frustrating part? Most traditional approaches don\'t work because {reasonTraditionalFails}.\n\nWe\'ve helped {numberStudents} students overcome this exact issue using {methodology}. Most see improvement in {timeframe}.\n\nOur approach works because:\n- {benefit1}\n- {benefit2}\n- {benefit3}\n\nI\'d be happy to share a free resource that addresses {specificProblem}. No strings attached - just genuinely helpful content.\n\nDownload the free guide: {resourceLink}\n\nBest,\nMaria',
    outreachType: 'cold_outreach',
    templateCategory: 'problem_solution',
    persona: 'student',
    funnelStage: 'consideration',
    description: 'Address specific pain point with proven solution and free resource',
    exampleContext: 'Prospect expressed frustration with learning challenge online',
    variables: ['firstName', 'specificProblem', 'observedAction', 'persona', 'reasonTraditionalFails', 'numberStudents', 'methodology', 'timeframe', 'benefit1', 'benefit2', 'benefit3', 'resourceLink']
  },
  {
    name: 'warm_social_proof_volunteer_consideration',
    subject: '{firstName}, meet {volunteerName} - she\'s transforming lives like you could',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>Thanks for your interest in volunteering! I thought you might like to hear from someone who recently started.</p>\n\n<p>Meet {volunteerName}, a {volunteerBackground} who started tutoring {timeAgo}:</p>\n\n<blockquote>\n<p>"{testimonialQuote}"</p>\n<p>- {volunteerName}</p>\n</blockquote>\n\n<p>{volunteerName} works with {studentName}, who {studentProgress}. She spends just {hoursPerWeek} hours per week but says it\'s the highlight of her week.</p>\n\n<p>The impact goes both ways:</p>\n<ul>\n<li><strong>For students:</strong> {studentImpact}</li>\n<li><strong>For tutors:</strong> {tutorImpact}</li>\n</ul>\n\n<p>Our next orientation is {orientationDate}. Would you like to join?</p>\n\n<p><a href="{signupLink}">Reserve your spot</a></p>\n\n<p>Looking forward to welcoming you,<br>Sarah</p>',
    textBody: 'Hi {firstName},\n\nThanks for your interest in volunteering! I thought you might like to hear from someone who recently started.\n\nMeet {volunteerName}, a {volunteerBackground} who started tutoring {timeAgo}:\n\n"{testimonialQuote}"\n- {volunteerName}\n\n{volunteerName} works with {studentName}, who {studentProgress}. She spends just {hoursPerWeek} hours per week but says it\'s the highlight of her week.\n\nThe impact goes both ways:\n- For students: {studentImpact}\n- For tutors: {tutorImpact}\n\nOur next orientation is {orientationDate}. Would you like to join?\n\nReserve your spot: {signupLink}\n\nLooking forward to welcoming you,\nSarah',
    outreachType: 'warm_outreach',
    templateCategory: 'social_proof',
    persona: 'volunteer',
    funnelStage: 'consideration',
    description: 'Share relatable volunteer story to overcome hesitation',
    exampleContext: 'Prospect expressed interest but hasn\'t committed to orientation',
    variables: ['firstName', 'volunteerName', 'volunteerBackground', 'timeAgo', 'testimonialQuote', 'studentName', 'studentProgress', 'hoursPerWeek', 'studentImpact', 'tutorImpact', 'orientationDate', 'signupLink']
  },
  {
    name: 'cold_broadcast_parent_awareness',
    subject: 'Is {childName} ready for kindergarten? Free readiness checklist',
    htmlBody: '<p>Dear Parent,</p>\n\n<p>Kindergarten registration is just {timeUntilKindergarten} away. Is your child ready?</p>\n\n<p>We\'ve created a free <strong>Kindergarten Readiness Checklist</strong> based on {localSchoolDistrict} requirements and early childhood development research.</p>\n\n<p>Download it to assess your child\'s:</p>\n<ul>\n<li>Social-emotional development</li>\n<li>Early literacy skills</li>\n<li>Fine motor readiness</li>\n<li>Self-care abilities</li>\n</ul>\n\n<p><a href="{checklistLink}">Get your free checklist</a></p>\n\n<p>Plus, find out how our {programName} helps children build confidence and skills before kindergarten. Last year, {statistic}.</p>\n\n<p>Limited spots available for fall enrollment. <a href="{infoLink}">Learn more</a></p>\n\n<p>Warmly,<br>The Early Learning Team</p>',
    textBody: 'Dear Parent,\n\nKindergarten registration is just {timeUntilKindergarten} away. Is your child ready?\n\nWe\'ve created a free Kindergarten Readiness Checklist based on {localSchoolDistrict} requirements and early childhood development research.\n\nDownload it to assess your child\'s:\n- Social-emotional development\n- Early literacy skills\n- Fine motor readiness\n- Self-care abilities\n\nGet your free checklist: {checklistLink}\n\nPlus, find out how our {programName} helps children build confidence and skills before kindergarten. Last year, {statistic}.\n\nLimited spots available for fall enrollment. Learn more: {infoLink}\n\nWarmly,\nThe Early Learning Team',
    outreachType: 'cold_broadcast',
    templateCategory: 'lead_magnet_offer',
    persona: 'parent',
    funnelStage: 'awareness',
    description: 'Seasonal broadcast with valuable free resource to build email list',
    exampleContext: 'Community email blast to parents of 3-5 year olds',
    variables: ['childName', 'timeUntilKindergarten', 'localSchoolDistrict', 'checklistLink', 'programName', 'statistic', 'infoLink']
  },
  {
    name: 'warm_reengagement_donor_retention',
    subject: '{firstName}, we miss you',
    htmlBody: '<p>Dear {firstName},</p>\n\n<p>Your {previousDonationAmount} gift in {donationDate} helped us {specificImpact}. Thank you!</p>\n\n<p>I noticed we haven\'t heard from you in a while, and I wanted to check in. Is there anything we could do better?</p>\n\n<p>Since your last donation:</p>\n<ul>\n<li>{update1}</li>\n<li>{update2}</li>\n<li>{update3}</li>\n</ul>\n\n<p>We\'re still working toward the mission you supported: {mission}. But we\'ve evolved based on what we\'ve learned.</p>\n\n<p>I\'d love to hear your thoughts. Would a quick call make sense? Or if you\'d prefer, I can send our latest impact report.</p>\n\n<p>Either way, I want you to know how much your past support meant to families like {beneficiaryStory}.</p>\n\n<p>With gratitude,<br>Development Team</p>',
    textBody: 'Dear {firstName},\n\nYour {previousDonationAmount} gift in {donationDate} helped us {specificImpact}. Thank you!\n\nI noticed we haven\'t heard from you in a while, and I wanted to check in. Is there anything we could do better?\n\nSince your last donation:\n- {update1}\n- {update2}\n- {update3}\n\nWe\'re still working toward the mission you supported: {mission}. But we\'ve evolved based on what we\'ve learned.\n\nI\'d love to hear your thoughts. Would a quick call make sense? Or if you\'d prefer, I can send our latest impact report.\n\nEither way, I want you to know how much your past support meant to families like {beneficiaryStory}.\n\nWith gratitude,\nDevelopment Team',
    outreachType: 'warm_outreach',
    templateCategory: 'reengagement',
    persona: 'donor',
    funnelStage: 'retention',
    description: 'Win back lapsed donors with genuine appreciation and updates',
    exampleContext: 'Donor who gave 12-24 months ago but not since',
    variables: ['firstName', 'previousDonationAmount', 'donationDate', 'specificImpact', 'update1', 'update2', 'update3', 'mission', 'beneficiaryStory']
  },
  {
    name: 'warm_follow_up_student_decision',
    subject: '{firstName}, ready to take the next step?',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>I hope you\'re doing well! I wanted to follow up on your fluency assessment from {assessmentDate}.</p>\n\n<p>Based on your goals ({goals}) and current level, I recommended our {recommendedProgram}. Since we talked, {timeElapsed}.</p>\n\n<p>Good news: We just had {numberOfOpenings} openings in the {timeSlot} classes you mentioned preferring.</p>\n\n<p>I\'ve held a spot for you through {holdDate}, but wanted to confirm your interest first.</p>\n\n<p>Here\'s what you\'d get if you enroll by {enrollDeadline}:</p>\n<ul>\n<li>{benefit1}</li>\n<li>{benefit2}</li>\n<li>{benefit3}</li>\n</ul>\n\n<p>Is there anything holding you back? I\'m happy to address any concerns or answer questions.</p>\n\n<p><a href="{enrollLink}">Enroll now</a> or <a href="{callLink}">schedule a quick call</a></p>\n\n<p>Best,<br>Maria</p>',
    textBody: 'Hi {firstName},\n\nI hope you\'re doing well! I wanted to follow up on your fluency assessment from {assessmentDate}.\n\nBased on your goals ({goals}) and current level, I recommended our {recommendedProgram}. Since we talked, {timeElapsed}.\n\nGood news: We just had {numberOfOpenings} openings in the {timeSlot} classes you mentioned preferring.\n\nI\'ve held a spot for you through {holdDate}, but wanted to confirm your interest first.\n\nHere\'s what you\'d get if you enroll by {enrollDeadline}:\n- {benefit1}\n- {benefit2}\n- {benefit3}\n\nIs there anything holding you back? I\'m happy to address any concerns or answer questions.\n\nEnroll now: {enrollLink}\nSchedule a quick call: {callLink}\n\nBest,\nMaria',
    outreachType: 'warm_outreach',
    templateCategory: 'follow_up',
    persona: 'student',
    funnelStage: 'decision',
    description: 'Follow up on assessment with urgency and enrollment incentives',
    exampleContext: 'Prospect completed assessment but didn\'t enroll',
    variables: ['firstName', 'assessmentDate', 'goals', 'recommendedProgram', 'timeElapsed', 'numberOfOpenings', 'timeSlot', 'holdDate', 'enrollDeadline', 'benefit1', 'benefit2', 'benefit3', 'enrollLink', 'callLink']
  },
  {
    name: 'warm_referral_request_parent_retention',
    subject: 'Help another family discover what you found at {programName}',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>It\'s been {timeEnrolled} since {childName} joined our program. We\'ve loved watching {childProgress}!</p>\n\n<p>Parents like you often tell us about friends who are looking for the same quality early education. If you know a family who might benefit, we\'d love an introduction.</p>\n\n<p>Why refer a friend?</p>\n<ul>\n<li><strong>For them:</strong> {benefitForReferral}</li>\n<li><strong>For you:</strong> {referralReward}</li>\n<li><strong>For both:</strong> {communityBenefit}</li>\n</ul>\n\n<p>Families you refer get priority enrollment and {referralDiscount} off their first month.</p>\n\n<p>Simply have them mention your name when they contact us, or <a href="{referralFormLink}">submit a referral online</a>.</p>\n\n<p>Thank you for being such a valued part of our {programName} family!</p>\n\n<p>Warmly,<br>Julie</p>',
    textBody: 'Hi {firstName},\n\nIt\'s been {timeEnrolled} since {childName} joined our program. We\'ve loved watching {childProgress}!\n\nParents like you often tell us about friends who are looking for the same quality early education. If you know a family who might benefit, we\'d love an introduction.\n\nWhy refer a friend?\n- For them: {benefitForReferral}\n- For you: {referralReward}\n- For both: {communityBenefit}\n\nFamilies you refer get priority enrollment and {referralDiscount} off their first month.\n\nSimply have them mention your name when they contact us, or submit a referral online: {referralFormLink}\n\nThank you for being such a valued part of our {programName} family!\n\nWarmly,\nJulie',
    outreachType: 'warm_outreach',
    templateCategory: 'referral_request',
    persona: 'parent',
    funnelStage: 'retention',
    description: 'Request referrals from happy parents with mutual benefits',
    exampleContext: 'Parent whose child has been enrolled 6+ months with positive experience',
    variables: ['firstName', 'programName', 'timeEnrolled', 'childName', 'childProgress', 'benefitForReferral', 'referralReward', 'communityBenefit', 'referralDiscount', 'referralFormLink']
  },
  {
    name: 'cold_value_first_provider_awareness',
    subject: 'Free ESL curriculum review for {organizationName}',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>I specialize in helping organizations like {organizationName} improve their ESL program outcomes.</p>\n\n<p>I\'d like to offer you a <strong>complimentary curriculum review</strong> where I\'ll:</p>\n<ul>\n<li>Audit your current ESL curriculum against best practices</li>\n<li>Identify gaps in your adult learner approach</li>\n<li>Provide specific recommendations (no purchase required)</li>\n<li>Share a custom implementation roadmap</li>\n</ul>\n\n<p>Recent organizations who took this review:</p>\n<ul>\n<li>{testimonial1}</li>\n<li>{testimonial2}</li>\n</ul>\n\n<p>This normally costs {normalCost}, but I\'m offering it free to {numberOrganizations} organizations this quarter as part of our community give-back.</p>\n\n<p>Interested? <a href="{bookingLink}">Schedule your review</a></p>\n\n<p>Best regards,<br>Carlos</p>',
    textBody: 'Hi {firstName},\n\nI specialize in helping organizations like {organizationName} improve their ESL program outcomes.\n\nI\'d like to offer you a complimentary curriculum review where I\'ll:\n- Audit your current ESL curriculum against best practices\n- Identify gaps in your adult learner approach\n- Provide specific recommendations (no purchase required)\n- Share a custom implementation roadmap\n\nRecent organizations who took this review:\n- {testimonial1}\n- {testimonial2}\n\nThis normally costs {normalCost}, but I\'m offering it free to {numberOrganizations} organizations this quarter as part of our community give-back.\n\nInterested? Schedule your review: {bookingLink}\n\nBest regards,\nCarlos',
    outreachType: 'cold_outreach',
    templateCategory: 'value_first',
    persona: 'provider',
    funnelStage: 'awareness',
    description: 'Offer high-value free service to generate qualified leads',
    exampleContext: 'Organization provides ESL services but you haven\'t engaged before',
    variables: ['firstName', 'organizationName', 'testimonial1', 'testimonial2', 'normalCost', 'numberOrganizations', 'bookingLink']
  },
  {
    name: 'warm_broadcast_student_retention',
    subject: 'Exclusive: Advanced conversation class starting {startDate}',
    htmlBody: '<p>Hi {firstName},</p>\n\n<p>Based on your progress in {currentClass}, you\'re ready for our Advanced Conversation Workshop!</p>\n\n<p>This 6-week intensive helps students like you:</p>\n<ul>\n<li>{benefit1}</li>\n<li>{benefit2}</li>\n<li>{benefit3}</li>\n</ul>\n\n<p><strong>Class details:</strong></p>\n<ul>\n<li>Starts: {startDate}</li>\n<li>Meets: {schedule}</li>\n<li>Limited to {maxStudents} students for maximum participation</li>\n<li>Instructor: {instructorName}, {instructorCredentials}</li>\n</ul>\n\n<p><strong>Current student pricing:</strong> {price} (normally {regularPrice})</p>\n\n<p>This class fills quickly - we have {spotsRemaining} spots left.</p>\n\n<p><a href="{enrollLink}">Enroll now</a> or <a href="{infoLink}">learn more</a></p>\n\n<p>Questions? Reply to this email or call {phoneNumber}.</p>\n\n<p>Best,<br>Maria</p>',
    textBody: 'Hi {firstName},\n\nBased on your progress in {currentClass}, you\'re ready for our Advanced Conversation Workshop!\n\nThis 6-week intensive helps students like you:\n- {benefit1}\n- {benefit2}\n- {benefit3}\n\nClass details:\n- Starts: {startDate}\n- Meets: {schedule}\n- Limited to {maxStudents} students for maximum participation\n- Instructor: {instructorName}, {instructorCredentials}\n\nCurrent student pricing: {price} (normally {regularPrice})\n\nThis class fills quickly - we have {spotsRemaining} spots left.\n\nEnroll now: {enrollLink}\nLearn more: {infoLink}\n\nQuestions? Reply to this email or call {phoneNumber}.\n\nBest,\nMaria',
    outreachType: 'warm_broadcast',
    templateCategory: 'lead_magnet_offer',
    persona: 'student',
    funnelStage: 'retention',
    description: 'Upsell advanced course to current students with exclusive pricing',
    exampleContext: 'Current student in intermediate or advanced beginner class',
    variables: ['firstName', 'currentClass', 'benefit1', 'benefit2', 'benefit3', 'startDate', 'schedule', 'maxStudents', 'instructorName', 'instructorCredentials', 'price', 'regularPrice', 'spotsRemaining', 'enrollLink', 'infoLink', 'phoneNumber']
  },
  {
    name: 'cold_broadcast_donor_awareness',
    subject: '{impactNumber} adults learned to read this year. You can help us reach {goalNumber}.',
    htmlBody: '<p>Dear Friend,</p>\n\n<p>Imagine being unable to read your child\'s report card. Or fill out a job application. Or understand a medical prescription.</p>\n\n<p>This year, we helped {impactNumber} adults in {cityName} overcome this challenge. But {unmetNeedNumber} more are still waiting.</p>\n\n<p>Your support can change that.</p>\n\n<p><strong>What your gift provides:</strong></p>\n<ul>\n<li>{donationLevel1}: {impact1}</li>\n<li>{donationLevel2}: {impact2}</li>\n<li>{donationLevel3}: {impact3}</li>\n</ul>\n\n<p>Meet {studentName}:</p>\n<blockquote>\n<p>"{testimonialQuote}"</p>\n</blockquote>\n\n<p>{studentName}\'s story is one of {totalStudents} we\'ve helped this year. Together, we can reach {goalNumber} next year.</p>\n\n<p><a href="{donateLink}">Make your first gift</a></p>\n\n<p>With gratitude,<br>The Literacy Center Team</p>',
    textBody: 'Dear Friend,\n\nImagine being unable to read your child\'s report card. Or fill out a job application. Or understand a medical prescription.\n\nThis year, we helped {impactNumber} adults in {cityName} overcome this challenge. But {unmetNeedNumber} more are still waiting.\n\nYour support can change that.\n\nWhat your gift provides:\n- {donationLevel1}: {impact1}\n- {donationLevel2}: {impact2}\n- {donationLevel3}: {impact3}\n\nMeet {studentName}:\n"{testimonialQuote}"\n\n{studentName}\'s story is one of {totalStudents} we\'ve helped this year. Together, we can reach {goalNumber} next year.\n\nMake your first gift: {donateLink}\n\nWith gratitude,\nThe Literacy Center Team',
    outreachType: 'cold_broadcast',
    templateCategory: 'social_proof',
    persona: 'donor',
    funnelStage: 'awareness',
    description: 'Cold acquisition email with emotional storytelling and specific impact',
    exampleContext: 'Community members who haven\'t donated before',
    variables: ['impactNumber', 'goalNumber', 'cityName', 'unmetNeedNumber', 'donationLevel1', 'impact1', 'donationLevel2', 'impact2', 'donationLevel3', 'impact3', 'studentName', 'testimonialQuote', 'totalStudents', 'donateLink']
  }
];
