import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Trophy, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

type State = "loading" | "success" | "already_approved" | "error";

export default function ParentApprovePage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>("loading");
  const [firstName, setFirstName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("Invalid approval link.");
      return;
    }

    apiRequest("POST", `/api/parent-approve/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.alreadyApproved) {
          setState("already_approved");
        } else {
          setFirstName(data.firstName ?? "");
          setState("success");
        }
      })
      .catch((err) => {
        const raw: string = err?.message || "Approval failed";
        try {
          const parsed = JSON.parse(raw.split(": ").slice(1).join(": "));
          setErrorMsg(parsed.message || raw);
        } catch {
          setErrorMsg(raw);
        }
        setState("error");
      });
  }, [token]);

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
            {state === "loading" && (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="text-muted-foreground">Processing approval…</p>
              </>
            )}

            {state === "success" && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Account approved!</h1>
                  <p className="text-muted-foreground">
                    {firstName ? `${firstName}'s account` : "The account"} has been
                    activated.{firstName ? ` ${firstName} can` : " They can"} now sign in
                    to CourtMatch and start finding hitting partners.
                  </p>
                </div>
                <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 text-left">
                  <p className="font-medium">What to expect</p>
                  <ul className="mt-1.5 space-y-1 text-blue-700 list-disc list-inside">
                    <li>All sessions are at public courts only</li>
                    <li>You can view your child's scheduled sessions</li>
                    <li>Any concerns? Contact us at support@courtmatch.app</li>
                  </ul>
                </div>
              </>
            )}

            {state === "already_approved" && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Already approved</h1>
                  <p className="text-muted-foreground">
                    This account has already been activated.
                  </p>
                </div>
              </>
            )}

            {state === "error" && (
              <>
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Something went wrong</h1>
                  <p className="text-muted-foreground">
                    {errorMsg || "This approval link is invalid or has expired."}
                  </p>
                </div>
              </>
            )}

            {state !== "loading" && (
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Go to CourtMatch
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
