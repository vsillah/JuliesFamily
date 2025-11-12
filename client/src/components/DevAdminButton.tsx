import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DevAdminButton() {
  const [isGranting, setIsGranting] = useState(false);
  const { toast } = useToast();

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const grantAdminAccess = async () => {
    setIsGranting(true);
    try {
      const response = await fetch('/api/test/set-user-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'super_admin' }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to grant admin access');
      }

      const data = await response.json();
      
      toast({
        title: "Admin Access Granted!",
        description: `You now have ${data.user.role} privileges. Refreshing page...`,
      });

      // Reload to apply new permissions
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Grant Admin Access",
        description: error.message || "Please make sure you're logged in first.",
      });
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={grantAdminAccess}
      disabled={isGranting}
      className="gap-2 border-dashed"
      data-testid="button-grant-admin-dev"
    >
      {isGranting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Shield className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">
        {isGranting ? "Granting..." : "DEV: Grant Admin"}
      </span>
      <span className="sm:hidden">
        {isGranting ? "..." : "Admin"}
      </span>
    </Button>
  );
}
