import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateUserProfileSchema } from "@shared/schema";
import type { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

type ProfileFormValues = z.infer<typeof updateUserProfileSchema>;

export default function Profile() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch current user data
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Initialize form with empty defaults
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      profileImageUrl: "",
    },
  });

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profileImageUrl: user.profileImageUrl || "",
      });
    }
  }, [user, form]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    updateProfileMutation.mutate(data);
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const firstInitial = user.firstName?.[0] || "";
    const lastInitial = user.lastName?.[0] || "";
    return (firstInitial + lastInitial).toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>Please log in to view your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" data-testid="button-login">
              <a href="/api/login">Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Profile Settings</CardTitle>
            <CardDescription>
              Update your personal information and profile photo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-2 border-border">
                {user.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Profile Photo</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Update your profile photo from the navigation menu.
                </p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter your first name"
                          data-testid="input-firstname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter your last name"
                          data-testid="input-lastname"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (user) {
                        form.reset({
                          firstName: user.firstName || "",
                          lastName: user.lastName || "",
                          profileImageUrl: user.profileImageUrl || "",
                        });
                      }
                    }}
                    disabled={isSubmitting || !form.formState.isDirty}
                    data-testid="button-reset"
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.formState.isDirty}
                    data-testid="button-save-profile"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
