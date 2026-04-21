import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skull, Mail, Lock, Sparkles } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password must be less than 128 characters"),
});

const emailOnlySchema = z.object({
  email: z.string().email("Invalid email address").max(255),
});

const passwordOnlySchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

const getRedirectUrl = () => `${window.location.origin}${window.location.pathname}`;

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [mode, setMode] = useState<"auth" | "recovery">("auth");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes — must be set up FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug("[Auth] event:", event);
      if (event === "PASSWORD_RECOVERY") {
        setMode("recovery");
        return;
      }
      if (session && mode !== "recovery") {
        navigate("/");
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && mode !== "recovery") {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password;

    try {
      authSchema.parse({ email: cleanEmail, password: cleanPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Validation error",
          description: "Please check your email and password.",
          variant: "destructive",
        });
      }
      return;
    }

    setLoading(true);
    try {
      console.debug("[Auth] signInWithPassword start", { email: cleanEmail });
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });
      console.debug("[Auth] signInWithPassword result", { hasSession: !!data?.session, error });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login failed",
            description: "Invalid email or password. Please check your credentials.",
            variant: "destructive",
          });
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          toast({
            title: "Email not confirmed",
            description: "Please check your inbox for a confirmation link, or use a magic link to sign in.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      navigate("/");
    } catch (error) {
      console.error("[Auth] signInWithPassword threw", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    const cleanEmail = email.trim();
    try {
      emailOnlySchema.parse({ email: cleanEmail });
    } catch (error) {
      toast({
        title: "Email required",
        description: error instanceof z.ZodError ? error.issues[0].message : "Enter a valid email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { emailRedirectTo: getRedirectUrl() },
      });
      if (error) throw error;
      toast({
        title: "Magic link sent",
        description: `Check ${cleanEmail} for a sign-in link.`,
      });
    } catch (error) {
      console.error("[Auth] signInWithOtp threw", error);
      toast({
        title: "Could not send magic link",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    try {
      emailOnlySchema.parse({ email: cleanEmail });
    } catch (error) {
      toast({
        title: "Email required",
        description: "Enter your email above, then click 'Forgot password?' again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: getRedirectUrl(),
      });
      if (error) throw error;
      toast({
        title: "Reset email sent",
        description: `Check ${cleanEmail} for a password reset link.`,
      });
    } catch (error) {
      console.error("[Auth] resetPasswordForEmail threw", error);
      toast({
        title: "Could not send reset email",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password;

    try {
      authSchema.parse({ email: cleanEmail, password: cleanPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      }
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: { emailRedirectTo: getRedirectUrl() },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
          setActiveTab("login");
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account, then sign in.",
      });
      setActiveTab("login");
      setPassword("");
    } catch (error) {
      console.error("[Auth] signUp threw", error);
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      passwordOnlySchema.parse({ password: newPassword });
    } catch (error) {
      toast({
        title: "Validation error",
        description: error instanceof z.ZodError ? error.issues[0].message : "Invalid password.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please confirm your new password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({
        title: "Password updated",
        description: "You're now signed in with your new password.",
      });
      setMode("auth");
      navigate("/");
    } catch (error) {
      console.error("[Auth] updateUser threw", error);
      toast({
        title: "Could not update password",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-subtle border-border shadow-gothic">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-blood rounded-lg flex items-center justify-center mx-auto mb-4">
            <Skull className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Chronicle Keeper
          </CardTitle>
          <CardDescription>
            {mode === "recovery"
              ? "Set a new password for your account"
              : "Access your Vampire: The Masquerade chronicle"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {mode === "recovery" ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-foreground">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="pl-10 bg-input border-border"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground">Confirm new password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className="pl-10 bg-input border-border"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-blood hover:opacity-90 shadow-crimson"
                disabled={loading}
              >
                {loading ? "Updating..." : "Set new password"}
              </Button>
            </form>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-secondary mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="pl-10 bg-input border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-foreground">Password</Label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pl-10 bg-input border-border"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-blood hover:opacity-90 shadow-crimson"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleMagicLink}
                    disabled={loading}
                    className="w-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Send magic link instead
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="pl-10 bg-input border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password (min. 6 characters)"
                        className="pl-10 bg-input border-border"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-blood hover:opacity-90 shadow-crimson"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
