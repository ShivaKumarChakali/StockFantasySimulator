import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { Loader2 } from "lucide-react";

interface College {
  id: string;
  name: string;
  city: string | null;
}

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  collegeId: z.string().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const { signUp, signInWithGoogle } = useAuth();

  const { data: colleges = [] } = useQuery<College[]>({
    queryKey: ["/api/colleges"],
  });

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      collegeId: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    try {
      setError("");
      await signUp(values.email, values.password, values.username, values.collegeId);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setError("");
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google sign-up failed. Please try again.");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex-shrink-0 p-4 md:p-6 border-b border-border bg-card">
        <h1 className="text-xl md:text-2xl font-bold">Create Account</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">Join the stock trading challenge</p>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md mx-auto">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Choose a username" {...field} data-testid="input-username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your@email.com" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} data-testid="input-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collegeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College</FormLabel>
                  <select
                    {...field}
                    className="w-full px-3 py-2 min-h-[44px] border border-input rounded-md bg-background text-sm"
                    data-testid="select-college"
                  >
                    <option value="">Select your college</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full min-h-[44px]"
              size="lg"
              disabled={form.formState.isSubmitting}
              data-testid="button-signup"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={handleGoogleSignUp}
              disabled={form.formState.isSubmitting}
              data-testid="button-google-signup"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign up with Google
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full min-h-[44px]"
              onClick={() => setLocation("/")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
