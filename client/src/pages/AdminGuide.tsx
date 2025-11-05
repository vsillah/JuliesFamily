import { useAuth } from "@/hooks/useAuth";
import { Link, Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  FileEdit, 
  FlaskConical, 
  Users, 
  Shield,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react";

export default function AdminGuide() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4" data-testid="button-back-admin">
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Dashboard
            </button>
          </Link>
          <h1 className="font-playfair text-4xl font-bold text-foreground mb-4">
            Admin Guide
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete documentation for managing the website, content, A/B tests, and user data
          </p>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="content" data-testid="tab-content-management">
              <FileEdit className="w-4 h-4 mr-2" />
              Content Management
            </TabsTrigger>
            <TabsTrigger value="ab-testing" data-testid="tab-ab-testing">
              <FlaskConical className="w-4 h-4 mr-2" />
              A/B Testing
            </TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-lead-management">
              <Users className="w-4 h-4 mr-2" />
              Lead Management
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-user-permissions">
              <Shield className="w-4 h-4 mr-2" />
              User Permissions
            </TabsTrigger>
          </TabsList>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Overview
                </CardTitle>
                <CardDescription>
                  Manage all website content including services, events, testimonials, and lead magnets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The Content Manager allows you to create, edit, and organize all content displayed on the website.
                  Content can be customized for specific personas and funnel stages to deliver personalized experiences.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adding New Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">1</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Choose Content Type</h4>
                      <p className="text-sm text-muted-foreground">
                        Navigate to the Content Manager and select which type of content to create (Service, Event, Testimonial, Lead Magnet, Hero, or CTA)
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">2</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Fill in Details</h4>
                      <p className="text-sm text-muted-foreground">
                        Add a title, description, and select an image from your library. For lead magnets, specify the download URL.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">3</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Set Visibility</h4>
                      <p className="text-sm text-muted-foreground">
                        Control which personas and funnel stages can see this content. Leave blank to show to everyone.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">4</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Mark Active/Inactive</h4>
                      <p className="text-sm text-muted-foreground">
                        Toggle the active status to show/hide content without deleting it. Use the filter to hide inactive items.
                      </p>
                    </div>
                  </div>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Pro tip:</strong> Content marked as inactive is preserved in the database and can be reactivated later. This is useful for seasonal content or when testing new variations.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reordering Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Control the display order of content items using drag-and-drop:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Click and hold the drag handle (six dots) on any content card</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Drag the card to its new position in the list</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Release to drop - the order is saved automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>The new order is immediately reflected on the live website</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Understanding Usage Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Each content card shows badges indicating where and how the content is being used:
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">Visibility Badges (Blue)</h4>
                    <p className="text-sm text-muted-foreground">
                      Shows which persona and funnel stage combinations can see this content. Example: "Student × Awareness" or "3 Personas × 2 Stages"
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">A/B Test Badges</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>🔴 <strong>Active Tests</strong> - Currently running experiments</li>
                      <li>⏸️ <strong>Paused Tests</strong> - Temporarily stopped tests</li>
                      <li>📝 <strong>Draft Tests</strong> - Tests being prepared</li>
                      <li>✅ <strong>Completed Tests</strong> - Finished experiments</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Not Used Badge</h4>
                    <p className="text-sm text-muted-foreground">
                      Content not assigned to any persona/stage and not in any A/B test. Consider deleting or activating it.
                    </p>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> Deleting content that's in an active A/B test or assigned to personas will affect the live website. Check usage indicators before deletion.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Managing Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Upload and optimize images through the Image Library:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Navigate to Admin → Images to access the image library</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Upload images using the uploader (supports JPG, PNG, WebP)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Images are automatically optimized and stored on Cloudinary CDN</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Select from existing images when creating content in the Content Manager</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* A/B Testing Tab */}
          <TabsContent value="ab-testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5" />
                  Overview
                </CardTitle>
                <CardDescription>
                  Test different content variations to optimize engagement and conversions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The A/B Testing system lets you experiment with different hero sections, CTAs, card layouts, and messaging 
                  to discover what works best for your audience. Tests can be targeted to specific personas and funnel stages.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Creating a New Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">1</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Choose Test Type</h4>
                      <p className="text-sm text-muted-foreground">
                        Select what you want to test: Hero Variation, CTA Variation, Service/Event Card Order, or Messaging Test
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">2</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Set Targeting</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose which personas and funnel stages should see this test. Leave blank to test with all visitors.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">3</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Create Variants</h4>
                      <p className="text-sm text-muted-foreground">
                        Add 2-5 variants. For each, choose to select existing content OR create custom content inline. Set traffic percentage (must total 100%).
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">4</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Launch Test</h4>
                      <p className="text-sm text-muted-foreground">
                        Review your configuration and click "Create Test". Test starts in "draft" status - activate it to begin collecting data.
                      </p>
                    </div>
                  </div>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Best practice:</strong> Custom variants created during A/B test setup are automatically saved to the Content Manager for reusability.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Understanding Test Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">Draft</h4>
                    <p className="text-sm text-muted-foreground">
                      Test is configured but not running. No data is being collected. Activate to start the test.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Active</h4>
                    <p className="text-sm text-muted-foreground">
                      Test is running and collecting data. Visitors see different variants based on your traffic allocation.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Paused</h4>
                    <p className="text-sm text-muted-foreground">
                      Test is temporarily stopped. No new data collection, but existing results are preserved. Can be reactivated.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Completed</h4>
                    <p className="text-sm text-muted-foreground">
                      Test has finished. Results are final and can be reviewed in analytics. Cannot be restarted.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interpreting Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The Analytics Dashboard shows key metrics for each test variant:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span><strong>Impressions</strong> - How many times the variant was shown to visitors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span><strong>Clicks</strong> - Number of times visitors clicked the CTA or interacted with the variant</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span><strong>Conversion Rate</strong> - Percentage of impressions that resulted in clicks (Clicks ÷ Impressions)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span><strong>Statistical Significance</strong> - Whether the difference between variants is statistically meaningful (95% confidence threshold)</span>
                  </li>
                </ul>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Important:</strong> Wait for statistical significance before making decisions. Early results can be misleading. Aim for at least 100 impressions per variant.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lead Management Tab */}
          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Overview
                </CardTitle>
                <CardDescription>
                  Track and manage leads captured through website interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The CRM Dashboard helps you track visitors who download resources, sign up for information, or express interest in your programs.
                  Each lead includes contact details, persona, funnel stage, and a complete interaction history.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Understanding Lead Scoring</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Leads are automatically scored based on engagement level to help you prioritize outreach:
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1 text-green-600">Hot (70-100)</h4>
                    <p className="text-sm text-muted-foreground">
                      High engagement - downloaded multiple resources, visited frequently, or spent significant time on site. Priority for immediate follow-up.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-yellow-600">Warm (40-69)</h4>
                    <p className="text-sm text-muted-foreground">
                      Moderate engagement - downloaded a resource or submitted contact form. Good candidates for nurture campaigns.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1 text-blue-600">Cold (0-39)</h4>
                    <p className="text-sm text-muted-foreground">
                      Low engagement - minimal interaction with the site. Consider adding to email newsletter for long-term nurture.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Follow-Up Strategies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The lead details dialog provides outreach suggestions based on the lead's funnel stage:
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">Awareness Stage</h4>
                    <p className="text-sm text-muted-foreground">
                      Lead is exploring options. Send educational content, invite to events, share success stories. Avoid hard sells.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Consideration Stage</h4>
                    <p className="text-sm text-muted-foreground">
                      Lead is comparing options. Provide detailed program information, answer specific questions, offer consultations.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Decision Stage</h4>
                    <p className="text-sm text-muted-foreground">
                      Lead is ready to commit. Schedule enrollment, provide application forms, remove barriers to sign-up.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Action Stage</h4>
                    <p className="text-sm text-muted-foreground">
                      Lead has engaged. Confirm enrollment, provide welcome materials, set expectations for next steps.
                    </p>
                  </div>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Future feature:</strong> Email and SMS outreach will be automated through integration with SendGrid, Resend, or Twilio.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Using Lead Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Add notes to track conversations and next steps:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Click on any lead to open the details dialog</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Add notes about phone calls, emails, or follow-up needed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Notes are visible to all admins for team coordination</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Review interaction history to understand lead's journey</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Permissions Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Overview
                </CardTitle>
                <CardDescription>
                  Manage user accounts and administrative privileges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The User Management interface allows you to grant or revoke admin access for team members who need to manage content, view analytics, or access the CRM.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Granting Admin Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">1</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">User Must Sign In First</h4>
                      <p className="text-sm text-muted-foreground">
                        Ask the team member to visit the website and sign in using the "Sign In" button. They'll appear in the user list.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">2</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Find the User</h4>
                      <p className="text-sm text-muted-foreground">
                        Navigate to Admin → Users and use the search bar to find the user by name or email.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">3</div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Grant Access</h4>
                      <p className="text-sm text-muted-foreground">
                        Click "Grant Admin" next to their name. Confirm the action. They'll immediately have access to all admin features.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revoking Admin Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  To remove admin privileges from a user:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Find the admin user in the User Management interface</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Click "Revoke Admin" next to their name</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Confirm the action - they'll lose access immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>They can still use the public website but cannot access admin features</span>
                  </li>
                </ul>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Safety feature:</strong> You cannot revoke your own admin access. This prevents accidentally locking yourself out.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What Admins Can Do</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">
                  Users with admin privileges have access to:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Content Manager - Create, edit, delete, and reorder all content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Image Library - Upload and manage images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>A/B Testing - Create tests, view analytics, pause/complete tests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>CRM Dashboard - View leads, add notes, track interactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>User Management - Grant or revoke admin access for other users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-1 flex-shrink-0 text-primary" />
                    <span>Preview Mode - View the site from different persona perspectives</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/admin/content">
                <button className="w-full text-left p-3 rounded-md border hover-elevate active-elevate-2 transition-colors" data-testid="link-content-manager">
                  <FileEdit className="w-4 h-4 inline mr-2" />
                  Content Manager
                </button>
              </Link>
              <Link href="/admin/ab-testing">
                <button className="w-full text-left p-3 rounded-md border hover-elevate active-elevate-2 transition-colors" data-testid="link-ab-testing">
                  <FlaskConical className="w-4 h-4 inline mr-2" />
                  A/B Testing
                </button>
              </Link>
              <Link href="/admin">
                <button className="w-full text-left p-3 rounded-md border hover-elevate active-elevate-2 transition-colors" data-testid="link-crm-dashboard">
                  <Users className="w-4 h-4 inline mr-2" />
                  CRM Dashboard
                </button>
              </Link>
              <Link href="/admin/users">
                <button className="w-full text-left p-3 rounded-md border hover-elevate active-elevate-2 transition-colors" data-testid="link-user-management">
                  <Shield className="w-4 h-4 inline mr-2" />
                  User Management
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
