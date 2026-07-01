import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Boxes,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Factory,
  Globe2,
  KeyRound,
  LayoutDashboard,
  MonitorSmartphone,
  Palette,
  Plus,
  Rocket,
  Settings2,
  ShieldCheck,
  UserRoundCog,
  Workflow,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const shellMetrics = [
  { label: "Tenants", value: "3", detail: "1 platform seed, 2 templates queued", icon: Boxes },
  { label: "Sites", value: "5", detail: "2 published, 3 in draft", icon: Globe2 },
  { label: "Templates", value: "3", detail: "Learning, advisory, campaign", icon: Factory },
  { label: "Launch Gates", value: "7/9", detail: "Convex auth and live smoke remain", icon: Rocket },
];

const tenants = [
  {
    name: "Julie's Family Learning Program",
    slug: "julies-family",
    plan: "Founding Tenant",
    sites: 2,
    owner: "Vambah",
    status: "active",
  },
  {
    name: "Advisor Client Starter",
    slug: "advisor-client-starter",
    plan: "Client Build",
    sites: 1,
    owner: "Client Admin",
    status: "draft",
  },
  {
    name: "Campaign Microsite Lab",
    slug: "campaign-microsite-lab",
    plan: "Launch Lab",
    sites: 2,
    owner: "Campaign Editor",
    status: "draft",
  },
];

const sites = [
  {
    name: "Julie Family Public Site",
    tenant: "julies-family",
    domain: "juliesfamily.org",
    route: "/",
    template: "Nonprofit Learning Center",
    status: "published",
  },
  {
    name: "Tech Goes Home Cohort",
    tenant: "julies-family",
    domain: "tgh.juliesfamily.org",
    route: "/programs/tech-goes-home",
    template: "Campaign Microsite",
    status: "preview",
  },
  {
    name: "Advisor Client Site",
    tenant: "advisor-client-starter",
    domain: "pending",
    route: "/",
    template: "Advisor Consultant",
    status: "draft",
  },
];

const templates = [
  {
    key: "nonprofit-learning-center",
    label: "Nonprofit Learning Center",
    fit: "Family learning, cohorts, volunteers, donors",
    blocks: ["Hero", "Services", "Events", "Testimonials", "Lead magnet"],
  },
  {
    key: "advisor-consultant",
    label: "Advisor Consultant",
    fit: "Client services, offers, case studies, intake",
    blocks: ["Hero", "Services", "Proof", "Form"],
  },
  {
    key: "campaign-microsite",
    label: "Campaign Microsite",
    fit: "Launches, cohorts, fundraising, local campaigns",
    blocks: ["Hero", "Campaign", "Proof", "Lead magnet"],
  },
];

const experienceControls = [
  { label: "Theme Tokens", value: "Palette, typography, spacing, radii", icon: Palette },
  { label: "Navigation", value: "Header and footer placement per site", icon: LayoutDashboard },
  { label: "Audience Rules", value: "Persona and journey-stage block visibility", icon: Workflow },
  { label: "Responsive Preview", value: "Desktop, tablet, phone launch checks", icon: MonitorSmartphone },
];

const roles = [
  { role: "Super Admin", scope: "Platform", access: "Tenants, templates, billing gates, audit events", owner: "Vambah" },
  { role: "Tenant Owner", scope: "Tenant", access: "Sites, members, theme, domain metadata", owner: "Client lead" },
  { role: "Site Admin", scope: "Site", access: "Pages, navigation, blocks, publish workflow", owner: "Program lead" },
  { role: "Editor", scope: "Site", access: "Draft content and asset records", owner: "Content support" },
];

const launchGates = [
  { label: "Phase 0 source import", status: "done" },
  { label: "Secret handling baseline", status: "done" },
  { label: "Drizzle-to-Convex map", status: "done" },
  { label: "Convex control plane", status: "done" },
  { label: "Site builder schema", status: "done" },
  { label: "Template factory", status: "done" },
  { label: "Public resolver", status: "done" },
  { label: "Convex deployment and generated API", status: "pending" },
  { label: "Live admin smoke", status: "pending" },
];

function statusBadge(status: string) {
  if (status === "active" || status === "published" || status === "done") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Ready</Badge>;
  }
  if (status === "preview") {
    return <Badge className="bg-sky-600 hover:bg-sky-600">Preview</Badge>;
  }
  return <Badge variant="outline">Draft</Badge>;
}

export default function AdminKinfloShell() {
  const { isLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading shell...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: "Admin Dashboard", href: "/admin" }, { label: "KinFlo OS" }]} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Convex Phase 1</Badge>
                <Badge variant="outline">Provider-light shell</Badge>
              </div>
              <h1 className="mt-3 text-3xl font-serif font-bold sm:text-4xl">KinFlo OS</h1>
              <p className="mt-2 max-w-3xl text-base text-muted-foreground">
                The operating shell for tenants, sites, templates, permissions, and configurable public experiences.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled data-testid="button-create-tenant-disabled">
                <Plus className="mr-2 h-4 w-4" />
                New Tenant
              </Button>
              <Button variant="outline" disabled data-testid="button-create-site-disabled">
                <Globe2 className="mr-2 h-4 w-4" />
                New Site
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {shellMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="tenants" className="mt-8">
          <TabsList className="grid h-auto w-full grid-cols-2 md:w-auto md:grid-cols-5">
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="mt-6">
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Tenant Control Plane</h2>
                  <p className="text-sm text-muted-foreground">Tenant records, membership scope, and site ownership.</p>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/admin/role-provisioning">
                    <UserRoundCog className="mr-2 h-4 w-4" />
                    Roles
                  </Link>
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Sites</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="text-right">State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.slug}>
                        <TableCell>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                        </TableCell>
                        <TableCell>{tenant.plan}</TableCell>
                        <TableCell>{tenant.sites}</TableCell>
                        <TableCell>{tenant.owner}</TableCell>
                        <TableCell className="text-right">{statusBadge(tenant.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="sites" className="mt-6">
            <section className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Site Factory Queue</h2>
                  <p className="text-sm text-muted-foreground">Site creation, templates, publishing, and public resolution.</p>
                </div>
                <Button variant="outline" disabled>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead className="text-right">State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sites.map((site) => (
                      <TableRow key={`${site.tenant}-${site.name}`}>
                        <TableCell>
                          <div className="font-medium">{site.name}</div>
                          <div className="text-xs text-muted-foreground">{site.route}</div>
                        </TableCell>
                        <TableCell>{site.tenant}</TableCell>
                        <TableCell>{site.domain}</TableCell>
                        <TableCell>{site.template}</TableCell>
                        <TableCell className="text-right">{statusBadge(site.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Starter Templates</h2>
              <div className="grid gap-4 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.key}>
                    <CardHeader>
                      <CardTitle className="text-base">{template.label}</CardTitle>
                      <p className="text-sm text-muted-foreground">{template.fit}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {template.blocks.map((block) => (
                          <Badge key={block} variant="secondary">{block}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="experience" className="mt-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Configurable Experience Layer</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {experienceControls.map((control) => {
                  const Icon = control.icon;
                  return (
                    <Card key={control.label}>
                      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                        <div className="rounded-md border bg-background p-2">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{control.label}</CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">{control.value}</p>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="access" className="mt-6">
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">Permission Model</h2>
                  <Badge variant="outline">
                    <KeyRound className="mr-1 h-3 w-3" />
                    Scoped roles
                  </Badge>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead>Owner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.role}>
                          <TableCell className="font-medium">{role.role}</TableCell>
                          <TableCell>{role.scope}</TableCell>
                          <TableCell>{role.access}</TableCell>
                          <TableCell>{role.owner}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Launch Gates</h2>
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="rounded-lg border">
                  {launchGates.map((gate, index) => {
                    const done = gate.status === "done";
                    return (
                      <div
                        key={gate.label}
                        className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
                          index === 0 ? "" : "border-t"
                        }`}
                      >
                        <span>{gate.label}</span>
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <CircleDashed className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Next Activation Gate</h2>
            <p className="text-sm text-muted-foreground">Convex deployment, generated API bindings, and live admin smoke.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/guide">
              <Settings2 className="mr-2 h-4 w-4" />
              Admin Guide
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
