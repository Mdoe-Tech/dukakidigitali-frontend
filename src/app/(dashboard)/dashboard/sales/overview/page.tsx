'use client'

import React from 'react';
import { useQuery, QueryClient, QueryClientProvider } from 'react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axiosInstance from '@/lib/axiosInstance';

interface SalesOverview {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    salesTrend: Array<{ date: string; sales: number }>;
    topSellingProducts: Array<{ name: string; quantity: number }>;
}

const SalesOverviews: React.FC = () => {
    const { data, isLoading, error } = useQuery<SalesOverview>('salesOverview', async () => {
        const response = await axiosInstance.get<SalesOverview>('/sales/overview');
        return response.data;
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching sales overview</div>;

    const MetricCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">{value}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard title="Total Sales" value={`$${data?.totalSales.toFixed(2)}`} />
                        <MetricCard title="Total Orders" value={data?.totalOrders ?? 0} />
                        <MetricCard title="Average Order Value" value={`$${data?.averageOrderValue.toFixed(2)}`} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={data?.salesTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul>
                        {data?.topSellingProducts.map((product, index) => (
                            <li key={index} className="mb-2">
                                {product.name} - {product.quantity} units sold
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};

export default SalesOverviews;
