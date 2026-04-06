import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoggingIn, user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const verified = params.get("verified") === "1";
  const tokenError = params.get("error");

  const tokenErrorMessage =
    tokenError === "token-expired"
      ? "This verification link has expired. Please sign up again."
      : tokenError === "invalid-token" || tokenError === "verification-failed"
      ? "This verification link is invalid or has already been used."
      : null;

  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login({ email, password });
      navigate("/");
    } catch (err: any) {
      const message = err?.message || "Something went wrong";
      try {
        const parsed = JSON.parse(message.split(": ").slice(1).join(": "));
        setError(parsed.message || message);
      } catch {
        setError(message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Trophy className="w-10 h-10 text-primary" />
          <span className="font-display font-bold text-3xl text-primary">CourtMatch</span>
        </div>

        {verified && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Email verified! You can now sign in.
          </div>
        )}
        {tokenErrorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {tokenErrorMessage}
          </div>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle data-testid="auth-title">Welcome Back</CardTitle>
            <CardDescription>Sign in to find hitting partners</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center" data-testid="text-auth-error">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoggingIn}
                data-testid="button-auth-submit"
              >
                {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="text-primary hover:underline font-medium"
                  data-testid="button-toggle-auth-mode"
                >
                  Sign up
                </Link>
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
