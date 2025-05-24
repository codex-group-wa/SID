import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Plus, FileBox, FolderTree, FolderSync } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { syncStacks } from '@/lib/db';

const StackList = ({ stacks }: any) => {

    const [searchTerm, setSearchTerm] = useState('');
    const filteredStacks = stacks.filter((stack: { name: string; slug: string; path: string; }) =>
        stack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stack.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stack.path.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'Invalid date';
        }
    };

    // Empty state component
    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
                <FolderTree className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No stacks found</h3>
            <p className="text-sm text-gray-500 mb-4">Get started by creating your first stack</p>
            <Button onClick={() => syncStacks()}>
                <FolderSync className="h-4 w-4 mr-2" />
                Sync from GitHub
            </Button>
        </div>
    );

    return (
            <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold">Stacks</CardTitle>
                        <CardDescription>
                            Manage your application stacks
                        </CardDescription>
                    </div>
                    <Button onClick={() => syncStacks()}>
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

                    {filteredStacks.length === 0 && searchTerm === '' ? (
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
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden md:table-cell">Path</TableHead>
                                        <TableHead className="hidden md:table-cell">Created</TableHead>
                                        <TableHead className="hidden lg:table-cell">Updated</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStacks.map((stack: { id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; status: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; path: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; createdAt: string; updatedAt: string; }) => (
                                        <TableRow key={stack.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center">
                                                    <FileBox className="h-4 w-4 mr-2 text-blue-500" />
                                                    {stack.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-500">{stack.status}</TableCell>
                                            <TableCell className="hidden md:table-cell truncate max-w-xs">{stack.path}</TableCell>
                                            <TableCell className="hidden md:table-cell text-gray-500 text-sm">{formatDate(stack.createdAt)}</TableCell>
                                            <TableCell className="hidden lg:table-cell text-gray-500 text-sm">{formatDate(stack.updatedAt)}</TableCell>
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