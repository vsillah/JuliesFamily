import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, LogIn, LogOut, Shield, Camera, Settings, Users } from "lucide-react";
import { usePersona, personaConfigs } from "@/contexts/PersonaContext";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { ObjectUploader } from "@/components/ObjectUploader";
import { AdminPreviewDropdown } from "@/components/AdminPreviewDropdown";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import CloudinaryImage from "@/components/CloudinaryImage";
import { useContentAvailability } from "@/hooks/useContentAvailability";

interface NavigationProps {
  heroImageLoaded?: boolean;
}

export default function Navigation({ heroImageLoaded = true }: NavigationProps) {
  const { persona, setShowPersonaModal } = usePersona();
  const { isAuthenticated, user } = useAuth();
  const { isAdmin, isSuperAdmin } = useUserRole();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const { toast } = useToast();
  const navRef = useState<HTMLElement | null>(null)[0];
  const { data: visibleSections, isLoading: isLoadingVisibility } = useContentAvailability();
  
  // Default to showing all sections while loading to avoid flickering nav
  const sections = visibleSections || {
    services: true,
    events: true,
    testimonials: true,
    impact: true,
    donation: true,
    "lead-magnet": true
  };
  
  const currentPersonaConfig = personaConfigs.find(p => p.id === persona);
  
  // Dynamically measure and sync navigation height to CSS variable
  useEffect(() => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    
    const updateNavHeight = () => {
      const height = nav.offsetHeight;
      document.documentElement.style.setProperty('--nav-height', `${height}px`);
    };
    
    // Initial measurement
    updateNavHeight();
    
    // Watch for size changes
    const observer = new ResizeObserver(updateNavHeight);
    observer.observe(nav);
    
    return () => observer.disconnect();
  }, []);
  
  const handlePhotoUpload = async (uploadToken: string, objectPath?: string) => {
    try {
      const response = await apiRequest("PUT", "/api/profile-photo", {
        uploadToken: uploadToken,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been successfully uploaded.",
      });
      
      setShowUploader(false);
    } catch (error) {
      console.error("Error updating profile photo:", error);
      toast({
        title: "Upload failed",
        description: "There was an error updating your profile photo. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getUserInitials = () => {
    if (!user) return "U";
    const firstInitial = user.firstName?.charAt(0) || "";
    const lastInitial = user.lastName?.charAt(0) || "";
    return (firstInitial + lastInitial).toUpperCase() || "U";
  };

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
      // Get the navigation height from CSS variable
      const navHeight = parseInt(
        getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-height')
          .replace('px', '')
      ) || 0;
      
      // Calculate position with offset for fixed navbar
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - navHeight - 20; // 20px extra padding
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      setMobileMenuOpen(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    setMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-background/95 backdrop-blur-md shadow-sm" 
            : "bg-transparent"
        } ${
          heroImageLoaded ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 1rem)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-20 gap-2 md:gap-4">
            {/* Left: Brand */}
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <button
                onClick={scrollToTop}
                className="cursor-pointer transition-opacity hover:opacity-80"
                aria-label="Scroll to top"
                data-testid="button-logo-scroll-top"
              >
                <CloudinaryImage 
                  name="site-logo"
                  alt="Julie's Family Learning Program Logo" 
                  className="h-9 md:h-12 w-auto"
                  width={120}
                  quality="auto:best"
                  loading="eager"
                />
              </button>
              <div className="hidden xl:block">
                <h1 className={`text-sm font-serif font-semibold transition-colors duration-300 leading-tight whitespace-nowrap ${
                  isScrolled ? "text-primary" : "text-white"
                }`}>
                  Julie's Family<br />Learning Program
                </h1>
              </div>
            </div>

            {/* Center: Primary Navigation */}
            <nav className="hidden md:flex items-center gap-4 flex-1 justify-evenly px-4 md:px-6 lg:px-8 overflow-hidden">
              {sections.services && (
                <button
                  onClick={() => scrollToSection("services")}
                  className={`text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-services"
                >
                  Services
                </button>
              )}
              {sections["lead-magnet"] && (
                <button
                  onClick={() => scrollToSection("lead-magnet")}
                  className={`text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-lead-magnet"
                >
                  Resources
                </button>
              )}
              {sections.impact && (
                <button
                  onClick={() => scrollToSection("impact")}
                  className={`text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-impact"
                >
                  Impact
                </button>
              )}
              {sections.testimonials && (
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className={`text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-testimonials"
                >
                  Testimonials
                </button>
              )}
              {sections.events && (
                <button
                  onClick={() => scrollToSection("events")}
                  className={`text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-events"
                >
                  Events
                </button>
              )}
              {sections.donation && (
                <button
                  onClick={() => scrollToSection("donation")}
                  className={`text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-donation"
                >
                  Support Us
                </button>
              )}
              <Link 
                href="/virtual-tour"
                className={`text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                  isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                }`}
                data-testid="link-virtual-tour"
              >
                Virtual Tour
              </Link>
            </nav>

            {/* Right: Utilities */}
            <div className="hidden md:flex items-center gap-1.5 justify-end flex-shrink-0">
              <Link href="/donate">
                <Button variant="default" data-testid="button-donate">
                  Donate
                </Button>
              </Link>
              
              {isAdmin && (
                <AdminPreviewDropdown isScrolled={isScrolled} />
              )}
              
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="relative group cursor-pointer">
                      <Avatar 
                        className="h-9 w-9 border-2 border-transparent group-hover:border-primary transition-colors"
                        data-testid="button-profile-menu"
                      >
                        {user.profileImageUrl ? (
                          <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                        ) : null}
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      {user.firstName} {user.lastName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer" data-testid="menu-profile-settings">
                        <User className="w-4 h-4 mr-2" />
                        Profile Settings
                      </DropdownMenuItem>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin">
                        <DropdownMenuItem className="cursor-pointer" data-testid="menu-admin-dashboard">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => window.location.href = '/api/logout'}
                      data-testid="menu-logout"
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/api/login'}
                  data-testid="button-login"
                  className={isScrolled ? "" : "border-white/30 text-white hover:bg-white/10"}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile: Inline Priority Links */}
            <div className="md:hidden flex items-center gap-1 justify-end overflow-x-auto max-w-[60vw] scrollbar-hide">
              {sections.services && (
                <button
                  onClick={() => scrollToSection("services")}
                  className={`text-xs font-medium transition-colors duration-300 px-2 py-3 min-h-[44px] whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-services-mobile-inline"
                >
                  Services
                </button>
              )}
              {sections["lead-magnet"] && (
                <button
                  onClick={() => scrollToSection("lead-magnet")}
                  className={`text-xs font-medium transition-colors duration-300 px-2 py-3 min-h-[44px] whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-lead-magnet-mobile-inline"
                >
                  Resources
                </button>
              )}
              {sections.impact && (
                <button
                  onClick={() => scrollToSection("impact")}
                  className={`text-xs font-medium transition-colors duration-300 px-2 py-3 min-h-[44px] whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-impact-mobile-inline"
                >
                  Impact
                </button>
              )}
              {sections.testimonials && (
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className={`text-xs font-medium transition-colors duration-300 px-2 py-3 min-h-[44px] whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-testimonials-mobile-inline"
                >
                  Testimonials
                </button>
              )}
              {sections.events && (
                <button
                  onClick={() => scrollToSection("events")}
                  className={`text-xs font-medium transition-colors duration-300 px-2 py-3 min-h-[44px] whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-events-mobile-inline"
                >
                  Events
                </button>
              )}
              {sections.donation && (
                <button
                  onClick={() => scrollToSection("donation")}
                  className={`text-xs font-medium transition-colors duration-300 px-2 py-3 min-h-[44px] whitespace-nowrap ${
                    isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                  }`}
                  data-testid="link-donation-mobile-inline"
                >
                  Support
                </button>
              )}
              <Link href="/donate">
                <button
                  className={`text-xs font-semibold transition-colors duration-300 px-2 py-3 min-h-[44px] whitespace-nowrap border-l pl-3 ${
                    isScrolled ? "text-primary hover:text-primary/80 border-foreground/20" : "text-white hover:text-white/80 border-white/20"
                  }`}
                  data-testid="button-donate-mobile-inline"
                >
                  Donate
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden transition-colors duration-300 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center ${
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
      {mobileMenuOpen && createPortal(
        <div 
          className="fixed inset-0 z-[1000] bg-background/95 backdrop-blur-sm md:hidden"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 1rem)'
          }}
        >
          {/* Close Button - Fixed to top right */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 text-foreground hover:text-primary transition-colors z-10"
            data-testid="button-mobile-menu-close"
            aria-label="Close menu"
          >
            <X size={28} />
          </button>
          
          <div className="flex flex-col items-center gap-6 p-8 pt-16">
            {isAuthenticated && user && (
              <div className="flex flex-col items-center gap-3 mb-4">
                <span className="text-sm text-foreground">
                  Hello, {user.firstName || "there"}!
                </span>
                <div className="relative group">
                  <Avatar 
                    className="cursor-pointer h-16 w-16 border-2 border-transparent group-hover:border-primary transition-colors"
                    onClick={() => {
                      setShowUploader(true);
                      setMobileMenuOpen(false);
                    }}
                    data-testid="button-profile-photo-mobile"
                  >
                    {user.profileImageUrl ? (
                      <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                    <Camera className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>
            )}
            {sections.services && (
              <button
                onClick={() => scrollToSection("services")}
                className="text-lg text-foreground hover:text-primary transition-colors"
                data-testid="link-services-mobile"
              >
                Our Services
              </button>
            )}
            {sections["lead-magnet"] && (
              <button
                onClick={() => scrollToSection("lead-magnet")}
                className="text-lg text-foreground hover:text-primary transition-colors"
                data-testid="link-lead-magnet-mobile"
              >
                Resources
              </button>
            )}
            {sections.impact && (
              <button
                onClick={() => scrollToSection("impact")}
                className="text-lg text-foreground hover:text-primary transition-colors"
                data-testid="link-impact-mobile"
              >
                Our Impact
              </button>
            )}
            {sections.testimonials && (
              <button
                onClick={() => scrollToSection("testimonials")}
                className="text-lg text-foreground hover:text-primary transition-colors"
                data-testid="link-testimonials-mobile"
              >
                Testimonials
              </button>
            )}
            {sections.events && (
              <button
                onClick={() => scrollToSection("events")}
                className="text-lg text-foreground hover:text-primary transition-colors"
                data-testid="link-events-mobile"
              >
                Events
              </button>
            )}
            {sections.donation && (
              <button
                onClick={() => scrollToSection("donation")}
                className="text-lg text-foreground hover:text-primary transition-colors"
                data-testid="link-donation-mobile"
              >
                Support Us
              </button>
            )}
            <Link 
              href="/virtual-tour"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg text-foreground hover:text-primary transition-colors"
              data-testid="link-virtual-tour-mobile"
            >
              Virtual Tour
            </Link>
            {isAdmin && (
              <div className="w-full flex justify-center">
                <AdminPreviewDropdown isScrolled={true} />
              </div>
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
        </div>,
        document.body
      )}
      
      {/* Profile Photo Uploader Modal */}
      {isAuthenticated && (
        <ObjectUploader
          open={showUploader}
          onClose={() => setShowUploader(false)}
          onUploadComplete={handlePhotoUpload}
          acceptedFileTypes={["image/*"]}
          maxFileSize={10 * 1024 * 1024}
          maxNumberOfFiles={1}
          enableAiNaming={false}
        />
      )}
    </>
  );
}
