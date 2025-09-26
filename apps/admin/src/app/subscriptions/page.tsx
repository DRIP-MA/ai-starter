import { SubscriptionsTable } from "@/components/subscriptions-table";

export default function SubscriptionsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Subscriptions</h2>
          <p className="text-muted-foreground">
            Manage and monitor all subscriptions in your system.
          </p>
        </div>
      </div>
      <SubscriptionsTable />
    </div>
  );
}

