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
      const result = await authClient.organization.getInvitation({
        query: {
          id: invitationId,
        },
      });
      setInvitation(result.data);
    } catch (err: any) {
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
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="mx-auto max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading invitation...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to the Team!</CardTitle>
            <CardDescription>
              You have successfully joined {invitation?.organization?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                You're now a member of {invitation?.organization?.name} with the
                role of {invitation?.role}.
              </p>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation || error) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been
              used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && (
                <div className="rounded bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <Button asChild className="w-full">
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Organization Invitation</CardTitle>
          <CardDescription>
            You've been invited to join {invitation.organization?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold">Invitation Details</h3>
              <p className="mb-1 text-sm text-gray-600">
                <strong>Organization:</strong> {invitation.organization?.name}
              </p>
              <p className="mb-1 text-sm text-gray-600">
                <strong>Role:</strong> {invitation.role}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Invited by:</strong>{" "}
                {invitation.inviter?.user?.name ||
                  invitation.inviter?.user?.email}
              </p>
            </div>

            {error && (
              <div className="rounded bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={handleAcceptInvitation}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Processing..." : "Accept"}
              </Button>
              <Button
                onClick={handleRejectInvitation}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                Decline
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              Need an account?{" "}
              <Link href="/signup" className="underline">
                Sign up first
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
