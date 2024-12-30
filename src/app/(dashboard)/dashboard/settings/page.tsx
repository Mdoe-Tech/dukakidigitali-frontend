'use client'

import React from 'react';
import { useQuery, useMutation } from 'react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axiosInstance from '@/lib/axiosInstance';

const settingsSchema = z.object({
    storeName: z.string().min(1, "Store name is required"),
    currency: z.string().min(1, "Currency is required"),
    timeZone: z.string().min(1, "Time zone is required"),
    emailNotifications: z.boolean(),
    smsNotifications: z.boolean(),
    twoFactorAuth: z.boolean(),
    sessionTimeout: z.number().min(1, "Session timeout must be at least 1 minute"),
});

type Settings = z.infer<typeof settingsSchema>;

const SettingsPage: React.FC = () => {
    const { toast } = useToast();
    const form = useForm<Settings>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            storeName: '',
            currency: '',
            timeZone: '',
            emailNotifications: false,
            smsNotifications: false,
            twoFactorAuth: false,
            sessionTimeout: 30,
        },
    });

    const { data: settings, isLoading, error, refetch } = useQuery<Settings>('settings', async () => {
        const response = await axiosInstance.get('/settings');
        return response.data;
    }, {
        onSuccess: (data) => {
            form.reset(data);
        },
    });

    const updateSettingsMutation = useMutation(
        (updatedSettings: Partial<Settings>) => axiosInstance.put('/settings', updatedSettings),
        {
            onSuccess: () => {
                toast({
                    title: "Settings Updated",
                    description: "Your settings have been successfully updated.",
                });
                refetch();
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "There was an error updating your settings. Please try again.",
                    variant: "destructive",
                });
            },
        }
    );

    const onSubmit: SubmitHandler<Settings> = (data) => {
        updateSettingsMutation.mutate(data);
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching settings</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="general">
                    <TabsList>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="security">Security</TabsTrigger>
                    </TabsList>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <TabsContent value="general">
                                <FormField
                                    control={form.control}
                                    name="storeName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Store Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="currency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Currency</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="timeZone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Time Zone</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                            <TabsContent value="notifications">
                                <FormField
                                    control={form.control}
                                    name="emailNotifications"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="smsNotifications"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">SMS Notifications</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                            <TabsContent value="security">
                                <FormField
                                    control={form.control}
                                    name="twoFactorAuth"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sessionTimeout"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Session Timeout (minutes)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>
                            <Button type="submit" className="mt-4">Save Settings</Button>
                        </form>
                    </Form>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default SettingsPage;
