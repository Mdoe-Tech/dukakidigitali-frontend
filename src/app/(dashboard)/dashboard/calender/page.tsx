'use client'
import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import axiosInstance from '@/lib/axiosInstance';
import { CalendarEvent } from '@/types';

const CalendarPage: React.FC = () => {
    const [date, setDate] = React.useState<Date>(new Date());
    const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<CalendarEvent>({
        defaultValues: {
            title: '',
            description: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            type: 'other'
        }
    });

    const { data: events, isLoading, error } = useQuery<CalendarEvent[]>(
        ['events', format(date, 'yyyy-MM-dd')],
        async () => {
            const response = await axiosInstance.get('/events', {
                params: { date: format(date, 'yyyy-MM-dd') },
            });
            return response.data;
        }
    );

    const eventMutation = useMutation(
        (eventData: Partial<CalendarEvent>) =>
            selectedEvent
                ? axiosInstance.put(`/events/${selectedEvent.id}`, eventData)
                : axiosInstance.post('/events', eventData),
        {
            onSuccess: () => {
                toast({
                    title: selectedEvent ? "Event Updated" : "Event Created",
                    description: `The event has been successfully ${selectedEvent ? 'updated' : 'created'}.`,
                });
                queryClient.invalidateQueries(['events']);
                setSelectedEvent(null);
                form.reset();
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: `There was an error ${selectedEvent ? 'updating' : 'creating'} the event. Please try again.`,
                    variant: "destructive",
                });
            },
        }
    );

    const onSubmit = (data: CalendarEvent) => {
        eventMutation.mutate(data);
    };

    React.useEffect(() => {
        if (selectedEvent) {
            form.reset(selectedEvent);
        } else {
            form.reset({
                title: '',
                description: '',
                date: format(date, 'yyyy-MM-dd'),
                type: 'other'
            });
        }
    }, [selectedEvent, date, form]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching events</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex space-x-4">
                    <div className="w-1/2">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(newDate) => newDate && setDate(newDate)}
                            className="rounded-md border"
                        />
                    </div>
                    <div className="w-1/2">
                        <h3 className="text-lg font-semibold mb-2">Events for {format(date, 'MMMM d, yyyy')}</h3>
                        {events?.map((event) => (
                            <div key={event.id} className="mb-2 p-2 border rounded">
                                <h4 className="font-semibold">{event.title}</h4>
                                <p>{event.description}</p>
                                <Button onClick={() => setSelectedEvent(event)} className="mt-2">Edit</Button>
                            </div>
                        ))}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="mt-4">Add New Event</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Title</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
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
                                        <FormField
                                            control={form.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-[240px] pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(new Date(field.value), "PPP")
                                                                    ) : (
                                                                        <span>Pick a date</span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value ? new Date(field.value) : undefined}
                                                                onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select event type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="promotion">Promotion</SelectItem>
                                                            <SelectItem value="inventory">Inventory Check</SelectItem>
                                                            <SelectItem value="meeting">Meeting</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit">{selectedEvent ? 'Update' : 'Add'} Event</Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CalendarPage;
