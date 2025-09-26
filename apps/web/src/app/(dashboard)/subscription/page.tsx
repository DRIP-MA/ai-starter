import { SubscriptionManager } from "@/components/subscription/subscription-manager";

export default function SubscriptionPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscription</h2>
          <p className="text-muted-foreground">
            Manage your subscription and billing information.
          </p>
        </div>
      </div>
      
      <SubscriptionManager />
    </div>
  );
}
