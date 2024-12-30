'use client'

import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/DateRangePicker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import axiosInstance from '@/lib/axiosInstance';
import { DateRange } from "react-day-picker";

interface SalesAnalyticsTypes {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    categories: string[];
    dailySales: Array<{ date: string; revenue: number }>;
    topSellingProducts: Array<{ name: string; quantity: number }>;
}

const SalesAnalytics: React.FC = () => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        to: new Date()
    });
    const [category, setCategory] = useState('all');

    const { data, isLoading, error } = useQuery<SalesAnalyticsTypes>(
        ['salesAnalytics', dateRange, category],
        async () => {
            if (!dateRange?.from || !dateRange?.to) {
                throw new Error('Date range is not set');
            }
            const response = await axiosInstance.get<SalesAnalyticsTypes>('/analytics/sales', {
                params: {
                    from: dateRange.from.toISOString(),
                    to: dateRange.to.toISOString(),
                    category,
                },
            });
            return response.data;
        },
        {
            enabled: !!dateRange?.from && !!dateRange?.to,
        }
    );

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching sales analytics</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Sales Analytics</h1>
                <div className="flex space-x-4">
                    <DatePickerWithRange
                        date={dateRange}
                        setDate={(newDateRange) => setDateRange(newDateRange)}
                    />
                    <Select value={category} onValueChange={(value) => setCategory(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {data?.categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">${data?.totalRevenue.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{data?.totalOrders}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Average Order Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">${data?.averageOrderValue.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daily Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={data?.dailySales}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={data?.topSellingProducts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="quantity" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default SalesAnalytics;
