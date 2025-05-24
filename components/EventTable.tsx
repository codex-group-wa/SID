import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const typeIcon = (type: string) => {
    switch (type.toLowerCase()) {
        case 'error':
            return <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />;
        case 'success':
            return <CheckCircle className="h-4 w-4 text-green-500 mr-2" />;
        case 'info':
        default:
            return <Info className="h-4 w-4 text-blue-500 mr-2" />;
    }
};

const EventTable = ({ events }: { events: any[] }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEvents = events.filter((event) =>
        event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.stack?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'Invalid date';
        }
    };

    return (
        <Card className="w-full mt-8">
            <CardHeader>
                <CardTitle className="text-xl font-bold">Events</CardTitle>
                <CardDescription>
                    Recent system events and logs
                </CardDescription>
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
                    {filteredEvents.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No events found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead className="hidden md:table-cell">Stack</TableHead>
                                    <TableHead className="hidden md:table-cell">Timestamp</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEvents.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell className="font-medium flex items-center">
                                            {typeIcon(event.type)}
                                            <span className="capitalize">{event.type}</span>
                                        </TableCell>
                                        <TableCell>{event.message}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            {event.stack?.name || <span className="text-gray-400 italic">None</span>}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-gray-500 text-sm">
                                            {formatDate(event.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default EventTable;