import { useSearch } from "wouter";
import { Link } from "wouter";
import { Trophy, CheckCircle2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SignupSuccess() {
  const search = useSearch();
  const isParent = new URLSearchParams(search).get("type") === "parent";

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

        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {isParent ? (
                  <Mail className="w-8 h-8 text-primary" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>

            {isParent ? (
              <>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Check your parent's email</h1>
                  <p className="text-muted-foreground">
                    We've sent an approval email to your parent or guardian. Your account will be
                    activated once they click the link.
                  </p>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 text-left">
                  <p className="font-medium">What happens next?</p>
                  <ul className="mt-1.5 space-y-1 text-amber-700 list-disc list-inside">
                    <li>Your parent receives an approval email</li>
                    <li>They click the link to approve your account</li>
                    <li>You can then sign in and start playing</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Check your email</h1>
                  <p className="text-muted-foreground">
                    We've sent a verification link to your email address. Click the link to activate
                    your account and start finding hitting partners.
                  </p>
                </div>
              </>
            )}

            <Link href="/auth">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
