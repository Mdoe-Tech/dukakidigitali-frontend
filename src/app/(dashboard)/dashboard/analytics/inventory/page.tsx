'use client'
import React from 'react';
import { useQuery } from 'react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import axiosInstance  from '@/lib/axiosInstance';
import {InventoryAnalyticsTypes} from "@/types";

const InventoryAnalytics: React.FC = () => {
    const { data, isLoading, error } = useQuery<InventoryAnalyticsTypes>('inventoryAnalytics', async () => {
        const response = await axiosInstance.get('/analytics/inventory');
        return response.data;
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching inventory analytics</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Inventory Analytics</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Stock Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">${data?.totalStockValue.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Out of Stock Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{data?.outOfStockItems}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Low Stock Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{data?.lowStockItems}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stock Turnover Rate</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={data?.stockTurnoverRate}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="product" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="rate" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Inventory Value Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={data?.inventoryValueOverTime}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Predicted Restocking Needs</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul>
                        {data?.predictedRestockingNeeds.map((item, index) => (
                            <li key={index} className="mb-2">
                                {item.product}: {item.quantity} units needed by {new Date(item.date).toLocaleDateString()}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};

export default InventoryAnalytics;
