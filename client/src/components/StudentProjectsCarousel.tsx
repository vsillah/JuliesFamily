import { useQuery } from '@tanstack/react-query';
import type { ContentItem } from '@shared/schema';
import { BookOpen, Award, FileText } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { usePersona } from '@/contexts/PersonaContext';
import { ContentCarousel } from './ContentCarousel';

interface StudentProjectMetadata {
  submittingUserName?: string;
  programId?: string;
  files?: Array<{ url: string; alt?: string; uploadedAt?: string }>;
  status?: 'pending' | 'approved' | 'rejected';
}

export function StudentProjectsCarousel() {
  const { persona, funnelStage, passions } = usePersona();
  
  // Only show for donor persona (this content is specifically for donors)
  if (persona !== 'donor') {
    return null;
  }
  
  // Normalize passions to string array (passions can be string[] or PassionOption[])
  const passionIds = passions?.map(p => typeof p === 'string' ? p : p.id) || [];
  
  // Debug logging
  console.log('[StudentProjectsCarousel] Debug:', {
    persona,
    funnelStage,
    passionsRaw: passions,
    passionIds,
    passionIdsLength: passionIds.length
  });
  
  // Fetch student projects with server-side passion filtering
  const { data: projects, isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/content/visible/student_project', { persona, funnelStage }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (persona) params.append('persona', persona);
      if (funnelStage) params.append('funnelStage', funnelStage);
      // Note: passions are automatically pulled from user profile on backend
      
      const res = await fetch(`/api/content/visible/student_project?${params}`);
      if (!res.ok) throw new Error('Failed to fetch student projects');
      return res.json();
    },
  });

  // Get the passion tag label for display
  const getPassionLabel = (tag: string) => {
    const labels: Record<string, string> = {
      literacy: 'Literacy',
      stem: 'STEM',
      arts: 'Arts',
      nutrition: 'Nutrition',
      community: 'Community',
    };
    return labels[tag] || tag;
  };

  // Render a single project card
  const renderProjectCard = (project: ContentItem) => {
    const metadata = (project.metadata as StudentProjectMetadata) || {};
    const projectPassions = project.passionTags || [];
    
    // Calculate matching passions for display
    const userPassionSet = new Set(passionIds);
    const matchingPassions = projectPassions.filter(tag => 
      userPassionSet.has(tag)
    );
    
    // Debug first project
    if (projects && projects[0]?.id === project.id) {
      console.log('[StudentProjectsCarousel] First project debug:', {
        projectId: project.id,
        projectTitle: project.title,
        projectPassions,
        userPassionSet: Array.from(userPassionSet),
        matchingPassions
      });
    }

    return (
      <Card 
        className="h-full flex flex-col hover-elevate" 
        data-testid={`project-card-${project.id}`}
      >
        <CardHeader className="space-y-3">
          {/* Project Title */}
          <div className="flex items-start gap-2">
            <BookOpen className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <h3 
              className="font-semibold text-xl leading-tight" 
              data-testid={`project-title-${project.id}`}
            >
              {project.title}
            </h3>
          </div>
          
          {/* Student Name */}
          {metadata.submittingUserName && (
            <p className="text-sm text-muted-foreground">
              by {metadata.submittingUserName}
            </p>
          )}

          {/* Matching Passion Tags */}
          {matchingPassions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {matchingPassions.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="text-xs"
                  data-testid={`passion-badge-${tag}`}
                >
                  {getPassionLabel(tag)}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1">
          {/* Description */}
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-4">
              {project.description}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-4 border-t">
          {/* View Project Button */}
          {metadata.files && metadata.files.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full"
              asChild
              data-testid={`button-view-project-${project.id}`}
            >
              <a 
                href={metadata.files[0].url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Project
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <ContentCarousel
      items={projects || []}
      renderItem={renderProjectCard}
      getItemKey={(project) => project.id}
      title="Student Projects"
      subtitle="See amazing work from our students, matched to your interests"
      icon={<Award className="w-8 h-8 text-primary" />}
      isLoading={isLoading}
      loadingMessage="Loading projects..."
      testIdPrefix="student-projects"
      className="py-16 px-4 bg-gradient-to-b from-background to-muted/20"
      footer={
        passionIds.length > 0 && projects && projects.length > 0 ? (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Showing {projects.length} {projects.length === 1 ? 'project' : 'projects'} matching your interests: {' '}
              <span className="font-medium text-foreground">
                {passionIds.map(id => getPassionLabel(id)).join(', ')}
              </span>
            </p>
          </div>
        ) : undefined
      }
    />
  );
}
