import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCreateHitRequest } from "@/hooks/use-hit-requests";
import { useAuth } from "@/hooks/use-auth";
import { type ProfileWithUser } from "@shared/schema";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";

interface CreateRequestModalProps {
  receiver: ProfileWithUser;
  trigger?: React.ReactNode;
}

export function CreateRequestModal({ receiver, trigger }: CreateRequestModalProps) {
  const { user } = useAuth();
  const createRequest = useCreateHitRequest();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = () => {
    if (!user) return;

    createRequest.mutate({
      requesterId: user.id,
      receiverId: receiver.userId,
      message: message.trim() || null,
      status: "pending",
    }, {
      onSuccess: () => {
        setOpen(false);
        setMessage("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" data-testid="button-request-hit">
            Request to Hit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <Avatar className="w-10 h-10">
              <AvatarImage src={receiver.user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {receiver.user?.firstName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="font-display text-lg leading-tight">
                Hit with {receiver.user?.firstName}?
              </DialogTitle>
              <p className="text-xs text-muted-foreground">UTR {receiver.utrRating}</p>
            </div>
          </div>
          <DialogDescription className="text-sm">
            Send a message to introduce yourself and propose a time to hit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Textarea
            placeholder={`Hey ${receiver.user?.firstName}! I'd love to hit with you. Are you free this weekend?`}
            className="min-h-[110px] resize-none rounded-xl bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 text-sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            data-testid="input-request-message"
          />

          <Button
            onClick={onSubmit}
            className="w-full h-11 font-semibold rounded-xl"
            disabled={createRequest.isPending}
            data-testid="button-send-request"
          >
            {createRequest.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Send Request</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
