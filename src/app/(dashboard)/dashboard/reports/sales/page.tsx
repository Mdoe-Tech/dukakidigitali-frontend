'use client'

import React from 'react';
import { useQuery } from 'react-query';
import { addDays } from "date-fns"
import { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePickerWithRange } from "@/components/DateRangePicker";
import axiosInstance from '@/lib/axiosInstance';

interface SalesReportItem {
    date: string;
    totalSales: number;
    numberOfOrders: number;
    averageOrderValue: number;
}

interface SalesReportSummary {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
}

interface SalesReport {
    salesData: SalesReportItem[];
    summary: SalesReportSummary;
}

const SalesReports: React.FC = () => {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [reportType, setReportType] = React.useState('daily');

    const { data, isLoading, error } = useQuery<SalesReport>(
        ['salesReport', dateRange, reportType],
        async () => {
            if (!dateRange?.from || !dateRange?.to) {
                throw new Error("Date range is not set");
            }
            const response = await axiosInstance.get('/reports/sales', {
                params: {
                    from: dateRange.from.toISOString(),
                    to: dateRange.to.toISOString(),
                    type: reportType,
                },
            });
            return response.data;
        },
        {
            enabled: !!dateRange?.from && !!dateRange?.to,
        }
    );

    const handleExport = () => {
        console.log("Exporting report...");
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching sales report: {(error as Error).message}</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales Reports</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-4">
                        <DatePickerWithRange
                            date={dateRange}
                            setDate={setDateRange}
                        />
                        <Select value={reportType} onValueChange={setReportType}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleExport}>Export Report</Button>
                </div>

                {data ? (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total Sales</TableHead>
                                    <TableHead>Number of Orders</TableHead>
                                    <TableHead>Average Order Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.salesData.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.date}</TableCell>
                                        <TableCell>${item.totalSales.toFixed(2)}</TableCell>
                                        <TableCell>{item.numberOfOrders}</TableCell>
                                        <TableCell>${item.averageOrderValue.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <div className="mt-4">
                            <p><strong>Total Sales:</strong> ${data.summary.totalSales.toFixed(2)}</p>
                            <p><strong>Total Orders:</strong> {data.summary.totalOrders}</p>
                            <p><strong>Average Order Value:</strong> ${data.summary.averageOrderValue.toFixed(2)}</p>
                        </div>
                    </>
                ) : (
                    <div>No data available. Please select a date range and report type.</div>
                )}
            </CardContent>
        </Card>
    );
};

export default SalesReports;
