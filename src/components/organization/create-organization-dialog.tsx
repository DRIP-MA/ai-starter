"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2 } from "lucide-react";

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");

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
      await authClient.organization.create({
        name: orgName.trim(),
        slug: `${slug}-${Date.now()}`,
      });

      // Reset form and close dialog
      setOrgName("");
      setError("");
      onOpenChange(false);
    } catch (err: any) {
      setError(
        err?.message || "Failed to create organization. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-sidebar-border bg-card sm:max-w-md">
        <DialogHeader className="space-y-4 text-center">
          <div className="bg-sidebar-primary/10 border-sidebar-border mx-auto flex h-12 w-12 items-center justify-center rounded-lg border">
            <Building2 className="text-sidebar-primary h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="text-card-foreground text-xl">
              Create New Organization
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new organization to manage projects and team members.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleCreateOrganization} className="space-y-4">
          <div className="grid gap-2">
            <Label
              htmlFor="dialogOrgName"
              className="text-card-foreground font-medium"
            >
              Organization Name
            </Label>
            <Input
              id="dialogOrgName"
              type="text"
              placeholder="Enter organization name"
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

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/20 flex-1"
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground flex-1"
              disabled={isCreating || !orgName.trim()}
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
