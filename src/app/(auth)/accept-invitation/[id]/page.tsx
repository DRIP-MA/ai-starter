"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Users, Shield, AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AcceptInvitationPage({ params }: PageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [invitation, setInvitation] = useState<any>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
  const [invitationId, setInvitationId] = useState<string>("");

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setInvitationId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (invitationId) {
      loadInvitation();
    }
  }, [invitationId]);

  const loadInvitation = async () => {
    if (!invitationId) return;

    try {
      setIsLoadingInvitation(true);
      setError(""); // Clear any previous errors
      const result = await authClient.organization.getInvitation({
        query: {
          id: invitationId,
        },
      });

      console.log("Invitation result:", result); // Debug logging

      if (result.data) {
        setInvitation(result.data);
      } else {
        setError("Invitation not found or has expired");
      }
    } catch (err: any) {
      console.error("Failed to load invitation:", err); // Debug logging
      setError(err?.message || "Failed to load invitation details");
    } finally {
      setIsLoadingInvitation(false);
    }
  };

  const handleAcceptInvitation = async () => {
    setIsLoading(true);
    setError("");

    try {
      await authClient.organization.acceptInvitation({
        invitationId: invitationId,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err?.message || "Failed to accept invitation. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectInvitation = async () => {
    setIsLoading(true);
    setError("");

    try {
      await authClient.organization.rejectInvitation({
        invitationId: invitationId,
      });
      router.push("/login?message=invitation-rejected");
    } catch (err: any) {
      setError(
        err?.message || "Failed to reject invitation. Please try again.",
      );
      setIsLoading(false);
    }
  };

  if (isLoadingInvitation) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="border-primary mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading invitation...</p>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Welcome to the Team!</CardTitle>
          <CardDescription>
            You have successfully joined {invitation?.organization?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm">
                <strong>Organization:</strong> {invitation?.organization?.name}
              </p>
              <p className="text-sm">
                <strong>Your Role:</strong> {invitation?.role}
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invitation && !isLoadingInvitation) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl">Invalid Invitation</CardTitle>
          <CardDescription>
            This invitation link is invalid, expired, or has already been used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl">Organization Invitation</CardTitle>
        <CardDescription>
          You've been invited to join {invitation.organization?.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-muted/50 space-y-3 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                <Users className="text-primary h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {invitation.organization?.name}
                </p>
                <p className="text-muted-foreground text-xs">Organization</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                <Shield className="text-primary h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium capitalize">
                  {invitation.role}
                </p>
                <p className="text-muted-foreground text-xs">Your role</p>
              </div>
            </div>

            {invitation.inviter?.user && (
              <div className="border-t pt-2">
                <p className="text-muted-foreground text-xs">
                  Invited by{" "}
                  <span className="text-foreground font-medium">
                    {invitation.inviter.user.name ||
                      invitation.inviter.user.email}
                  </span>
                </p>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Unable to process invitation</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleAcceptInvitation}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Processing..." : "Accept Invitation"}
            </Button>
            <Button
              onClick={handleRejectInvitation}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Decline
            </Button>
          </div>

          <div className="text-muted-foreground text-center text-sm">
            Need an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium hover:underline"
            >
              Sign up first
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
