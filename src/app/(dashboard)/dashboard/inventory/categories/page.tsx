'use client'

import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import axiosInstance  from '@/lib/axiosInstance';
import { Category } from '@/types';

const Categories: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<Category>({
        defaultValues: {
            name: '',
            description: ''
        }
    });

    const { data: categories, isLoading, error } = useQuery<Category[]>('categories', async () => {
        const response = await axiosInstance.get('/categories');
        return response.data;
    });

    const categoryMutation = useMutation(
        (categoryData: Partial<Category>) =>
            selectedCategory
                ? axiosInstance.put(`/categories/${selectedCategory.id}`, categoryData)
                : axiosInstance.post('/categories', categoryData),
        {
            onSuccess: () => {
                toast({
                    title: selectedCategory ? "Category Updated" : "Category Added",
                    description: `The category has been successfully ${selectedCategory ? 'updated' : 'added'}.`,
                });
                queryClient.invalidateQueries('categories');
                setSelectedCategory(null);
                setIsDialogOpen(false);
                form.reset();
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: `There was an error ${selectedCategory ? 'updating' : 'adding'} the category. Please try again.`,
                    variant: "destructive",
                });
            },
        }
    );

    const deleteCategoryMutation = useMutation(
        (id: string) => axiosInstance.delete(`/categories/${id}`),
        {
            onSuccess: () => {
                toast({
                    title: "Category Deleted",
                    description: "The category has been successfully deleted.",
                });
                queryClient.invalidateQueries('categories');
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "There was an error deleting the category. Please try again.",
                    variant: "destructive",
                });
            },
        }
    );

    const onSubmit: SubmitHandler<Category> = (data) => {
        categoryMutation.mutate(data);
    };

    React.useEffect(() => {
        if (selectedCategory) {
            form.reset(selectedCategory);
        } else {
            form.reset({
                name: '',
                description: ''
            });
        }
    }, [selectedCategory, form]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching categories</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="mb-4" onClick={() => setSelectedCategory(null)}>Add Category</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} required />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit">{selectedCategory ? 'Update' : 'Add'} Category</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories?.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell>{category.name}</TableCell>
                                <TableCell>{category.description}</TableCell>
                                <TableCell>
                                    <Button
                                        onClick={() => {
                                            setSelectedCategory(category);
                                            setIsDialogOpen(true);
                                        }}
                                        className="mr-2"
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => deleteCategoryMutation.mutate(category.id)}
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default Categories;
