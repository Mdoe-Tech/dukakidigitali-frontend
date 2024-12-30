'use client'

import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import  axiosInstance  from '@/lib/axiosInstance';

const userSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    role: z.enum(["admin", "manager", "employee"]),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type User = z.infer<typeof userSchema>;

const Users: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

    const form = useForm<User>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            role: 'employee',
        },
    });

    const { data: users, isLoading, error } = useQuery<User[]>('users', async () => {
        const response = await axiosInstance.get('/users');
        return response.data;
    });

    const userMutation = useMutation(
        (userData: Partial<User>) =>
            userData.id
                ? axiosInstance.put(`/users/${userData.id}`, userData)
                : axiosInstance.post('/users', userData),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users');
                toast({
                    title: selectedUser ? "User Updated" : "User Created",
                    description: `The user has been successfully ${selectedUser ? 'updated' : 'created'}.`,
                });
                setIsDialogOpen(false);
                setSelectedUser(null);
                form.reset();
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: `There was an error ${selectedUser ? 'updating' : 'creating'} the user. Please try again.`,
                    variant: "destructive",
                });
            },
        }
    );

    const deleteMutation = useMutation(
        (userId: number) => axiosInstance.delete(`/users/${userId}`),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users');
                toast({
                    title: "User Deleted",
                    description: "The user has been successfully deleted.",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "There was an error deleting the user. Please try again.",
                    variant: "destructive",
                });
            },
        }
    );

    const onSubmit: SubmitHandler<User> = (data) => {
        userMutation.mutate(data);
    };

    React.useEffect(() => {
        if (selectedUser) {
            form.reset(selectedUser);
        } else {
            form.reset({
                name: '',
                email: '',
                role: 'employee',
            });
        }
    }, [selectedUser, form]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching users</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="mb-4" onClick={() => setSelectedUser(null)}>Add New User</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
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
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="email" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="manager">Manager</SelectItem>
                                                    <SelectItem value="employee">Employee</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {!selectedUser && (
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <Button type="submit">{selectedUser ? 'Update' : 'Add'} User</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    <Button onClick={() => {
                                        setSelectedUser(user);
                                        setIsDialogOpen(true);
                                    }} className="mr-2">Edit</Button>
                                    <Button variant="destructive" onClick={() => {
                                        if (user.id) {
                                            deleteMutation.mutate(user.id);
                                        }
                                    }}>Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default Users;
