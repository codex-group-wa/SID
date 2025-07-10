"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  FileBox,
  FolderTree,
  FolderSync,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { syncStacks } from "@/lib/db";
import { toast } from "sonner";
import { clone, runDockerComposeForPath } from "@/lib/process";

const StackList = ({ stacks }: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredStacks = stacks.filter(
    (stack: { name: string; slug: string; path: string }) =>
      stack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stack.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stack.path.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  async function handleSync() {
    try {
      await clone();
      await syncStacks();
      toast.success("Stacks synced successfully!");
    } catch (error) {
      console.error("Error syncing stacks:", error);
      toast.error("Failed to sync stacks. Please try again.");
    }
  }

  const typeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500 mr-2" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-500 mr-2" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (dateString) {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
      } else {
        return "Not yet deployed";
      }
    } catch {
      return "Invalid date";
    }
  };

  const getShortPath = (fullPath: string) => {
    // Try to find the "/compose-v2" or repo folder in the path and return from there
    const repoRoot =
      process.env.REPO_ROOT?.split("/").pop()?.replace(".git", "") ||
      "compose-v2";
    const idx = fullPath.indexOf(`/${repoRoot}/`);
    if (idx !== -1) {
      return fullPath.substring(idx);
    }
    // Fallback: show last two segments
    const parts = fullPath.split("/");
    return "/" + parts.slice(-3).join("/");
  };

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <FolderTree className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">No stacks found</h3>
      <p className="text-sm text-gray-500 mb-4">
        Get started by importing your schema from GitHub
      </p>
      <Button onClick={() => handleSync()}>
        <FolderSync className="h-4 w-4 mr-2" />
        Sync from GitHub
      </Button>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold">Stacks & Schema</CardTitle>
          <CardDescription>
            Manage your application stacks and deployment schema
          </CardDescription>
        </div>
        <Button onClick={() => handleSync()}>
          <FolderSync className="h-4 w-4 mr-2" />
          Sync from GitHub
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search stacks..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredStacks.length === 0 && searchTerm === "" ? (
          <EmptyState />
        ) : filteredStacks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No stacks match your search
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Last Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Schema Path
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Last Synced
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Last Deployed
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStacks.map((stack: any) => (
                  <TableRow key={stack.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileBox className="h-4 w-4 mr-2 text-blue-500" />
                        {stack.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {stack.events && stack.events.length > 0 ? (
                        <span className="flex text-white">
                          {typeIcon(stack.events[0].type)}
                          {stack.events[0].type}
                        </span>
                      ) : (
                        "No events"
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell truncate max-w-xs">
                      <span
                        title={typeof stack.path === "string" ? stack.path : ""}
                      >
                        {typeof stack.path === "string"
                          ? getShortPath(stack.path)
                          : stack.path}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-500 text-sm">
                      {formatDate(stack.createdAt)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-500 text-sm">
                      {formatDate(stack.updatedAt)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-500 text-sm">
                      {formatDate(stack.events[0]?.createdAt)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      <Button
                        onClick={() =>
                          runDockerComposeForPath(
                            getShortPath(stack.path)
                              .split("/")
                              .slice(0, 3)
                              .join("/"),
                          )
                        }
                        className="w-7 h-7 px-1"
                        variant="outline"
                        size="icon"
                      >
                        <TrendingUp />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StackList;
