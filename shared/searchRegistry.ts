import {
  Kanban, Target, BarChart3, MessageSquare, Settings,
  TrendingUp, Users, Mail, FileText, Image as ImageIcon,
  Shield, Database, BookOpen, Phone, Calendar, GraduationCap,
  Heart, UserPlus, Grid3x3, FileEdit, FlaskConical, Filter
} from "lucide-react";

export type SearchCategory = "navigation" | "content" | "crm" | "analytics" | "communication";

export interface SearchItem {
  id: string;
  title: string;
  description?: string;
  category: SearchCategory;
  icon: any;
  route: string;
  keywords?: string[];
  parent?: string;
}

export const staticSearchRegistry: SearchItem[] = [
  // Main Navigation - CRM
  {
    id: "pipeline",
    title: "Pipeline Board",
    description: "Kanban board for managing leads",
    category: "crm",
    icon: Kanban,
    route: "/admin/pipeline",
    keywords: ["kanban", "leads", "stages", "board"]
  },
  {
    id: "tasks",
    title: "Tasks",
    description: "View and manage tasks",
    category: "crm",
    icon: Target,
    route: "/admin/tasks",
    keywords: ["todo", "assignments", "task management"]
  },
  {
    id: "crm-dashboard",
    title: "CRM Dashboard",
    description: "Lead management and funnel analytics",
    category: "crm",
    icon: BarChart3,
    route: "/admin",
    keywords: ["leads", "funnel", "overview", "home"]
  },

  // Analytics
  {
    id: "cac-ltgp",
    title: "CAC:LTGP Analytics",
    description: "Customer acquisition cost and lifetime value",
    category: "analytics",
    icon: TrendingUp,
    route: "/admin/cac-ltgp",
    keywords: ["customer acquisition", "lifetime value", "metrics", "hormozi"]
  },
  {
    id: "donor-lifecycle",
    title: "Donor Lifecycle",
    description: "Track donor stages and progression",
    category: "analytics",
    icon: Users,
    route: "/admin/donor-lifecycle",
    keywords: ["donors", "stages", "retention", "lifecycle"]
  },
  {
    id: "ab-testing",
    title: "A/B Testing",
    description: "Manage and analyze A/B tests",
    category: "analytics",
    icon: FlaskConical,
    route: "/admin/ab-testing",
    keywords: ["experiments", "variants", "testing", "optimization"]
  },
  {
    id: "cohort-analysis",
    title: "Cohort Analysis",
    description: "Analyze donor cohorts over time",
    category: "analytics",
    icon: Calendar,
    route: "/admin/cohort-analysis",
    keywords: ["cohorts", "retention", "time series"]
  },
  {
    id: "lead-sourcing",
    title: "Lead Sourcing",
    description: "Track lead sources and channels",
    category: "analytics",
    icon: Filter,
    route: "/admin/lead-sourcing",
    keywords: ["sources", "channels", "attribution"]
  },
  {
    id: "channel-management",
    title: "Channel Management",
    description: "Manage marketing channels",
    category: "analytics",
    icon: BarChart3,
    route: "/admin/channel-management",
    keywords: ["marketing", "channels", "campaigns"]
  },

  // Communication
  {
    id: "email-campaigns",
    title: "Email Campaigns",
    description: "Automated email sequences",
    category: "communication",
    icon: Mail,
    route: "/admin/email-campaigns",
    keywords: ["email", "drip", "sequences", "automation"]
  },
  {
    id: "sms-notifications",
    title: "SMS Notifications",
    description: "Send SMS messages and templates",
    category: "communication",
    icon: Phone,
    route: "/admin/sms-notifications",
    keywords: ["sms", "text", "messaging", "twilio"]
  },
  {
    id: "hormozi-emails",
    title: "Hormozi Emails",
    description: "AI-powered email templates",
    category: "communication",
    icon: Mail,
    route: "/admin/hormozi-emails",
    keywords: ["ai", "templates", "copywriting"]
  },
  {
    id: "hormozi-sms",
    title: "Hormozi SMS",
    description: "AI-powered SMS templates",
    category: "communication",
    icon: Phone,
    route: "/admin/hormozi-sms",
    keywords: ["ai", "templates", "copywriting", "text"]
  },

  // Settings & Content
  {
    id: "content-manager",
    title: "Content Manager",
    description: "Manage all website content",
    category: "content",
    icon: FileText,
    route: "/admin/content",
    keywords: ["cms", "pages", "website"]
  },
  {
    id: "image-library",
    title: "Image Library",
    description: "Upload and manage images",
    category: "content",
    icon: ImageIcon,
    route: "/admin/images",
    keywords: ["photos", "media", "cloudinary", "uploads"]
  },
  {
    id: "user-management",
    title: "User Management",
    description: "Manage user accounts and roles",
    category: "navigation",
    icon: Shield,
    route: "/admin/users",
    keywords: ["users", "permissions", "roles", "admin"]
  },
  {
    id: "student-enrollments",
    title: "Student Enrollments",
    description: "Track student program enrollments",
    category: "navigation",
    icon: GraduationCap,
    route: "/admin/student-enrollments",
    keywords: ["students", "programs", "tech goes home"]
  },
  {
    id: "volunteer-management",
    title: "Volunteer Management",
    description: "Track volunteer activities and hours",
    category: "navigation",
    icon: UserPlus,
    route: "/admin/volunteer-management",
    keywords: ["volunteers", "activities", "hours"]
  },
  {
    id: "donation-campaigns",
    title: "Donation Campaigns",
    description: "Manage fundraising campaigns",
    category: "navigation",
    icon: Heart,
    route: "/admin/donation-campaigns",
    keywords: ["fundraising", "donations", "goals"]
  },
  {
    id: "database-backups",
    title: "Database Backups",
    description: "Create and restore backups",
    category: "navigation",
    icon: Database,
    route: "/admin/backups",
    keywords: ["backup", "restore", "recovery", "database"]
  },
  {
    id: "admin-preferences",
    title: "Admin Preferences",
    description: "Configure admin settings",
    category: "navigation",
    icon: Settings,
    route: "/admin/preferences",
    keywords: ["settings", "preferences", "configuration"]
  },
  {
    id: "help-guide",
    title: "Admin Guide",
    description: "Documentation and help",
    category: "navigation",
    icon: BookOpen,
    route: "/admin/guide",
    keywords: ["help", "documentation", "guide", "tutorial"]
  },

  // Content Manager Subtabs
  {
    id: "content-matrix",
    title: "Matrix View",
    description: "Persona × Journey Stage Matrix",
    category: "content",
    icon: Grid3x3,
    route: "/admin/content#matrix",
    parent: "content-manager",
    keywords: ["matrix", "persona", "funnel", "grid"]
  },
  {
    id: "content-hero",
    title: "Hero Content",
    description: "Manage hero sections",
    category: "content",
    icon: FileEdit,
    route: "/admin/content#hero",
    parent: "content-manager",
    keywords: ["hero", "banner", "headlines"]
  },
  {
    id: "content-cta",
    title: "CTA Content",
    description: "Manage call-to-action content",
    category: "content",
    icon: FileEdit,
    route: "/admin/content#cta",
    parent: "content-manager",
    keywords: ["cta", "call to action", "buttons"]
  },
  {
    id: "content-services",
    title: "Services",
    description: "Manage service offerings",
    category: "content",
    icon: FileEdit,
    route: "/admin/content#service",
    parent: "content-manager",
    keywords: ["services", "programs", "offerings"]
  },
  {
    id: "content-events",
    title: "Events",
    description: "Manage events",
    category: "content",
    icon: Calendar,
    route: "/admin/content#event",
    parent: "content-manager",
    keywords: ["events", "calendar", "activities"]
  },
  {
    id: "content-testimonials",
    title: "Testimonials",
    description: "Manage testimonials",
    category: "content",
    icon: Users,
    route: "/admin/content#testimonial",
    parent: "content-manager",
    keywords: ["testimonials", "reviews", "feedback"]
  },
  {
    id: "content-lead-magnets",
    title: "Lead Magnets",
    description: "Manage lead magnet content",
    category: "content",
    icon: FileEdit,
    route: "/admin/content#lead_magnet",
    parent: "content-manager",
    keywords: ["lead magnets", "downloads", "offers"]
  },
];

export function getSearchItemsByCategory(category: SearchCategory): SearchItem[] {
  return staticSearchRegistry.filter(item => item.category === category);
}

export function getAllSearchItems(): SearchItem[] {
  return staticSearchRegistry;
}

export function searchItems(query: string, items: SearchItem[]): SearchItem[] {
  const lowerQuery = query.toLowerCase();
  return items.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(lowerQuery);
    const descMatch = item.description?.toLowerCase().includes(lowerQuery);
    const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
    return titleMatch || descMatch || keywordMatch;
  });
}
