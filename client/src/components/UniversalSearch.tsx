import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { staticSearchRegistry, type SearchItem, type SearchCategory } from "@shared/searchRegistry";
import { 
  Search, ChevronRight, Hash, Users as UsersIcon, Mail, 
  Target, Calendar, Heart, FileText 
} from "lucide-react";
import type { Lead, Task, EmailCampaign, ContentItem } from "@shared/schema";
import Fuse from "fuse.js";

interface DynamicSearchResult {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  icon: any;
  route: string;
  parent?: string;
  metadata?: Record<string, any>;
  score?: number;
}

const categoryLabels: Record<SearchCategory, string> = {
  navigation: "Navigation",
  content: "Content",
  crm: "CRM",
  analytics: "Analytics",
  communication: "Communication",
};

export function UniversalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();

  // Memoize static Fuse instance based on registry contents to handle edits and additions
  // Include all searchable fields (title, description, keywords) in dependency to catch any edits
  const staticFuse = useMemo(() => {
    return new Fuse(staticSearchRegistry, {
      keys: [
        { name: "title", weight: 2 },
        { name: "description", weight: 1 },
        { name: "keywords", weight: 1.5 },
      ],
      threshold: 0.4,
      includeScore: true,
    });
  }, [JSON.stringify(staticSearchRegistry.map(item => ({ 
    id: item.id, 
    title: item.title, 
    description: item.description,
    keywords: item.keywords,
    parent: item.parent,
    route: item.route 
  })))]);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Prefetch dynamic data when search is open (not gated on query length)
  // This ensures data is available when user starts typing
  const shouldFetchDynamic = open;

  // Dynamic loaders - use default queryFn from query client for consistent auth handling
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
    enabled: shouldFetchDynamic,
    staleTime: 60000, // Cache for 1 minute
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: shouldFetchDynamic,
    staleTime: 60000,
  });

  const { data: emailCampaigns = [], isLoading: campaignsLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/email-campaigns"],
    enabled: shouldFetchDynamic,
    staleTime: 60000,
  });

  const { data: content = [], isLoading: contentLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
    enabled: shouldFetchDynamic,
    staleTime: 60000,
  });

  const dynamicDataLoading = leadsLoading || tasksLoading || campaignsLoading || contentLoading;

  // Fuzzy search for dynamic leads
  const leadsFuse = useMemo(() => {
    const searchableLeads = leads.map(lead => ({
      ...lead,
      searchText: `${lead.firstName} ${lead.lastName} ${lead.email}`,
    }));
    return new Fuse(searchableLeads, {
      keys: [
        { name: "searchText", weight: 2 },
        { name: "persona", weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
    });
  }, [leads]);

  // Fuzzy search for tasks
  const tasksFuse = useMemo(() => {
    return new Fuse(tasks, {
      keys: [
        { name: "title", weight: 2 },
        { name: "description", weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
    });
  }, [tasks]);

  // Fuzzy search for email campaigns
  const campaignsFuse = useMemo(() => {
    return new Fuse(emailCampaigns, {
      keys: [
        { name: "name", weight: 2 },
        { name: "description", weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
    });
  }, [emailCampaigns]);

  // Fuzzy search for content
  const contentFuse = useMemo(() => {
    return new Fuse(content, {
      keys: [
        { name: "title", weight: 2 },
        { name: "subtitle", weight: 1 },
        { name: "type", weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
    });
  }, [content]);

  // Build dynamic search results with fuzzy ranking
  const getDynamicResults = useCallback((): DynamicSearchResult[] => {
    // Only show dynamic results when user has typed at least 2 characters
    if (query.length < 2) return [];

    const results: DynamicSearchResult[] = [];

    // Search leads with fuzzy matching
    const leadResults = leadsFuse.search(query).slice(0, 5);
    leadResults.forEach(({ item: lead, score }) => {
      results.push({
        id: `lead-${lead.id}`,
        title: `${lead.firstName} ${lead.lastName}`,
        description: `${lead.email} • ${lead.persona || 'No persona'}`,
        category: "crm",
        icon: UsersIcon,
        route: `/admin#lead-${lead.id}`,
        parent: "Leads",
        score,
        metadata: { type: "lead", data: lead }
      });
    });

    // Search tasks with fuzzy matching
    const taskResults = tasksFuse.search(query).slice(0, 5);
    taskResults.forEach(({ item: task, score }) => {
      results.push({
        id: `task-${task.id}`,
        title: task.title,
        description: task.description || 'No description',
        category: "crm",
        icon: Target,
        route: `/admin/tasks#task-${task.id}`,
        parent: "Tasks",
        score,
        metadata: { type: "task", data: task }
      });
    });

    // Search email campaigns with fuzzy matching
    const campaignResults = campaignsFuse.search(query).slice(0, 5);
    campaignResults.forEach(({ item: campaign, score }) => {
      results.push({
        id: `campaign-${campaign.id}`,
        title: campaign.name,
        description: campaign.description || 'No description',
        category: "communication",
        icon: Mail,
        route: `/admin/email-campaigns/${campaign.id}`,
        parent: "Email Campaigns",
        score,
        metadata: { type: "campaign", data: campaign }
      });
    });

    // Search content items with fuzzy matching
    const contentResults = contentFuse.search(query).slice(0, 8);
    contentResults.forEach(({ item, score }) => {
      const contentTypeLabels: Record<string, string> = {
        hero: "Hero",
        cta: "CTA",
        service: "Service",
        event: "Event",
        testimonial: "Testimonial",
        lead_magnet: "Lead Magnet",
      };
      
      results.push({
        id: `content-${item.id}`,
        title: item.title,
        description: `${contentTypeLabels[item.type] || item.type} • ${item.subtitle || ''}`,
        category: "content",
        icon: FileText,
        route: `/admin/content#${item.type}`,
        parent: "Content Manager",
        score,
        metadata: { type: "content", data: item }
      });
    });

    // Sort by score (lower is better in Fuse.js)
    return results.sort((a, b) => (a.score || 0) - (b.score || 0));
  }, [query, leadsFuse, tasksFuse, campaignsFuse, contentFuse]);

  // Filter static items with fuzzy search
  const getStaticResults = useCallback((): SearchItem[] => {
    if (query.length === 0) return staticSearchRegistry;
    
    const fuseResults = staticFuse.search(query);
    return fuseResults.map(result => result.item);
  }, [query, staticFuse]);

  const staticResults = getStaticResults();
  const dynamicResults = getDynamicResults();

  // Group results by category
  const groupedStatic = staticResults.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<SearchCategory, SearchItem[]>);

  const groupedDynamic = dynamicResults.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<SearchCategory, DynamicSearchResult[]>);

  const handleSelect = useCallback((route: string) => {
    setOpen(false);
    setQuery("");
    
    // Handle hash routes
    if (route.includes("#")) {
      const [path, hash] = route.split("#");
      navigate(path);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } else {
      navigate(route);
    }
  }, [navigate]);

  return (
    <>
      {/* Trigger button for mobile/visible UI */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover-elevate rounded-md border border-input bg-background transition-colors"
        data-testid="button-universal-search"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-muted rounded">
          <span>⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search admin dashboard..." 
          value={query}
          onValueChange={setQuery}
          data-testid="input-universal-search"
        />
        <CommandList>
          <CommandEmpty>
            {dynamicDataLoading && query.length >= 2 ? "Loading results..." : "No results found."}
          </CommandEmpty>

          {/* Static Results */}
          {Object.entries(groupedStatic).map(([category, items]) => (
            items.length > 0 && (
              <div key={category}>
                <CommandGroup heading={categoryLabels[category as SearchCategory]}>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.title}
                        onSelect={() => handleSelect(item.route)}
                        data-testid={`search-result-${item.id}`}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.parent && (
                              <>
                                <span className="text-xs text-muted-foreground">{item.parent}</span>
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              </>
                            )}
                            <span>{item.title}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </div>
            )
          ))}

          {/* Dynamic Results - only shown when query >= 2 chars */}
          {query.length >= 2 && Object.entries(groupedDynamic).map(([category, items]) => (
            items.length > 0 && (
              <div key={`dynamic-${category}`}>
                <CommandGroup heading={`${categoryLabels[category as SearchCategory]} Items`}>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.title}
                        onSelect={() => handleSelect(item.route)}
                        data-testid={`search-result-${item.id}`}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.parent && (
                              <>
                                <span className="text-xs text-muted-foreground">{item.parent}</span>
                                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                              </>
                            )}
                            <span>{item.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <Hash className="w-3 h-3 text-muted-foreground ml-2" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </div>
            )
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function UniversalSearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover-elevate rounded-md border border-input bg-background transition-colors"
      data-testid="button-universal-search-trigger"
    >
      <Search className="w-4 h-4" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono bg-muted rounded">
        <span>⌘</span>K
      </kbd>
    </button>
  );
}
