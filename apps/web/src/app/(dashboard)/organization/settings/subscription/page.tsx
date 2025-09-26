import { SubscriptionManager } from "@/components/subscription/subscription-manager";

interface SubscriptionPageProps {
  params: {
    organizationId: string;
  };
}

export default function OrganizationSubscriptionPage({ params }: SubscriptionPageProps) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organization Subscription</h2>
          <p className="text-muted-foreground">
            Manage your organization's subscription and billing information.
          </p>
        </div>
      </div>
      
      <SubscriptionManager organizationId={params.organizationId} />
    </div>
  );
}
