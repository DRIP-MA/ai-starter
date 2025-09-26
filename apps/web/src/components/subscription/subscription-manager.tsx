"use client";

import { useState } from "react";
import { trpc } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionManagerProps {
  organizationId?: string;
}

export function SubscriptionManager({
  organizationId,
}: SubscriptionManagerProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Get current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } =
    organizationId
      ? trpc.subscription.getOrganizationSubscription.useQuery({
          organizationId,
        })
      : trpc.subscription.getCurrentSubscription.useQuery();

  // Get available plans
  const { data: plans, isLoading: plansLoading } =
    trpc.subscription.getPlans.useQuery();

  // Create checkout session mutation
  const createCheckoutSession =
    trpc.subscription.createCheckoutSession.useMutation({
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (error) => {
        toast.error("Failed to create checkout session: " + error.message);
      },
    });

  // Create customer portal session mutation
  const createPortalSession =
    trpc.subscription.createCustomerPortalSession.useMutation({
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (error) => {
        toast.error("Failed to open customer portal: " + error.message);
      },
    });

  // Cancel subscription mutation
  const cancelSubscription = trpc.subscription.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success(
        "Subscription will be canceled at the end of the billing period",
      );
      // Refetch subscription data
      window.location.reload();
    },
    onError: (error) => {
      toast.error("Failed to cancel subscription: " + error.message);
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscription =
    trpc.subscription.reactivateSubscription.useMutation({
      onSuccess: () => {
        toast.success("Subscription reactivated successfully");
        // Refetch subscription data
        window.location.reload();
      },
      onError: (error) => {
        toast.error("Failed to reactivate subscription: " + error.message);
      },
    });

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setIsCheckoutOpen(true);
  };

  const handleCheckout = () => {
    if (!selectedPlan) return;

    const plan = plans?.find((p) => p.id === selectedPlan);
    if (!plan) return;

    createCheckoutSession.mutate({
      priceId: plan.stripePriceId,
      organizationId,
      successUrl: `${window.location.origin}/dashboard?success=true`,
      cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
    });
  };

  const handleManageSubscription = () => {
    createPortalSession.mutate({
      returnUrl: window.location.href,
    });
  };

  const handleCancelSubscription = () => {
    if (!currentSubscription?.id) return;

    cancelSubscription.mutate({
      subscriptionId: currentSubscription.id,
      organizationId,
    });
  };

  const handleReactivateSubscription = () => {
    if (!currentSubscription?.id) return;

    reactivateSubscription.mutate({
      subscriptionId: currentSubscription.id,
      organizationId,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "trialing":
        return "secondary";
      case "past_due":
        return "destructive";
      case "canceled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  if (subscriptionLoading || plansLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      {currentSubscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Subscription
                  <Badge variant={getStatusColor(currentSubscription.status)}>
                    {currentSubscription.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {currentSubscription.planDetails?.name || "Unknown Plan"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={createPortalSession.isPending}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </Button>
                {currentSubscription.cancelAtPeriodEnd ? (
                  <Button
                    variant="default"
                    onClick={handleReactivateSubscription}
                    disabled={reactivateSubscription.isPending}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Reactivate
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={cancelSubscription.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Billing Period
                </p>
                <p className="text-sm">
                  {formatDate(currentSubscription.periodStart)} -{" "}
                  {formatDate(currentSubscription.periodEnd)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Seats
                </p>
                <p className="text-sm">{currentSubscription.seats || 1}</p>
              </div>
            </div>

            {currentSubscription.trialStart && currentSubscription.trialEnd && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Trial Period
                </p>
                <p className="text-sm">
                  {formatDate(currentSubscription.trialStart)} -{" "}
                  {formatDate(currentSubscription.trialEnd)}
                </p>
              </div>
            )}

            {currentSubscription.cancelAtPeriodEnd && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription will be canceled at the end of the current
                  billing period.
                </AlertDescription>
              </Alert>
            )}

            {currentSubscription.planDetails?.limits && (
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">
                  Plan Limits
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(
                    JSON.parse(currentSubscription.planDetails.limits),
                  ).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">
                        {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                      </span>
                      <span>{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              Choose a plan to get started with your subscription.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Available Plans */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Plans</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans?.map((plan) => (
            <Card key={plan.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {currentSubscription?.plan === plan.id && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {plan.type === "subscription"
                    ? "Recurring billing"
                    : "One-time payment"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.limits && (
                  <div className="space-y-2">
                    {Object.entries(JSON.parse(plan.limits)).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="capitalize">
                            {key.replace(/([A-Z])/g, " $1").toLowerCase()}:{" "}
                            {value as string}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}

                {plan.trialPeriodDays && (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{plan.trialPeriodDays} day free trial</span>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  {currentSubscription?.plan === plan.id ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={createCheckoutSession.isPending}
                    >
                      {currentSubscription ? "Upgrade" : "Subscribe"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
            <DialogDescription>
              You're about to subscribe to{" "}
              {plans?.find((p) => p.id === selectedPlan)?.name}. You'll be
              redirected to Stripe to complete the payment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={createCheckoutSession.isPending}
            >
              {createCheckoutSession.isPending
                ? "Processing..."
                : "Continue to Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
