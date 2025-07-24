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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Info,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

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

interface EventTableProps {
  events: any[];
  page: number;
  total: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

const EventTable: React.FC<EventTableProps> = ({
  events,
  page,
  total,
  pageSize = 10,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = Number(searchParams.get("page")) || 1;
  const filteredEvents = events.filter(
    (event) =>
      event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.stack?.name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ),
  );

  const createPageURL = (pageNumber: number | string) => {
    console.log("Creating page URL for page:", pageNumber);
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const displayEvents = searchTerm ? filteredEvents.slice(0, pageSize) : events;

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  };

  const handlePrev = () => {
    const url = createPageURL(Math.max(1, page - 1));
    router.push(url);
  };
  const handleNext = () => {
    const url = createPageURL(Math.min(totalPages, page + 1));
    router.push(url);
  };

  // Reset to first page on search
  React.useEffect(() => {
    createPageURL(1);
  }, [searchTerm]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Events</CardTitle>
        <CardDescription>Recent system events and logs</CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search events..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          {displayEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No events found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Stack
                    </TableHead>
                    <TableHead className="md:table-cell">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium flex items-center truncate">
                        {typeIcon(event.type)}
                        <span className="capitalize">{event.type}</span>
                      </TableCell>
                      <TooltipProvider key={event.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <TableCell className="font-mono text-xs truncate max-w-xs sm:max-w-lg">
                              {event.message}
                            </TableCell>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="wrap-normal max-w-lg font-mono text-xs">
                              {event.message}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TableCell className="hidden md:table-cell">
                        {event.stack?.name || (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </TableCell>
                      <TableCell className="md:table-cell text-gray-500 text-sm">
                        {formatDate(event.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between px-4 py-2 border-t ">
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventTable;
