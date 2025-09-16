import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@acme/shared/server";

export default async function IsAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // For now, we'll check if user has admin role or is part of an admin organization
  // This should be replaced with your actual admin logic
  const isUserAdmin =
    session.user.email?.includes("admin") ||
    session.user.email?.endsWith("@acme.com");

  if (!isUserAdmin) {
    redirect("/");
  }

  return <>{children}</>;
}
