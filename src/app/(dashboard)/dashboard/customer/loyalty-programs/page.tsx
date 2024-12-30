'use client'

import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axiosInstance from '@/lib/axiosInstance';

interface LoyaltyProgram {
    id: string;
    name: string;
    description: string;
    pointsRequired: number;
    reward: string;
}

interface Customer {
    id: string;
    name: string;
}

interface EnrollmentFormData {
    customerId: string;
    programId: string;
}

const LoyaltyPrograms: React.FC = () => {
    const [selectedProgram, setSelectedProgram] = React.useState<LoyaltyProgram | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const programForm = useForm<LoyaltyProgram>({
        defaultValues: {
            name: '',
            description: '',
            pointsRequired: 0,
            reward: ''
        }
    });

    const enrollmentForm = useForm<EnrollmentFormData>({
        defaultValues: {
            customerId: '',
            programId: ''
        }
    });

    const { data: programs, isLoading, error } = useQuery<any, Error>('loyaltyPrograms', async () => {
        const response = await axiosInstance.get('/loyalty-programs');
        return response.data.data;
    });

    const { data: customers } = useQuery<any, Error>('customers', async () => {
        const response = await axiosInstance.get('/customers');
        return response.data.data;
    });

    const programMutation = useMutation<void, Error, Partial<LoyaltyProgram>>(
        (programData: Partial<LoyaltyProgram>) =>
            selectedProgram
                ? axiosInstance.put(`/loyalty-programs/${selectedProgram.id}`, programData)
                : axiosInstance.post('/loyalty-programs', programData),
        {
            onSuccess: () => {
                toast({
                    title: selectedProgram ? "Program Updated" : "Program Created",
                    description: `The loyalty program has been successfully ${selectedProgram ? 'updated' : 'created'}.`,
                });
                queryClient.invalidateQueries('loyaltyPrograms');
                setSelectedProgram(null);
                programForm.reset();
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: `There was an error ${selectedProgram ? 'updating' : 'creating'} the loyalty program. Please try again.`,
                    variant: "destructive",
                });
            },
        }
    );

    const enrollmentMutation = useMutation<void, Error, EnrollmentFormData>(
        (enrollmentData: EnrollmentFormData) =>
            axiosInstance.post('/enrollments', enrollmentData),
        {
            onSuccess: () => {
                toast({
                    title: "Customer Enrolled",
                    description: "The customer has been successfully enrolled in the loyalty program.",
                });
                enrollmentForm.reset();
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "There was an error enrolling the customer. Please try again.",
                    variant: "destructive",
                });
            },
        }
    );

    const onProgramSubmit: SubmitHandler<LoyaltyProgram> = (data) => {
        programMutation.mutate(data);
    };

    const onEnrollmentSubmit: SubmitHandler<EnrollmentFormData> = (data) => {
        enrollmentMutation.mutate(data);
    };

    React.useEffect(() => {
        if (selectedProgram) {
            programForm.reset(selectedProgram);
        } else {
            programForm.reset({
                name: '',
                description: '',
                pointsRequired: 0,
                reward: ''
            });
        }
    }, [selectedProgram, programForm]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching loyalty programs: {error.message}</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Loyalty Programs</CardTitle>
            </CardHeader>
            <CardContent>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="mb-4">Create New Program</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedProgram ? 'Edit Program' : 'Create New Program'}</DialogTitle>
                        </DialogHeader>
                        <Form {...programForm}>
                            <form onSubmit={programForm.handleSubmit(onProgramSubmit)} className="space-y-4">
                                <FormField
                                    control={programForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Program Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} required />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={programForm.control}
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
                                <FormField
                                    control={programForm.control}
                                    name="pointsRequired"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Points Required</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="number" required />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={programForm.control}
                                    name="reward"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Reward</FormLabel>
                                            <FormControl>
                                                <Input {...field} required />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit">{selectedProgram ? 'Update' : 'Create'} Program</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Program Name</TableHead>
                            <TableHead>Points Required</TableHead>
                            <TableHead>Reward</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {programs?.content.map((program: any) => (
                            <TableRow key={program.id}>
                                <TableCell>{program.name}</TableCell>
                                <TableCell>{program.pointsRequired}</TableCell>
                                <TableCell>{program.reward}</TableCell>
                                <TableCell>
                                    <Button onClick={() => setSelectedProgram(program)} className="mr-2">Edit</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <h2 className="text-xl font-semibold mt-8 mb-4">Customer Enrollment</h2>
                <Form {...enrollmentForm}>
                    <form onSubmit={enrollmentForm.handleSubmit(onEnrollmentSubmit)} className="space-y-4">
                        <FormField
                            control={enrollmentForm.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a customer" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {customers?.content.map((customer:any) => (
                                                <SelectItem key={customer.id} value={customer.id}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={enrollmentForm.control}
                            name="programId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loyalty Program</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a program" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {programs?.content.map((program: any) => (
                                                <SelectItem key={program.id} value={program.id}>
                                                    {program.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Enroll Customer</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default LoyaltyPrograms;
