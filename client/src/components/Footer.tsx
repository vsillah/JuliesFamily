import { Mail, Phone, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/lib/organizationContext";
import type { ContentItem, FooterSectionMetadata } from "@shared/schema";

export default function Footer() {
  const { currentOrg } = useOrganization();

  // Fetch footer section from database
  const { data: footerDataArray = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/content/type/footer_section', { orgId: currentOrg?.organizationId || 'default' }],
  });

  // Get the first (and only) footer section for this org
  const footerData = footerDataArray[0];

  // Parse metadata and provide fallback
  const metadata = (footerData?.metadata as FooterSectionMetadata) || {
    organizationName: "Organization Name",
    tagline: "Empowering communities through service.",
    quickLinks: [],
    programs: [],
    contact: {
      address: "",
      phone: "",
      email: ""
    },
    copyrightText: "All rights reserved."
  };

  // Don't render if loading or no data
  if (isLoading || !footerData) {
    return null;
  }

  return (
    <footer className="bg-card border-t border-card-border" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-serif font-semibold mb-4" data-testid="text-footer-org-name">
              {metadata.organizationName}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-footer-tagline">
              {metadata.tagline}
            </p>
          </div>

          {metadata.quickLinks.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4" data-testid="text-footer-quick-links-heading">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                {metadata.quickLinks.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.href} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                      data-testid={`link-footer-quick-${index}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {metadata.programs.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4" data-testid="text-footer-programs-heading">Programs</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {metadata.programs.map((program, index) => (
                  <li key={index} data-testid={`text-footer-program-${index}`}>
                    {program}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-4" data-testid="text-footer-contact-heading">Contact</h4>
            <ul className="space-y-3 text-sm">
              {metadata.contact.address && (
                <li className="flex items-start gap-2 text-muted-foreground">
                  <MapPin size={16} className="mt-1 flex-shrink-0" />
                  <span 
                    style={{ whiteSpace: 'pre-line' }}
                    data-testid="text-footer-address"
                  >
                    {metadata.contact.address}
                  </span>
                </li>
              )}
              {metadata.contact.phone && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={16} className="flex-shrink-0" />
                  <a 
                    href={`tel:${metadata.contact.phone.replace(/\D/g, '')}`} 
                    className="hover:text-primary transition-colors"
                    data-testid="link-footer-phone"
                  >
                    {metadata.contact.phone}
                  </a>
                </li>
              )}
              {metadata.contact.email && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={16} className="flex-shrink-0" />
                  <a 
                    href={`mailto:${metadata.contact.email}`} 
                    className="hover:text-primary transition-colors"
                    data-testid="link-footer-email"
                  >
                    {metadata.contact.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-card-border text-center text-sm text-muted-foreground">
          <p data-testid="text-footer-copyright">
            &copy; {new Date().getFullYear()} {metadata.copyrightText}
          </p>
          <p className="mt-2">
            Powered by{" "}
            <a href="/product" className="text-primary hover:underline" data-testid="link-footer-kinflo">
              Kinflo
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
