"use client";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight,
  Loader2,
  RotateCw,
  Search,
  StopCircle,
  X,
  Zap,
} from "lucide-react";
import ActionButtons from "./ActionButtons";
import { restartContainer, stopContainer, killContainer } from "@/lib/process";
import { toast } from "sonner";

interface Container {
  ID: string;
  Names: string;
  Image: string;
  State: string;
  CreatedAt: string;
  Ports: string;
  Mounts: string;
}

const ContainerDashboard: React.FC<any> = ({ containers }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredContainers = containers.filter(
    (container: Container) =>
      container.Names.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.Image.toLowerCase().includes(searchTerm.toLowerCase()) ||
      container.ID.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  async function handleAction(id: string, action: string) {
    setLoadingId(id);
    try {
      if (action === "Stop") {
        const response: any = await stopContainer(id);
        if (response.status === "error") {
          toast.error(`Failed to stop container ${id}`);
        } else if (response.status === "success") {
          toast.success(`Container ${id} stopped successfully!`);
        }
      } else if (action === "Restart") {
        const response: any = await restartContainer(id);
        if (response.status === "error") {
          toast.error(`Failed to restart container ${id}`);
        } else if (response.status === "success") {
          toast.success(`Container ${id} restarted successfully!`);
        }
      } else if (action === "Kill") {
        const response: any = await killContainer(id);
        if (response.status === "error") {
          toast.error(`Failed to kill container ${id}`);
        } else if (response.status === "success") {
          toast.success(`Container ${id} killed successfully!`);
        }
      } else if (action === "Start") {
        const response: any = await restartContainer(id);
        if (response.status === "error") {
          toast.error(`Failed to start container ${id}`);
        } else if (response.status === "success") {
          toast.success(`Container ${id} started successfully!`);
        }
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Docker Containers</CardTitle>
        <CardDescription>Manage your running containers</CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search containers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          {!containers || containers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm
                ? "No containers match your search."
                : "No containers found. They may still be loading or there are no Docker containers."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Ports</TableHead>
                  <TableHead className="hidden lg:table-cell">Mounts</TableHead>
                  <TableHead className="lg:table-cell">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContainers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-gray-500"
                    >
                      No containers match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContainers.map((container: Container) => (
                    <TableRow key={container.ID}>
                      <TableCell>
                        <Badge
                          variant={
                            container.State === "running"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            container.State === "running"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }
                        >
                          {container.State}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {container.Names}
                      </TableCell>
                      <TableCell>{container.Image}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {container.ID.substring(0, 10)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {container.CreatedAt.split(" ")[0]}
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono truncate text-xs">
                        {container.Ports}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs truncate max-w-xs">
                        {container.Mounts}
                      </TableCell>

                      <TableCell className="hidden lg:table-cell text-xs truncate max-w-xs">
                        {loadingId === container.ID ? (
                          <span className="flex items-center justify-center">
                            <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
                          </span>
                        ) : (
                          <ActionButtons
                            containerId={container.ID}
                            handleAction={handleAction}
                            containerStatus={container.State}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContainerDashboard;
