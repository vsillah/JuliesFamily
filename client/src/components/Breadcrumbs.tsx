import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link href="/">
        <a className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors" data-testid="breadcrumb-home">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </a>
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            {item.href && !isLast ? (
              <Link href={item.href}>
                <a className="text-muted-foreground hover:text-foreground transition-colors" data-testid={`breadcrumb-${index}`}>
                  {item.label}
                </a>
              </Link>
            ) : (
              <span className={isLast ? "text-foreground font-medium" : "text-muted-foreground"} data-testid={`breadcrumb-${index}`}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
