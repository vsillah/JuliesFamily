import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logo from "@assets/image_1762053021045.png";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0 flex items-center gap-3">
              <img 
                src={logo} 
                alt="Julie's Family Learning Program Logo" 
                className="h-12 w-auto"
                data-testid="img-logo"
              />
              <h1 className="text-xl sm:text-2xl font-serif font-semibold text-[#ffd780]">
                Julie's Family Learning Program
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("services")}
                className="text-foreground hover:text-primary transition-colors"
                data-testid="link-services"
              >
                Our Services
              </button>
              <button
                onClick={() => scrollToSection("impact")}
                className="hover:text-primary transition-colors text-[#ffd780]"
                data-testid="link-impact"
              >
                Our Impact
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="hover:text-primary transition-colors text-[#ffd780]"
                data-testid="link-testimonials"
              >
                Testimonials
              </button>
              <button
                onClick={() => scrollToSection("events")}
                className="text-foreground hover:text-primary transition-colors"
                data-testid="link-events"
              >
                Events
              </button>
              <Button variant="default" size="default" data-testid="button-donate">
                Donate Now
              </Button>
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background md:hidden pt-20">
          <div className="flex flex-col items-center gap-6 p-8">
            <button
              onClick={() => scrollToSection("services")}
              className="text-lg text-foreground hover:text-primary transition-colors"
              data-testid="link-services-mobile"
            >
              Our Services
            </button>
            <button
              onClick={() => scrollToSection("impact")}
              className="text-lg text-foreground hover:text-primary transition-colors"
              data-testid="link-impact-mobile"
            >
              Our Impact
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="text-lg text-foreground hover:text-primary transition-colors"
              data-testid="link-testimonials-mobile"
            >
              Testimonials
            </button>
            <button
              onClick={() => scrollToSection("events")}
              className="text-lg text-foreground hover:text-primary transition-colors"
              data-testid="link-events-mobile"
            >
              Events
            </button>
            <Button variant="default" size="lg" data-testid="button-donate-mobile">
              Donate Now
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
