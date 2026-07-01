import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Boxes,
  CheckCircle2,
  CircleDashed,
  CreditCard,
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
  SlidersHorizontal,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [activeTab, setActiveTab] = useState("tenants");
  const [selectedLaunchPacketId, setSelectedLaunchPacketId] = useState(snapshot.siteLaunchPackets[0]?.id ?? "");
  const [wizardTemplateKey, setWizardTemplateKey] = useState(snapshot.siteCreationWizard.defaultTemplateKey);
  const [wizardSiteName, setWizardSiteName] = useState(snapshot.siteCreationWizard.defaultSiteName);
  const [wizardSubdomain, setWizardSubdomain] = useState(snapshot.siteCreationWizard.defaultSubdomain);
  const [wizardBrandTone, setWizardBrandTone] = useState(snapshot.siteCreationWizard.brandToneOptions[0] ?? "");
  const [wizardOwnerRole, setWizardOwnerRole] = useState(snapshot.siteCreationWizard.ownerRoleOptions[0] ?? "");
  const [selectedPlanKey, setSelectedPlanKey] = useState(snapshot.billingPlans[0]?.key ?? "");
  const [wizardPageKeys, setWizardPageKeys] = useState(
    snapshot.siteCreationWizard.pageOptions.filter((page) => page.required).map((page) => page.key),
  );
  const selectedLaunchPacket = useMemo(
    () => snapshot.siteLaunchPackets.find((packet) => packet.id === selectedLaunchPacketId) ?? snapshot.siteLaunchPackets[0],
    [selectedLaunchPacketId, snapshot.siteLaunchPackets],
  );
  const selectedWizardTemplate = useMemo(
    () => snapshot.templates.find((template) => template.key === wizardTemplateKey) ?? snapshot.templates[0],
    [snapshot.templates, wizardTemplateKey],
  );
  const selectedPlan = useMemo(
    () => snapshot.billingPlans.find((plan) => plan.key === selectedPlanKey) ?? snapshot.billingPlans[0],
    [selectedPlanKey, snapshot.billingPlans],
  );
  const requiredPageKeys = useMemo(
    () => snapshot.siteCreationWizard.pageOptions.filter((page) => page.required).map((page) => page.key),
    [snapshot.siteCreationWizard.pageOptions],
  );
  const requiredPagesSelected = requiredPageKeys.every((pageKey) => wizardPageKeys.includes(pageKey));
  const wizardReadiness = [
    { label: "Template selected", done: Boolean(selectedWizardTemplate) },
    { label: "Site and subdomain named", done: Boolean(wizardSiteName.trim() && wizardSubdomain.trim()) },
    { label: "Required pages selected", done: requiredPagesSelected },
    { label: "Owner role scoped", done: Boolean(wizardOwnerRole) },
    { label: "Preview route prepared", done: Boolean(selectedLaunchPacket?.previewPath) },
    { label: "Live Convex smoke pending", done: false },
  ];
  const wizardReadyCount = wizardReadiness.filter((item) => item.done).length;
  const wizardReadinessPercent = Math.round((wizardReadyCount / wizardReadiness.length) * 100);

  const toggleWizardPage = (pageKey: string, checked: boolean) => {
    setWizardPageKeys((current) => {
      if (checked) {
        return current.includes(pageKey) ? current : [...current, pageKey];
      }
      return current.filter((item) => item !== pageKey);
    });
  };

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
              <Button onClick={() => setActiveTab("factory")} data-testid="button-create-tenant">
                <Plus className="mr-2 h-4 w-4" />
                New Tenant
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("factory")} data-testid="button-create-site">
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
                <Badge variant="secondary">{snapshot.dataMode.runtimeLabel}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {snapshot.dataMode.description}
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              {snapshot.dataMode.runtimeMode === "live_ready" ? "Convex live" : "Convex gated"}
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid h-auto w-full grid-cols-2 md:w-auto md:grid-cols-8">
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="factory">Factory</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
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
                      <TableHead>Preview</TableHead>
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
                        <TableCell>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={site.previewPath}>
                              <ExternalLink className="mr-2 h-3 w-3" />
                              Open
                            </Link>
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">{statusBadge(site.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="factory" className="mt-6">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Site Factory Launch Packets</h2>
                    <p className="text-sm text-muted-foreground">Prepare tenant, site, template, invite, and permission scope before live Convex mutations are enabled.</p>
                  </div>
                  <Badge variant="outline">
                    <Factory className="mr-1 h-3 w-3" />
                    Provider-light
                  </Badge>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-base">Site Creation Wizard</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Configure a launch-ready site packet before live Convex mutations are enabled.
                        </p>
                      </div>
                      <Badge variant="secondary">{wizardReadyCount}/{wizardReadiness.length} ready</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="kinflo-wizard-site-name">Site name</Label>
                        <Input
                          id="kinflo-wizard-site-name"
                          value={wizardSiteName}
                          onChange={(event) => setWizardSiteName(event.target.value)}
                          data-testid="input-kinflo-wizard-site-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kinflo-wizard-subdomain">Subdomain</Label>
                        <Input
                          id="kinflo-wizard-subdomain"
                          value={wizardSubdomain}
                          onChange={(event) => setWizardSubdomain(event.target.value)}
                          data-testid="input-kinflo-wizard-subdomain"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Template</Label>
                        <Select value={wizardTemplateKey} onValueChange={setWizardTemplateKey}>
                          <SelectTrigger data-testid="select-kinflo-wizard-template">
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.templates.map((template) => (
                              <SelectItem key={template.key} value={template.key}>
                                {template.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Owner role</Label>
                        <Select value={wizardOwnerRole} onValueChange={setWizardOwnerRole}>
                          <SelectTrigger data-testid="select-kinflo-wizard-owner-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {snapshot.siteCreationWizard.ownerRoleOptions.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Brand tone</Label>
                        <div className="flex flex-wrap gap-2">
                          {snapshot.siteCreationWizard.brandToneOptions.map((tone) => (
                            <Button
                              key={tone}
                              type="button"
                              size="sm"
                              variant={wizardBrandTone === tone ? "default" : "outline"}
                              onClick={() => setWizardBrandTone(tone)}
                              data-testid={`button-brand-tone-${tone.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                            >
                              {tone}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                      <div>
                        <div className="text-sm font-medium">Pages</div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {snapshot.siteCreationWizard.pageOptions.map((page) => (
                            <label key={page.key} className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                              <Checkbox
                                checked={wizardPageKeys.includes(page.key)}
                                disabled={page.required}
                                onCheckedChange={(checked) => toggleWizardPage(page.key, checked === true)}
                                data-testid={`checkbox-page-${page.key}`}
                              />
                              <span>
                                <span className="font-medium">{page.label}</span>
                                {page.required ? <span className="ml-2 text-xs text-muted-foreground">required</span> : null}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Readiness</span>
                          <span className="text-muted-foreground">{wizardReadinessPercent}%</span>
                        </div>
                        <Progress value={wizardReadinessPercent} className="mt-2" />
                        <div className="mt-3 space-y-2">
                          {wizardReadiness.map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                              {item.done ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <CircleDashed className="h-3.5 w-3.5" />
                              )}
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {selectedWizardTemplate ? (
                      <div className="rounded-md border p-3 text-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="font-medium">{selectedWizardTemplate.label}</div>
                            <div className="mt-1 text-muted-foreground">{selectedWizardTemplate.imageDirection}</div>
                          </div>
                          <Badge variant="outline">{wizardBrandTone}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedWizardTemplate.launchCriteria.map((criterion) => (
                            <Badge key={criterion} variant="secondary">{criterion}</Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        Draft route: <span className="font-medium text-foreground">/{wizardSubdomain || "subdomain"}</span>
                      </div>
                      <Button disabled>
                        <Rocket className="mr-2 h-4 w-4" />
                        Live mutation gated
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  {snapshot.siteLaunchPackets.map((packet) => {
                    const selected = packet.id === selectedLaunchPacket?.id;
                    return (
                      <Card key={packet.id} className={selected ? "border-primary" : undefined}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <CardTitle className="text-base">{packet.label}</CardTitle>
                              <p className="mt-1 text-sm text-muted-foreground">{packet.tenant} · {packet.template}</p>
                            </div>
                            {selected ? <Badge>Prepared</Badge> : <Badge variant="outline">Queued</Badge>}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-3 text-sm sm:grid-cols-2">
                            <div>
                              <div className="text-xs text-muted-foreground">Subdomain</div>
                              <div className="font-medium">{packet.subdomain}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Owner role</div>
                              <div className="font-medium">{packet.ownerRole}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => setSelectedLaunchPacketId(packet.id)}>
                              <Rocket className="mr-2 h-3 w-3" />
                              Prepare
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={packet.previewPath}>
                                <ExternalLink className="mr-2 h-3 w-3" />
                                Preview
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {selectedLaunchPacket ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Prepared Launch Packet</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedLaunchPacket.siteName} for {selectedLaunchPacket.tenant}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-md border p-3 text-sm">
                        <div className="font-medium">{selectedLaunchPacket.ownerEmail}</div>
                        <div className="mt-1 text-muted-foreground">{selectedLaunchPacket.ownerRole} · invitation prepared as token-hash-only contract</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Configuration</div>
                        <div className="mt-2 space-y-2">
                          {selectedLaunchPacket.configurationSummary.map((item) => (
                            <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Permission gates</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedLaunchPacket.permissionGates.map((permission) => (
                            <Badge key={permission} variant="secondary">{permission}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Convex Contract</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {[...selectedLaunchPacket.convexMutations, ...snapshot.siteCreationWizard.convexMutations]
                          .filter((mutationName, index, all) => all.indexOf(mutationName) === index)
                          .map((mutationName) => (
                          <Badge key={mutationName} variant="outline">{mutationName}</Badge>
                        ))}
                      </div>
                      <div className="rounded-lg border">
                        {selectedLaunchPacket.launchChecklist.map((gate, index) => {
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
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </section>
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Plans And Entitlements</h2>
                    <p className="text-sm text-muted-foreground">Plan limits, feature gates, and manual override state before Stripe Billing is connected.</p>
                  </div>
                  <Badge variant="outline">
                    <CreditCard className="mr-1 h-3 w-3" />
                    Stripe Billing gated
                  </Badge>
                </div>

                <Card>
                  <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle className="text-base">Plan Catalog</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Select a provider-light KinFlo plan to inspect limits before live billing sync.
                      </p>
                    </div>
                    <div className="w-full md:w-56">
                      <Select value={selectedPlanKey} onValueChange={setSelectedPlanKey}>
                        <SelectTrigger data-testid="select-kinflo-plan">
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {snapshot.billingPlans.map((plan) => (
                            <SelectItem key={plan.key} value={plan.key}>
                              {plan.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  {selectedPlan ? (
                    <CardContent className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{selectedPlan.label}</h3>
                            {statusBadge(selectedPlan.status)}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{selectedPlan.fit}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Target price</div>
                          <div className="mt-1 text-xl font-semibold">{selectedPlan.price}</div>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Limit</TableHead>
                              <TableHead className="text-right">Included</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedPlan.limits.map((limit) => (
                              <TableRow key={limit.label}>
                                <TableCell>{limit.label}</TableCell>
                                <TableCell className="text-right font-medium">{limit.value}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-sm font-medium">Feature gates</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedPlan.features.map((feature) => (
                              <Badge key={feature} variant="secondary">{feature}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Provider gates</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedPlan.gatedModules.map((moduleName) => (
                              <Badge key={moduleName} variant="outline">{moduleName}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  ) : null}
                </Card>

                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead className="text-right">State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snapshot.tenantEntitlements.map((entitlement) => (
                        <TableRow key={entitlement.tenantSlug}>
                          <TableCell>
                            <div className="font-medium">{entitlement.tenant}</div>
                            <div className="text-xs text-muted-foreground">{entitlement.tenantSlug}</div>
                          </TableCell>
                          <TableCell>{entitlement.planLabel}</TableCell>
                          <TableCell>{entitlement.source}</TableCell>
                          <TableCell>{entitlement.nextReview}</TableCell>
                          <TableCell className="text-right">{statusBadge(entitlement.status)}</TableCell>
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
                      <SlidersHorizontal className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Entitlement Overrides</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">Manual override rows stay reviewable until Stripe Billing writes the canonical subscription state.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {snapshot.tenantEntitlements.map((entitlement) => (
                      <div key={entitlement.tenantSlug} className="rounded-md border p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{entitlement.tenant}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{entitlement.planLabel} · {entitlement.source}</div>
                          </div>
                          <Badge variant="outline">manual override</Badge>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {entitlement.usage.map((usage) => (
                            <div key={usage.label} className="rounded-md bg-muted/40 px-3 py-2">
                              <div className="text-xs text-muted-foreground">{usage.label}</div>
                              <div className="font-medium">{usage.value} / {usage.limit}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {entitlement.featureOverrides.map((override) => (
                            <Badge key={override} variant="secondary">{override}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Convex Contract</CardTitle>
                    <p className="text-sm text-muted-foreground">These calls stay behind `billing:manage` until hosted Convex activation.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      "controlPlane.listPlanCatalog",
                      "controlPlane.syncDefaultBillingPlans",
                      "controlPlane.entitlementSnapshot",
                      "controlPlane.setTenantEntitlementOverride",
                    ].map((functionName) => (
                      <div key={functionName} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                        <span>{functionName}</span>
                        <Badge variant="outline">billing:manage</Badge>
                      </div>
                    ))}
                    <Button className="w-full" disabled>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Live billing sync gated
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Starter Templates</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Template contracts define configurable fields, image direction, QA checks, and launch criteria before live site creation.
                </p>
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                {snapshot.templates.map((template) => (
                  <Card key={template.key}>
                    <CardHeader>
                      <CardTitle className="text-base">{template.label}</CardTitle>
                      <p className="text-sm text-muted-foreground">{template.fit}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Blocks</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                        {template.blocks.map((block) => (
                          <Badge key={block} variant="secondary">{block}</Badge>
                        ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configure</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {template.configurableFields.map((field) => (
                            <Badge key={field} variant="outline">{field}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-md border p-3 text-sm text-muted-foreground">
                        <div className="mb-1 font-medium text-foreground">Image direction</div>
                        {template.imageDirection}
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-1">
                        <div>
                          <div className="font-medium">QA checks</div>
                          <div className="mt-2 space-y-1 text-muted-foreground">
                            {template.qaChecks.map((check) => (
                              <div key={check} className="flex gap-2">
                                <ListChecks className="mt-0.5 h-3.5 w-3.5" />
                                <span>{check}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Launch criteria</div>
                          <div className="mt-2 space-y-1 text-muted-foreground">
                            {template.launchCriteria.map((criterion) => (
                              <div key={criterion} className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5" />
                                <span>{criterion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
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
