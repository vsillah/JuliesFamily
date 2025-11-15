import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-card-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-serif font-semibold mb-4">
              Julie's Family Learning Program
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering families through education, support, and community connections since 1992.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#services" className="text-muted-foreground hover:text-primary transition-colors">
                  Our Programs
                </a>
              </li>
              <li>
                <a href="#impact" className="text-muted-foreground hover:text-primary transition-colors">
                  Our Impact
                </a>
              </li>
              <li>
                <a href="#events" className="text-muted-foreground hover:text-primary transition-colors">
                  Events
                </a>
              </li>
              <li>
                <a href="#donation" className="text-muted-foreground hover:text-primary transition-colors">
                  Donate
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Programs</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Adult Education</li>
              <li>Children's Services</li>
              <li>Family Development</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>1 Pleasant Street<br />Framingham, MA 01701</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone size={16} className="flex-shrink-0" />
                <a href="tel:+15088797610" className="hover:text-primary transition-colors">
                  (508) 879-7610
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail size={16} className="flex-shrink-0" />
                <a href="mailto:info@juliesfamily.org" className="hover:text-primary transition-colors">
                  info@juliesfamily.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-card-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Julie's Family Learning Program. All rights reserved.</p>
          <p className="mt-2">
            Powered by{" "}
            <a href="/product" className="text-primary hover:underline">
              Kinflo
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
