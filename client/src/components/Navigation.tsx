import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Menu, X, User, LogIn, LogOut, Shield, Camera } from "lucide-react";
import { usePersona, personaConfigs } from "@/contexts/PersonaContext";
import { useAuth } from "@/hooks/useAuth";
import { ObjectUploader } from "@/components/ObjectUploader";
import { AdminPersonaSwitcher } from "@/components/AdminPersonaSwitcher";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import CloudinaryImage from "@/components/CloudinaryImage";

export default function Navigation() {
  const { persona, setShowPersonaModal } = usePersona();
  const { isAuthenticated, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const { toast } = useToast();
  
  const currentPersonaConfig = personaConfigs.find(p => p.id === persona);
  
  const handlePhotoUpload = async (uploadToken: string) => {
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
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-background/95 backdrop-blur-md shadow-sm" 
            : "bg-black/60 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-8">
            {/* Left: Brand */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <CloudinaryImage 
                name="site-logo"
                alt="Julie's Family Learning Program Logo" 
                className="h-12 w-auto"
                width={120}
                quality="auto:best"
                loading="eager"
              />
              <div className="hidden lg:block">
                <h1 className={`text-lg font-serif font-semibold transition-colors duration-300 leading-tight ${
                  isScrolled ? "text-primary" : "text-white"
                }`}>
                  Julie's Family<br />Learning Program
                </h1>
              </div>
            </div>

            {/* Center: Primary Navigation */}
            <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
              <button
                onClick={() => scrollToSection("services")}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                }`}
                data-testid="link-services"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("impact")}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                }`}
                data-testid="link-impact"
              >
                Impact
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                }`}
                data-testid="link-testimonials"
              >
                Testimonials
              </button>
              <button
                onClick={() => scrollToSection("events")}
                className={`text-sm font-medium transition-colors duration-300 ${
                  isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                }`}
                data-testid="link-events"
              >
                Events
              </button>
              <Link 
                href="/virtual-tour"
                className={`text-sm font-medium transition-colors duration-300 ${
                  isScrolled ? "text-foreground hover:text-primary" : "text-white/90 hover:text-white"
                }`}
                data-testid="link-virtual-tour"
              >
                Virtual Tour
              </Link>
            </nav>

            {/* Right: Utilities */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/donate">
                <Button variant="default" size="sm" data-testid="button-donate">
                  Donate
                </Button>
              </Link>
              {currentPersonaConfig && (
                <button
                  onClick={() => setShowPersonaModal(true)}
                  data-testid="button-change-persona"
                  title="Change your experience"
                >
                  <Badge variant="secondary" className="cursor-pointer hover-elevate text-xs">
                    <User className="w-3 h-3 mr-1" />
                    {currentPersonaConfig.label}
                  </Badge>
                </button>
              )}
              
              {user?.isAdmin && (
                <>
                  <AdminPersonaSwitcher isScrolled={isScrolled} />
                  <Link href="/admin">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      data-testid="button-admin-dashboard"
                      className={isScrolled ? "" : "text-white hover:bg-white/10"}
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                  </Link>
                </>
              )}
              
              {isAuthenticated && user ? (
                <>
                  <div className="relative group">
                    <Avatar 
                      className="cursor-pointer h-9 w-9 border-2 border-transparent group-hover:border-primary transition-colors"
                      onClick={() => setShowUploader(true)}
                      data-testid="button-profile-photo"
                      title={`${user.firstName || "User"} - Click to update photo`}
                    >
                      {user.profileImageUrl ? (
                        <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                      ) : null}
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-3 h-3 text-primary" />
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.location.href = '/api/logout'}
                    data-testid="button-logout"
                    className={isScrolled ? "" : "text-white hover:bg-white/10"}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
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

            {/* Mobile Menu Button */}
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
            <Link 
              href="/virtual-tour"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg text-foreground hover:text-primary transition-colors"
              data-testid="link-virtual-tour-mobile"
            >
              Virtual Tour
            </Link>
            <Link href="/donate" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="default" size="lg" className="w-full" data-testid="button-donate-mobile">
                Donate Now
              </Button>
            </Link>
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
            {user?.isAdmin && (
              <>
                <div className="w-full flex justify-center">
                  <AdminPersonaSwitcher 
                    isScrolled={true} 
                    onOpenDialog={() => setMobileMenuOpen(false)}
                  />
                </div>
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="lg" data-testid="button-admin-dashboard-mobile">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              </>
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
      
      {/* Profile Photo Uploader Modal */}
      {isAuthenticated && (
        <ObjectUploader
          open={showUploader}
          onClose={() => setShowUploader(false)}
          onUploadComplete={handlePhotoUpload}
          acceptedFileTypes={["image/*"]}
          maxFileSize={10 * 1024 * 1024}
          maxNumberOfFiles={1}
        />
      )}
    </>
  );
}
