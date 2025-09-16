"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/trpc/react";
import { useDebounce } from "@/hooks/use-debounce";
import { authClient } from "@acme/shared/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  UserCheck,
} from "lucide-react";

export function UsersTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  // Get organization filter from URL params
  const organizationId = searchParams.get("organizationId");
  const organizationName = searchParams.get("organizationName");

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = trpc.admin.getUsers.useQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
    organizationId: organizationId || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, organizationId]);

  const handleClearFilters = () => {
    setSearch("");
    setPage(1);
    router.push("/users");
  };

  const handleViewOrganization = (orgName: string) =>
    router.push(`/organizations?search=${encodeURIComponent(orgName)}`);

  const handleImpersonateUser = async (userId: string) => {
    try {
      const { data, error } = await authClient.admin.impersonateUser({
        userId,
      });

      console.log(data);

      if (error) {
        console.error("Impersonation failed:", error);
        // You could add a toast notification here
        return;
      }

      // Redirect to main app as the impersonated user
      window.open("/", "_blank");
    } catch (error) {
      console.error("Impersonation error:", error);
    }
  };

  const users = data?.users || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {(organizationId || search) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
        {organizationName && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Filtered by: {organizationName}</span>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-8 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  {debouncedSearch
                    ? "No users found matching your search."
                    : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role || "user"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.organization ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleViewOrganization(user.organization!.name)
                        }
                        className="h-8 px-3"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        View Organization
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">
                        No Organization
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.banned ? "destructive" : "default"}>
                      {user.banned ? "Banned" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleImpersonateUser(user.id)}
                      className="h-8 px-2"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Impersonate
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(page - 1) * limit + 1} to{" "}
          {Math.min(page * limit, pagination.total)} of {pagination.total} users
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.pages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
