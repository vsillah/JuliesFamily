import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, User, LogIn, LogOut } from "lucide-react";
import { usePersona, personaConfigs } from "@/contexts/PersonaContext";
import { useAuth } from "@/hooks/useAuth";
import logo from "@assets/image_1762053021045.png";

export default function Navigation() {
  const { persona, setShowPersonaModal } = usePersona();
  const { isAuthenticated, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const currentPersonaConfig = personaConfigs.find(p => p.id === persona);

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
              <h1 className={`text-xl sm:text-2xl font-serif font-semibold transition-colors duration-300 ${
                isScrolled ? "text-primary" : "text-white"
              }`}>
                Julie's Family Learning Program
              </h1>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection("services")}
                className={`transition-colors duration-300 ${
                  isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                }`}
                data-testid="link-services"
              >
                Our Services
              </button>
              <button
                onClick={() => scrollToSection("impact")}
                className={`transition-colors duration-300 ${
                  isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                }`}
                data-testid="link-impact"
              >
                Our Impact
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className={`transition-colors duration-300 ${
                  isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                }`}
                data-testid="link-testimonials"
              >
                Testimonials
              </button>
              <button
                onClick={() => scrollToSection("events")}
                className={`transition-colors duration-300 ${
                  isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                }`}
                data-testid="link-events"
              >
                Events
              </button>
              {currentPersonaConfig && (
                <button
                  onClick={() => setShowPersonaModal(true)}
                  className="flex items-center gap-2"
                  data-testid="button-change-persona"
                  title="Change your experience"
                >
                  <Badge variant="secondary" className="cursor-pointer hover-elevate">
                    <User className="w-3 h-3 mr-1" />
                    {currentPersonaConfig.label}
                  </Badge>
                </button>
              )}
              <Button variant="default" size="default" data-testid="button-donate">
                Donate Now
              </Button>
              {isAuthenticated ? (
                <Button 
                  variant="outline" 
                  size="default" 
                  onClick={() => window.location.href = '/api/logout'}
                  data-testid="button-logout"
                  className={isScrolled ? "" : "border-white/30 text-white hover:bg-white/10"}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="default" 
                  onClick={() => window.location.href = '/api/login'}
                  data-testid="button-login"
                  className={isScrolled ? "" : "border-white/30 text-white hover:bg-white/10"}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>

            <button
              className={`md:hidden transition-colors duration-300 ${
                isScrolled ? "text-foreground" : "text-white"
              }`}
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
            {currentPersonaConfig && (
              <Badge variant="secondary" className="mb-2">
                <User className="w-3 h-3 mr-1" />
                Viewing as: {currentPersonaConfig.label}
              </Badge>
            )}
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
            {currentPersonaConfig && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowPersonaModal(true);
                  setMobileMenuOpen(false);
                }}
                data-testid="button-change-persona-mobile"
              >
                Change Experience
              </Button>
            )}
            {isAuthenticated ? (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout-mobile"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-login-mobile"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
