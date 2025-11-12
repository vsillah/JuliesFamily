import { useEffect, useState, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { staticSearchRegistry, type SearchItem, type SearchCategory } from "@shared/searchRegistry";
import { 
  Search, ChevronRight, Hash, Users as UsersIcon, Mail, 
  Target, Calendar, Heart, FileText 
} from "lucide-react";
import type { Lead, Task, EmailCampaign, Content } from "@shared/schema";

interface DynamicSearchResult {
  id: string;
  title: string;
  description: string;
  category: SearchCategory;
  icon: any;
  route: string;
  parent?: string;
  metadata?: Record<string, any>;
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

  // Fetch dynamic data only when search is open and query exists
  const shouldFetchDynamic = open && query.length >= 2;

  // Dynamic loaders - only fetch when needed
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads"],
    enabled: shouldFetchDynamic,
    staleTime: 60000, // Cache for 1 minute
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: shouldFetchDynamic,
    staleTime: 60000,
  });

  const { data: emailCampaigns = [] } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/email-campaigns"],
    enabled: shouldFetchDynamic,
    staleTime: 60000,
  });

  const { data: content = [] } = useQuery<Content[]>({
    queryKey: ["/api/content"],
    enabled: shouldFetchDynamic,
    staleTime: 60000,
  });

  // Build dynamic search results
  const getDynamicResults = useCallback((): DynamicSearchResult[] => {
    if (!shouldFetchDynamic) return [];

    const lowerQuery = query.toLowerCase();
    const results: DynamicSearchResult[] = [];

    // Search leads
    leads
      .filter(lead => 
        lead.firstName?.toLowerCase().includes(lowerQuery) ||
        lead.lastName?.toLowerCase().includes(lowerQuery) ||
        lead.email?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach(lead => {
        results.push({
          id: `lead-${lead.id}`,
          title: `${lead.firstName} ${lead.lastName}`,
          description: `${lead.email} • ${lead.persona || 'No persona'}`,
          category: "crm",
          icon: UsersIcon,
          route: `/admin#lead-${lead.id}`,
          parent: "Leads",
          metadata: { type: "lead", data: lead }
        });
      });

    // Search tasks
    tasks
      .filter(task => 
        task.title?.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach(task => {
        results.push({
          id: `task-${task.id}`,
          title: task.title,
          description: task.description || 'No description',
          category: "crm",
          icon: Target,
          route: `/admin/tasks#task-${task.id}`,
          parent: "Tasks",
          metadata: { type: "task", data: task }
        });
      });

    // Search email campaigns
    emailCampaigns
      .filter(campaign => 
        campaign.name?.toLowerCase().includes(lowerQuery) ||
        campaign.description?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5)
      .forEach(campaign => {
        results.push({
          id: `campaign-${campaign.id}`,
          title: campaign.name,
          description: campaign.description || 'No description',
          category: "communication",
          icon: Mail,
          route: `/admin/email-campaigns/${campaign.id}`,
          parent: "Email Campaigns",
          metadata: { type: "campaign", data: campaign }
        });
      });

    // Search content items
    content
      .filter(item => 
        item.title?.toLowerCase().includes(lowerQuery) ||
        item.subtitle?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8)
      .forEach(item => {
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
          metadata: { type: "content", data: item }
        });
      });

    return results;
  }, [shouldFetchDynamic, query, leads, tasks, emailCampaigns, content]);

  // Filter static items
  const getStaticResults = useCallback((): SearchItem[] => {
    if (query.length === 0) return staticSearchRegistry;
    
    const lowerQuery = query.toLowerCase();
    return staticSearchRegistry.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(lowerQuery);
      const descMatch = item.description?.toLowerCase().includes(lowerQuery);
      const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
      return titleMatch || descMatch || keywordMatch;
    });
  }, [query]);

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
          element.scrollIntoView({ behavior: "smooth" });
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
          <CommandEmpty>No results found.</CommandEmpty>

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

          {/* Dynamic Results */}
          {shouldFetchDynamic && Object.entries(groupedDynamic).map(([category, items]) => (
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
