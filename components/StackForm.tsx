import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FolderOpen, Loader2 } from 'lucide-react';
import { createStack } from '@/lib/db';

const StackCreationForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        filePath: ''
    });

    const [formState, setFormState] = useState({
        isSubmitting: false,
        error: null as string | null,
        success: false
    });

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')  // Remove special characters
            .replace(/\s+/g, '-')      // Replace spaces with hyphens
            .replace(/-+/g, '-');      // Replace multiple hyphens with single hyphen
    };

    const handleNameChange = (e: any) => {
        const name = e.target.value;
        setFormData({
            ...formData,
            name,
            slug: generateSlug(name)
        });
    };

    const handleChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    async function handleSubmit(e: any) {
        e.preventDefault();
        setFormState({ ...formState, isSubmitting: true, error: null });

        // Validation
        if (!formData.name || !formData.slug || !formData.filePath) {
            setFormState({
                isSubmitting: false,
                error: "All fields are required",
                success: false
            });
            return;
        }

        const response = await createStack(formData)
        console.info(response)
        if (response.createdAt) {
            setFormState({ ...formState, isSubmitting: false, error: null });
            setFormData({
                name: '',
                slug: '',
                filePath: ''
            })
        }
    };

    const handleBrowse = () => {
        // In a real application, this would show a file browser dialog
        // For this example, we'll just set a placeholder path
        setFormData({
            ...formData,
            filePath: '/Users/work/Development/stacks/new-project'
        });
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <div className="grid w-full items-center gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Stack Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="My Application Stack"
                            value={formData.name}
                            onChange={handleNameChange}
                            disabled={formState.isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            name="slug"
                            placeholder="my-application-stack"
                            value={formData.slug}
                            onChange={handleChange}
                            disabled={formState.isSubmitting}
                        />
                        <p className="text-xs text-gray-500">
                            Used as a unique identifier for your stack
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="filePath">File Path</Label>
                        <div className="flex gap-2">
                            <Input
                                id="filePath"
                                name="filePath"
                                placeholder="/path/to/stack"
                                value={formData.filePath}
                                onChange={handleChange}
                                disabled={formState.isSubmitting}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleBrowse}
                                disabled={formState.isSubmitting}
                            >
                                <FolderOpen className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {formState.error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{formState.error}</AlertDescription>
                        </Alert>
                    )}

                    {formState.success && (
                        <Alert className="bg-green-50 text-green-800 border-green-200">
                            <AlertDescription>Stack created successfully!</AlertDescription>
                        </Alert>
                    )}
                </div>
            </form>
        </div>
    );
};

export default StackCreationForm;