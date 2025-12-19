import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProfileSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, MapPin, Activity, User, Camera } from "lucide-react";

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [redirect, setRedirect] = useState(false);

  // Extend schema to make fields required for onboarding
  const formSchema = insertProfileSchema.omit({ userId: true, photoUrl: true }).extend({
      utrRating: insertProfileSchema.shape.utrRating.min(1, "UTR must be at least 1").max(16.5, "UTR cannot exceed 16.5"),
      bio: insertProfileSchema.shape.bio.min(10, "Bio must be at least 10 characters"),
      location: insertProfileSchema.shape.location.min(3, "Location is required"),
      playStyle: insertProfileSchema.shape.playStyle.min(3, "Play style is required"),
      photoUrl: insertProfileSchema.shape.photoUrl.optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      utrRating: 0,
      bio: "",
      location: "",
      playStyle: "",
      availability: "",
      photoUrl: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      // In a real app, you'd check if profile exists first, but here we assume if they are on onboarding they need to create/update
      // We'll use the update endpoint which does upsert logic in our storage implementation
      const res = await apiRequest("PUT", "/api/profiles", values);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
      toast({
        title: "Profile Created!",
        description: "Welcome to JuniorHit. Let's find some partners!",
      });
      setRedirect(true);
    },
    onError: (error: any) => {
        toast({
            title: "Error",
            description: error.message || "Failed to create profile",
            variant: "destructive"
        });
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Redirect to="/" />;
  if (redirect) return <Redirect to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-primary/10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-display font-bold text-primary">Create Your Profile</CardTitle>
          <CardDescription className="text-lg">
            Tell us about your tennis journey to find the best hitting partners.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="utrRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Trophy className="w-4 h-4" /> UTR Rating</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            step="0.1" 
                            min="1" 
                            max="16.5" 
                            placeholder="e.g. 7.5" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="playStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Activity className="w-4 h-4" /> Play Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="aggressive_baseliner">Aggressive Baseliner</SelectItem>
                        <SelectItem value="counter_puncher">Counter Puncher</SelectItem>
                        <SelectItem value="serve_and_volley">Serve and Volley</SelectItem>
                        <SelectItem value="all_court">All Court Player</SelectItem>
                        <SelectItem value="pusher">Consistency / Pusher</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio & Goals</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell others about your tennis background, what you're working on, and what kind of hitting practice you prefer." 
                        className="h-24" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Camera className="w-4 h-4" /> Profile Photo URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/my-photo.jpg" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <Button type="submit" className="w-full text-lg h-12 mt-6" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating Profile..." : "Complete Setup & Enter App"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
