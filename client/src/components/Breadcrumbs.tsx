import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  variant?: 'light' | 'dark';
}

export default function Breadcrumbs({ items, variant = 'light' }: BreadcrumbsProps) {
  const isDark = variant === 'dark';
  const baseColor = isDark ? "text-white/70" : "text-muted-foreground";
  const hoverColor = isDark ? "hover:text-white" : "hover:text-foreground";
  const activeColor = isDark ? "text-white" : "text-foreground";
  
  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link 
        href="/" 
        className={`flex items-center gap-1 ${baseColor} ${hoverColor} transition-colors`}
        data-testid="breadcrumb-home"
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className={`w-4 h-4 ${baseColor}`} />
            {item.href && !isLast ? (
              <Link 
                href={item.href}
                className={`${baseColor} ${hoverColor} transition-colors`}
                data-testid={`breadcrumb-${index}`}
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? `${activeColor} font-medium` : baseColor} data-testid={`breadcrumb-${index}`}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
