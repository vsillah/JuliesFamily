import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  User, 
  GraduationCap, 
  Users, 
  Heart, 
  HandHeart,
  BookOpen,
  Calendar,
  DollarSign,
  HelpCircle,
  ChevronRight
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HowItWorks() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Welcome to Julie's Family Learning Program! Our website adapts to show you the most relevant content based on your interests.
          </p>
        </div>

        {/* Personalized Experience Section */}
        <section className="mb-16">
          <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
            Your Personalized Experience
          </h2>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                How Personalization Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                When you visit our website, we show you content tailored to your role and interests. 
                The site adapts based on whether you're a student, parent, service provider, donor, or volunteer.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">1</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Choose Your Role</h4>
                    <p className="text-sm text-muted-foreground">
                      Select which best describes you (student, parent, etc.)
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">2</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">See Relevant Content</h4>
                    <p className="text-sm text-muted-foreground">
                      We show programs, resources, and opportunities that match your needs
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">3</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Access Resources</h4>
                    <p className="text-sm text-muted-foreground">
                      Get guides, checklists, and tools designed specifically for you
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">4</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Take Action</h4>
                    <p className="text-sm text-muted-foreground">
                      Enroll, volunteer, donate, or connect with us easily
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Who We Serve */}
        <section className="mb-16">
          <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
            Who We Serve
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Adult education programs including HiSET preparation, ESL classes, and career training
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-primary" />
                  Parents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Early childhood education, preschool programs, and family support services
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Service Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Partnership opportunities and client referral programs for community organizations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="w-5 h-5 text-primary" />
                  Donors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Support our mission through financial contributions and see your impact
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HandHeart className="w-5 h-5 text-primary" />
                  Volunteers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share your time and talents to help students and families succeed
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How to Get Involved */}
        <section className="mb-16">
          <h2 className="font-playfair text-3xl font-bold text-foreground mb-6">
            How to Get Involved
          </h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Enroll in Programs
                </CardTitle>
                <CardDescription>For students and parents</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Browse available programs in the Services section</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Download helpful resources like checklists and guides</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Contact us to schedule an enrollment appointment</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Make a Donation
                </CardTitle>
                <CardDescription>Support our mission</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Review our impact statistics and success stories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Choose a donation amount that works for you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Complete the secure donation form to contribute</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HandHeart className="w-5 h-5 text-primary" />
                  Volunteer Your Time
                </CardTitle>
                <CardDescription>Make a difference in your community</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Explore volunteer opportunities that match your interests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Download the volunteer handbook to learn more</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Fill out the volunteer application form</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Attend Events
                </CardTitle>
                <CardDescription>Join us for community gatherings</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Check the Events section for upcoming activities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>RSVP or register for events that interest you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Join us to connect with the community and learn more</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="font-playfair text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <HelpCircle className="w-8 h-8" />
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="programs">
              <AccordionTrigger data-testid="faq-programs">
                What programs do you offer?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-2">
                  We offer a range of educational and support programs including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Adult education and HiSET preparation</li>
                  <li>English as a Second Language (ESL) classes</li>
                  <li>Early childhood education and preschool programs</li>
                  <li>Career training and workforce development</li>
                  <li>Family support services and workshops</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cost">
              <AccordionTrigger data-testid="faq-cost">
                Are your programs free?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Yes! Most of our programs are offered free of charge to qualifying participants. 
                  We also provide free childcare during classes and can help connect you with additional support services. 
                  Contact us to learn more about specific program requirements and enrollment.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="childcare">
              <AccordionTrigger data-testid="faq-childcare">
                Do you provide childcare during classes?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Yes, we provide free on-site childcare for students attending adult education classes. 
                  Our trained staff ensures your children are safe, engaged, and learning while you focus on your education.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="schedule">
              <AccordionTrigger data-testid="faq-schedule">
                What are your class schedules?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  We offer flexible scheduling to accommodate working adults and families. Classes are available during 
                  mornings, afternoons, and evenings. Specific schedules vary by program. Contact us or visit the 
                  Services section to learn about schedules for specific programs.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="enroll">
              <AccordionTrigger data-testid="faq-enroll">
                How do I enroll in a program?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-2">
                  Enrollment is easy:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Browse our programs in the Services section</li>
                  <li>Download any relevant guides or checklists</li>
                  <li>Contact us by phone, email, or through our website</li>
                  <li>Schedule an enrollment appointment</li>
                  <li>Complete the enrollment process and start learning!</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="volunteer-requirements">
              <AccordionTrigger data-testid="faq-volunteer">
                What are the requirements to volunteer?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Volunteer requirements vary by role, but generally include completing an application, 
                  undergoing a background check, and attending orientation/training. We have opportunities 
                  for volunteers with all different schedules and skill sets. Download our volunteer handbook 
                  or contact us to learn more about specific opportunities.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="donations">
              <AccordionTrigger data-testid="faq-donations">
                How are donations used?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-2">
                  Your donations directly support:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Free educational programs and materials</li>
                  <li>Childcare services for students</li>
                  <li>Qualified instructors and support staff</li>
                  <li>Facility maintenance and resources</li>
                  <li>Community events and family activities</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  We're committed to transparency. View our impact report to see how donations transform lives.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="partnership">
              <AccordionTrigger data-testid="faq-partnership">
                How can my organization partner with you?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  We welcome partnerships with community organizations, businesses, and service providers. 
                  Partnerships can include client referrals, resource sharing, collaborative programming, or sponsorships. 
                  Download our partnership guide or contact us to explore how we can work together to serve our community better.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contact">
              <AccordionTrigger data-testid="faq-contact">
                How do I contact you?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground mb-2">
                  You can reach us through:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>Phone: Contact information in the footer</li>
                  <li>Email: info@juliesfamilylearning.org</li>
                  <li>In person: Visit us at our center (address in footer)</li>
                  <li>Online: Fill out a contact form on our website</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* CTA */}
        <section className="text-center bg-muted/30 rounded-lg p-8">
          <h2 className="font-playfair text-2xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Whether you're looking to learn, give back, or support our mission, 
            we're here to help you take the next step.
          </p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold hover-elevate active-elevate-2"
            data-testid="button-back-home"
          >
            Back to Home
            <ChevronRight className="w-4 h-4" />
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
