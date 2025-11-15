
import { Mail, Phone } from "lucide-react";

export default function ProductFooter() {
  return (
    <footer className="bg-card border-t border-card-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-serif font-semibold mb-4">
              Kinflo
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered nonprofit CRM and fundraising platform designed to help organizations maximize their impact.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#demo-section" className="text-muted-foreground hover:text-primary transition-colors">
                  Demo
                </a>
              </li>
              <li>
                <a href="/api/login?returnTo=/my-campaigns" className="text-muted-foreground hover:text-primary transition-colors">
                  Sign In
                </a>
              </li>
              <li>
                <a href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Live Example (JFLP)
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Solutions</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Donor Management</li>
              <li>Campaign Tracking</li>
              <li>AI Content Generation</li>
              <li>Email & SMS Automation</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <Phone size={16} className="mt-1 flex-shrink-0" />
                <span>Vambah Sillah</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone size={16} className="flex-shrink-0" />
                <a href="tel:+16179677448" className="hover:text-primary transition-colors">
                  (617) 967-7448
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail size={16} className="flex-shrink-0" />
                <a href="mailto:vsillah@gmail.com" className="hover:text-primary transition-colors">
                  vsillah@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-card-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Kinflo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
