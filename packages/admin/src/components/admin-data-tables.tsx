"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { trpc } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

function UsersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading } = trpc.admin.getUsers.useQuery({
    page,
    limit,
    search: search || undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const users = data?.users || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
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
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </TableCell>
              </TableRow>
            ))}
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

function ListingsTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading } = trpc.admin.getListings.useQuery({
    page,
    limit,
    search: search || undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const listings = data?.listings || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Ratio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell className="font-medium">{listing.address}</TableCell>
                <TableCell>
                  <Badge variant="outline">{listing.ratio}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      listing.status === "success"
                        ? "default"
                        : listing.status === "error"
                          ? "destructive"
                          : listing.status === "generating"
                            ? "secondary"
                            : "outline"
                    }
                  >
                    {listing.status || "pending"}
                  </Badge>
                </TableCell>
                <TableCell>{listing.profile?.email || "Unknown"}</TableCell>
                <TableCell>
                  {listing.createdAt
                    ? new Date(listing.createdAt).toLocaleDateString()
                    : "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(page - 1) * limit + 1} to{" "}
          {Math.min(page * limit, pagination.total)} of {pagination.total}{" "}
          listings
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

function SubscribersTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading } = trpc.admin.getSubscribers.useQuery({
    page,
    limit,
    search: search || undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const subscribers = data?.subscribers || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscribers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Subscription ID</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={subscriber.image || undefined} />
                      <AvatarFallback>
                        {subscriber.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{subscriber.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{subscriber.email}</TableCell>
                <TableCell>{subscriber.profile?.credits || 0}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {subscriber.organization?.name || "Personal"}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {subscriber.subscription?.stripeSubId?.slice(0, 12)}...
                </TableCell>
                <TableCell>
                  {subscriber.createdAt
                    ? new Date(subscriber.createdAt).toLocaleDateString()
                    : "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {(page - 1) * limit + 1} to{" "}
          {Math.min(page * limit, pagination.total)} of {pagination.total}{" "}
          subscribers
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

export function AdminDataTables() {
  const pathname = usePathname();

  const getDefaultTab = () => {
    if (pathname === "/users") return "users";
    if (pathname === "/listings") return "listings";
    return "users";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          View and manage users, listings, and subscribers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-6">
            <UsersTable />
          </TabsContent>
          <TabsContent value="listings" className="mt-6">
            <ListingsTable />
          </TabsContent>
          <TabsContent value="subscribers" className="mt-6">
            <SubscribersTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
