"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Users, Zap, Mail, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function NoOrganizationForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isCreating, setIsCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"create" | "invite" | "complete">("create");
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setIsCreating(true);
    setError("");

    try {
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const result = await authClient.organization.create({
        name: orgName.trim(),
        slug: `${slug}-${Date.now()}`,
      });

      if (result.data) {
        setCreatedOrgId(result.data.id);
        setStep("invite");
      }
    } catch (err: any) {
      setError(
        err?.message || "Failed to create organization. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const email = currentEmail.trim().toLowerCase();
    if (email && !inviteEmails.includes(email) && email.includes("@")) {
      setInviteEmails([...inviteEmails, email]);
      setCurrentEmail("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter((e) => e !== email));
  };

  const handleSendInvites = async () => {
    if (!createdOrgId) return;

    setIsCreating(true);
    setError("");

    try {
      for (const email of inviteEmails) {
        await authClient.organization.inviteMember({
          email,
          role: "member",
          organizationId: createdOrgId,
        });
      }
      setStep("complete");
    } catch (err: any) {
      setError(err?.message || "Failed to send invitations. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkipInvites = () => {
    setStep("complete");
  };

  // Step 1: Create Organization
  if (step === "create") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="border-sidebar-border bg-card shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="bg-sidebar-primary/10 border-sidebar-border mx-auto flex h-16 w-16 items-center justify-center rounded-xl border">
              <Building2 className="text-sidebar-primary h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-card-foreground text-2xl">
                Create Your Organization
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Get started by creating your organization to manage projects and
                team members.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrganization}>
              <div className="flex flex-col gap-6">
                {/* Benefits */}
                <div className="bg-sidebar/50 border-sidebar-border/50 grid gap-4 rounded-xl border p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-sidebar-primary/10 border-sidebar-border/30 flex h-10 w-10 items-center justify-center rounded-lg border">
                      <Users className="text-sidebar-primary h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-card-foreground font-semibold">
                        Collaborate with your team
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Invite team members and manage permissions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-sidebar-accent/30 border-sidebar-border/30 flex h-10 w-10 items-center justify-center rounded-lg border">
                      <Zap className="text-sidebar-accent-foreground h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-card-foreground font-semibold">
                        Manage projects efficiently
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Organize your work and track progress
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label
                      htmlFor="orgName"
                      className="text-card-foreground font-medium"
                    >
                      Organization Name
                    </Label>
                    <Input
                      id="orgName"
                      type="text"
                      placeholder="Enter your organization name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                      disabled={isCreating}
                      autoCapitalize="words"
                      autoComplete="organization"
                      autoCorrect="off"
                      className="bg-background border-sidebar-border focus:border-sidebar-primary focus:ring-sidebar-ring"
                    />
                    <p className="text-muted-foreground text-xs">
                      This will be the name displayed to your team members
                    </p>
                  </div>

                  {error && (
                    <Alert
                      variant="destructive"
                      className="border-destructive/20 bg-destructive/5"
                    >
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground w-full shadow-lg"
                    disabled={isCreating || !orgName.trim()}
                  >
                    {isCreating ? "Creating..." : "Create Organization"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Invite Members
  if (step === "invite") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="border-sidebar-border bg-card shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="bg-sidebar-accent/20 border-sidebar-border mx-auto flex h-16 w-16 items-center justify-center rounded-xl border">
              <Mail className="text-sidebar-accent-foreground h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-card-foreground text-2xl">
                Invite Team Members
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Invite your team to collaborate in "{orgName}" (optional)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              {/* Add Email Form */}
              <form onSubmit={handleAddEmail} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="email"
                    className="text-card-foreground font-medium"
                  >
                    Email Address
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={currentEmail}
                      onChange={(e) => setCurrentEmail(e.target.value)}
                      disabled={isCreating}
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      className="bg-background border-sidebar-border focus:border-sidebar-primary focus:ring-sidebar-ring flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={
                        !currentEmail.trim() || !currentEmail.includes("@")
                      }
                      className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground border-sidebar-border"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>

              {/* Email List */}
              {inviteEmails.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-card-foreground font-medium">
                    Team Members to Invite ({inviteEmails.length})
                  </Label>
                  <div className="border-sidebar-border bg-sidebar/30 max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
                    {inviteEmails.map((email) => (
                      <div
                        key={email}
                        className="bg-background border-sidebar-border/50 flex items-center justify-between rounded-lg border p-3 shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="bg-sidebar-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                            <Mail className="text-sidebar-primary h-4 w-4" />
                          </div>
                          <span className="text-card-foreground text-sm font-medium">
                            {email}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveEmail(email)}
                          className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <Alert
                  variant="destructive"
                  className="border-destructive/20 bg-destructive/5"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-3">
                {inviteEmails.length > 0 && (
                  <Button
                    onClick={handleSendInvites}
                    disabled={isCreating}
                    className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground w-full shadow-lg"
                  >
                    {isCreating
                      ? "Sending Invites..."
                      : `Send ${inviteEmails.length} Invitation${inviteEmails.length !== 1 ? "s" : ""}`}
                  </Button>
                )}

                <Button
                  onClick={handleSkipInvites}
                  variant="outline"
                  className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground w-full"
                  disabled={isCreating}
                >
                  {inviteEmails.length > 0
                    ? "Skip for Now"
                    : "Continue to Dashboard"}
                </Button>
              </div>

              <div className="text-muted-foreground text-center text-sm">
                You can invite more team members later from your organization
                settings.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Complete
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-sidebar-border bg-card shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="bg-sidebar-accent/30 border-sidebar-border mx-auto flex h-16 w-16 items-center justify-center rounded-xl border">
            <Check className="text-sidebar-accent-foreground h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-card-foreground text-2xl">
              Organization Created Successfully!
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Welcome to "{orgName}".{" "}
              {inviteEmails.length > 0
                ? `Invitations sent to ${inviteEmails.length} team member${inviteEmails.length !== 1 ? "s" : ""}.`
                : "You can start using your organization right away."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4 text-sm">
                Your organization is ready! You'll be redirected to your
                dashboard shortly.
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground w-full shadow-lg"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function NoOrganization() {
  return <NoOrganizationForm />;
}
