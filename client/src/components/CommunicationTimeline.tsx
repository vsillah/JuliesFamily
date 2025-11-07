import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Phone, Calendar, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";

interface TimelineItem {
  id: string;
  type: 'email' | 'sms' | 'interaction' | 'email_campaign';
  subType: string;
  timestamp: string | Date;
  content: string;
  metadata: any;
}

interface CommunicationTimelineProps {
  leadId: string;
}

export default function CommunicationTimeline({ leadId }: CommunicationTimelineProps) {
  const { data: timeline = [], isLoading, error } = useQuery<TimelineItem[]>({
    queryKey: ['/api/leads', leadId, 'timeline'],
    retry: 2,
  });

  const getIcon = (type: string, subType: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'email_campaign':
        return <Mail className="w-4 h-4" />;
      case 'interaction':
        if (subType === 'call') return <Phone className="w-4 h-4" />;
        if (subType === 'meeting') return <Calendar className="w-4 h-4" />;
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'text-blue-500';
      case 'sms':
        return 'text-green-500';
      case 'email_campaign':
        return 'text-purple-500';
      case 'interaction':
        return 'text-orange-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (type: string, subType: string, metadata: any) => {
    // For SMS and emails
    if (type === 'sms' || type === 'email') {
      if (subType === 'sent' || subType === 'delivered') {
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {subType}
          </Badge>
        );
      }
      if (subType === 'failed') {
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Failed
          </Badge>
        );
      }
      if (subType === 'queued' || subType === 'pending') {
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {subType}
          </Badge>
        );
      }
    }

    // For email campaigns
    if (type === 'email_campaign') {
      if (subType === 'active') {
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        );
      }
      if (subType === 'completed') {
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Completed
          </Badge>
        );
      }
      if (subType === 'paused') {
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Paused
          </Badge>
        );
      }
    }

    return null;
  };

  const getTypeLabel = (type: string, subType: string) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'sms':
        return 'SMS';
      case 'email_campaign':
        return 'Email Campaign';
      case 'interaction':
        if (subType === 'call') return 'Phone Call';
        if (subType === 'meeting') return 'Meeting';
        if (subType === 'note') return 'Note';
        return 'Interaction';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 animate-spin" />
          <p className="text-sm">Loading communication history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Communications</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Failed to load communication history'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/leads', leadId, 'timeline'] })}
            data-testid="button-retry-timeline"
          >
            <Clock className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (timeline.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No communications yet</h3>
          <p className="text-sm text-muted-foreground">
            Communication history will appear here once you start engaging with this lead
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="communication-timeline">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Communication History</h3>
        <Badge variant="secondary">{timeline.length} interactions</Badge>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-6">
          {timeline.map((item, index) => (
            <div key={item.id} className="relative pl-14" data-testid={`timeline-item-${item.type}`}>
              {/* Icon circle */}
              <div className={`absolute left-0 w-12 h-12 rounded-full border-2 border-background bg-card flex items-center justify-center ${getIconColor(item.type)}`}>
                {getIcon(item.type, item.subType)}
              </div>

              {/* Content card */}
              <Card className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">
                          {getTypeLabel(item.type, item.subType)}
                        </h4>
                        {getStatusBadge(item.type, item.subType, item.metadata)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.timestamp), 'PPp')}
                      </p>
                    </div>
                  </div>

                  {/* Content preview */}
                  {item.content && (
                    <p className="text-sm mt-2 line-clamp-3">
                      {item.content}
                    </p>
                  )}

                  {/* Error message if any */}
                  {item.metadata?.errorMessage && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                      <strong>Error:</strong> {item.metadata.errorMessage}
                    </div>
                  )}

                  {/* Additional metadata */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.type === 'sms' && item.metadata?.recipientPhone && (
                      <Badge variant="outline" className="text-xs">
                        <Phone className="w-3 h-3 mr-1" />
                        {item.metadata.recipientPhone}
                      </Badge>
                    )}
                    {item.type === 'email' && item.metadata?.subject && (
                      <Badge variant="outline" className="text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        {item.metadata.subject}
                      </Badge>
                    )}
                    {item.type === 'email_campaign' && item.metadata?.currentStep !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        Step {item.metadata.currentStep + 1} of {(item.metadata.completedSteps || 0) + 1}+
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
