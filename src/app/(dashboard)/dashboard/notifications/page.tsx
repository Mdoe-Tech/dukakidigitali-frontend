'use client'
import React from 'react';
import { useQuery, useMutation } from 'react-query';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import  axiosInstance  from '@/lib/axiosInstance';
import { Notification, NotificationPreferences } from '@/types';

const NotificationsPage: React.FC = () => {
    const { toast } = useToast();

    const { data: notifications, isLoading: notificationsLoading, error: notificationsError } = useQuery<Notification[]>('notifications', async () => {
        const response = await axiosInstance.get('/notifications');
        return response.data;
    });

    const { data: preferences, isLoading: preferencesLoading, error: preferencesError, refetch: refetchPreferences } = useQuery<NotificationPreferences>('notificationPreferences', async () => {
        const response = await axiosInstance.get('/notifications/preferences');
        return response.data;
    });

    const updatePreferencesMutation = useMutation(
        (updatedPreferences: Partial<NotificationPreferences>) => axiosInstance.put('/notifications/preferences', updatedPreferences),
        {
            onSuccess: () => {
                toast({
                    title: "Preferences Updated",
                    description: "Your notification preferences have been successfully updated.",
                });
                refetchPreferences();
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "There was an error updating your preferences. Please try again.",
                    variant: "destructive",
                });
            },
        }
    );

    const markAsReadMutation = useMutation(
        (notificationId: string) => axiosInstance.post(`/notifications/${notificationId}/read`),
        {
            onSuccess: () => {
                toast({
                    title: "Notification Marked as Read",
                    description: "The notification has been marked as read.",
                });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "There was an error marking the notification as read. Please try again.",
                    variant: "destructive",
                });
            },
        }
    );

    if (notificationsLoading || preferencesLoading) return <div>Loading...</div>;
    if (notificationsError || preferencesError) return <div>Error fetching data</div>;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {notifications?.map((notification) => (
                                <TableRow key={notification.id}>
                                    <TableCell>{notification.type}</TableCell>
                                    <TableCell>{notification.message}</TableCell>
                                    <TableCell>{new Date(notification.date).toLocaleString()}</TableCell>
                                    <TableCell>
                                        {!notification.read && (
                                            <Button onClick={() => markAsReadMutation.mutate(notification.id)}>
                                                Mark as Read
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Notification Type</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>SMS</TableHead>
                                <TableHead>In-App</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(preferences || {}).map(([key, value]) => (
                                <TableRow key={key}>
                                    <TableCell>{key}</TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={value.email}
                                            onCheckedChange={(checked) => updatePreferencesMutation.mutate({ [key]: { ...value, email: checked } })}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={value.sms}
                                            onCheckedChange={(checked) => updatePreferencesMutation.mutate({ [key]: { ...value, sms: checked } })}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={value.inApp}
                                            onCheckedChange={(checked) => updatePreferencesMutation.mutate({ [key]: { ...value, inApp: checked } })}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default NotificationsPage;
