import { db, plan } from "@acme/shared/server";

async function seedPlans() {
  console.log("Seeding plans...");

  const plans = [
    {
      id: "starter",
      name: "Starter",
      stripePriceId: "price_starter_monthly", // Replace with actual Stripe price ID
      stripeAnnualPriceId: "price_starter_annual", // Replace with actual Stripe price ID
      type: "subscription",
      isActive: true,
      sortOrder: 1,
      trialPeriodDays: 14,
      limits: JSON.stringify({
        projects: 5,
        storage: 10, // GB
        members: 3,
        apiCalls: 10000,
      }),
    },
    {
      id: "professional",
      name: "Professional",
      stripePriceId: "price_professional_monthly", // Replace with actual Stripe price ID
      stripeAnnualPriceId: "price_professional_annual", // Replace with actual Stripe price ID
      type: "subscription",
      isActive: true,
      sortOrder: 2,
      trialPeriodDays: 14,
      limits: JSON.stringify({
        projects: 25,
        storage: 100, // GB
        members: 10,
        apiCalls: 100000,
      }),
    },
    {
      id: "enterprise",
      name: "Enterprise",
      stripePriceId: "price_enterprise_monthly", // Replace with actual Stripe price ID
      stripeAnnualPriceId: "price_enterprise_annual", // Replace with actual Stripe price ID
      type: "subscription",
      isActive: true,
      sortOrder: 3,
      trialPeriodDays: 30,
      limits: JSON.stringify({
        projects: -1, // Unlimited
        storage: -1, // Unlimited
        members: -1, // Unlimited
        apiCalls: -1, // Unlimited
      }),
    },
  ];

  for (const planData of plans) {
    try {
      await db.insert(plan).values(planData).onConflictDoNothing();
      console.log(`✓ Seeded plan: ${planData.name}`);
    } catch (error) {
      console.error(`✗ Failed to seed plan ${planData.name}:`, error);
    }
  }

  console.log("Plans seeded successfully!");
}

seedPlans().catch(console.error);
