import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Boxes,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Factory,
  FormInput,
  Globe2,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  MonitorSmartphone,
  Palette,
  Plus,
  Rocket,
  Settings2,
  ShieldCheck,
  UserRoundCheck,
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
import {
  getKinfloShellSnapshot,
  type ExperienceIconKey,
  type KinfloShellStatus,
  type ShellMetricIconKey,
} from "@/lib/kinfloShellData";

const metricIcons: Record<ShellMetricIconKey, typeof Boxes> = {
  tenants: Boxes,
  sites: Globe2,
  templates: Factory,
  leads: UserRoundCheck,
  launchGates: Rocket,
};

const experienceIcons: Record<ExperienceIconKey, typeof Palette> = {
  theme: Palette,
  navigation: LayoutDashboard,
  audience: Workflow,
  preview: MonitorSmartphone,
};

function statusBadge(status: KinfloShellStatus) {
  if (status === "active" || status === "published" || status === "done") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Ready</Badge>;
  }
  if (status === "preview") {
    return <Badge className="bg-sky-600 hover:bg-sky-600">Preview</Badge>;
  }
  if (status === "converted") {
    return <Badge className="bg-teal-600 hover:bg-teal-600">Converted</Badge>;
  }
  if (status === "nurture") {
    return <Badge className="bg-amber-600 hover:bg-amber-600">Nurture</Badge>;
  }
  return <Badge variant="outline">Draft</Badge>;
}

export default function AdminKinfloShell() {
  const { isLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const [, navigate] = useLocation();
  const snapshot = getKinfloShellSnapshot();

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {snapshot.metrics.map((metric) => {
            const Icon = metricIcons[metric.iconKey];
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

        <Card className="mt-6">
          <CardHeader className="flex flex-col gap-3 space-y-0 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">Data Mode</CardTitle>
                <Badge variant="outline">{snapshot.dataMode.label}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {snapshot.dataMode.description}
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              {snapshot.dataMode.source === "fixture" ? "Convex pending" : "Convex live"}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
            <div>
              <div className="text-sm font-medium">Activation gate</div>
              <p className="mt-1 text-sm text-muted-foreground">{snapshot.dataMode.activationGate}</p>
            </div>
            <div>
              <div className="text-sm font-medium">Convex contract</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {snapshot.dataMode.convexFunctions.map((functionName) => (
                  <Badge key={functionName} variant="secondary">{functionName}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="tenants" className="mt-8">
          <TabsList className="grid h-auto w-full grid-cols-2 md:w-auto md:grid-cols-6">
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="crm">CRM</TabsTrigger>
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
                    {snapshot.tenants.map((tenant) => (
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
                    {snapshot.sites.map((site) => (
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
                {snapshot.templates.map((template) => (
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

          <TabsContent value="crm" className="mt-6">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">CRM Lead Workspace</h2>
                    <p className="text-sm text-muted-foreground">Site-scoped lead intake, assignment, and follow-up state.</p>
                  </div>
                  <Badge variant="outline">
                    <UserRoundCheck className="mr-1 h-3 w-3" />
                    crm.submitLead
                  </Badge>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lead</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Persona</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="text-right">State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snapshot.leads.map((lead) => (
                        <TableRow key={lead.email}>
                          <TableCell>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-xs text-muted-foreground">{lead.email}</div>
                          </TableCell>
                          <TableCell>{lead.site}</TableCell>
                          <TableCell>{lead.persona}</TableCell>
                          <TableCell>{lead.stage}</TableCell>
                          <TableCell>{lead.owner}</TableCell>
                          <TableCell className="text-right">{statusBadge(lead.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="rounded-md border bg-background p-2">
                      <FormInput className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Public Intake</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Lead blocks map to `crm.submitLead` with `/api/leads` as the temporary runtime fallback.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.leadCaptureContracts.map((contract) => (
                      <div key={contract.label} className="rounded-md border px-3 py-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{contract.label}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{contract.blockType} · {contract.convexFunction}</div>
                          </div>
                          <Badge variant="outline">{contract.runtime}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {contract.requiredFields.map((field) => (
                            <Badge key={field} variant="secondary">{field}</Badge>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">{contract.fallback}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="rounded-md border bg-background p-2">
                      <Workflow className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Pipeline</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Phase 12 stages mirror `pipelineStages`.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.pipelineStages.map((stage) => (
                      <div key={stage.slug} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium">{stage.label}</div>
                          <div className="text-xs text-muted-foreground">{stage.color}</div>
                        </div>
                        <Badge variant="secondary">{stage.leads}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="rounded-md border bg-background p-2">
                      <ListChecks className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Follow-up Tasks</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Task records stay scoped to lead and site.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.tasks.map((task) => (
                      <div key={`${task.lead}-${task.title}`} className="rounded-md border px-3 py-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{task.lead} · {task.owner}</div>
                          </div>
                          {statusBadge(task.status)}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">{task.due}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="experience" className="mt-6">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Configurable Experience Layer</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {snapshot.experienceControls.map((control) => {
                  const Icon = experienceIcons[control.iconKey];
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
                      {snapshot.roles.map((role) => (
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
                  {snapshot.launchGates.map((gate, index) => {
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
