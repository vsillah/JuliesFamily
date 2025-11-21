import { Mail, Phone, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/contexts/OrganizationContext";
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

  // Use organization contact info if available, otherwise fall back to metadata
  const contactPersonName = currentOrg?.contactPersonName || null;
  const contactEmail = currentOrg?.contactEmail || metadata.contact.email;
  const contactPhone = metadata.contact.phone;
  const contactAddress = metadata.contact.address;

  // Show footer even while content is loading if we have organization data
  // This ensures contact info from organization is always visible
  const shouldRender = !isLoading || currentOrg;
  
  if (!shouldRender) {
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
              {contactPersonName && (
                <li className="flex items-start gap-2 text-muted-foreground">
                  <span className="font-medium text-foreground" data-testid="text-footer-contact-person">
                    {contactPersonName}
                  </span>
                </li>
              )}
              {contactAddress && (
                <li className="flex items-start gap-2 text-muted-foreground">
                  <MapPin size={16} className="mt-1 flex-shrink-0" />
                  <span 
                    style={{ whiteSpace: 'pre-line' }}
                    data-testid="text-footer-address"
                  >
                    {contactAddress}
                  </span>
                </li>
              )}
              {contactPhone && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={16} className="flex-shrink-0" />
                  <a 
                    href={`tel:${contactPhone.replace(/\D/g, '')}`} 
                    className="hover:text-primary transition-colors"
                    data-testid="link-footer-phone"
                  >
                    {contactPhone}
                  </a>
                </li>
              )}
              {contactEmail && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={16} className="flex-shrink-0" />
                  <a 
                    href={`mailto:${contactEmail}`} 
                    className="hover:text-primary transition-colors"
                    data-testid="link-footer-email"
                  >
                    {contactEmail}
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
