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
  onPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = events.filter(
    (event) =>
      event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.stack?.name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ),
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // If searching, show filtered results only, otherwise use paginated events from parent
  const displayEvents = searchTerm ? filteredEvents.slice(0, pageSize) : events;

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  };

  const handlePrev = () => onPageChange && onPageChange(Math.max(1, page - 1));
  const handleNext = () =>
    onPageChange && onPageChange(Math.min(totalPages, page + 1));

  // Reset to first page on search
  React.useEffect(() => {
    if (onPageChange) onPageChange(1);
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
                    <TableHead className="hidden md:table-cell">
                      Timestamp
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium flex items-center">
                        {typeIcon(event.type)}
                        <span className="capitalize">{event.type}</span>
                      </TableCell>
                      <TableCell>{event.message}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {event.stack?.name || (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-500 text-sm">
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
