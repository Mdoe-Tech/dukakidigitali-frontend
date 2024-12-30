'use client'

import React from 'react';
import { useQuery } from 'react-query';
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/DateRangePicker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axiosInstance from '@/lib/axiosInstance';

interface FinancialReportItem {
    category: string;
    amount: number;
}

interface FinancialReport {
    profitAndLoss: FinancialReportItem[];
    balanceSheet: FinancialReportItem[];
    cashFlow: FinancialReportItem[];
}

const FinancialReports: React.FC = () => {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [reportType, setReportType] = React.useState('profitAndLoss');

    const { data, isLoading, error } = useQuery<FinancialReport>(
        ['financialReport', dateRange, reportType],
        async () => {
            if (!dateRange?.from || !dateRange?.to) {
                throw new Error("Date range is not set");
            }
            const response = await axiosInstance.get('/reports/financial', {
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
        // Implement export functionality here
        console.log("Exporting financial report...");
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error fetching financial report: {(error as Error).message}</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-4">
                        <DatePickerWithRange
                            date={dateRange}
                            setDate={setDateRange}
                        />
                        <Select value={reportType} onValueChange={setReportType}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="profitAndLoss">Profit and Loss</SelectItem>
                                <SelectItem value="balanceSheet">Balance Sheet</SelectItem>
                                <SelectItem value="cashFlow">Cash Flow</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleExport}>Export Report</Button>
                </div>

                {data ? (
                    <Tabs defaultValue="profitAndLoss" value={reportType} onValueChange={setReportType}>
                        <TabsList>
                            <TabsTrigger value="profitAndLoss">Profit and Loss</TabsTrigger>
                            <TabsTrigger value="balanceSheet">Balance Sheet</TabsTrigger>
                            <TabsTrigger value="cashFlow">Cash Flow</TabsTrigger>
                        </TabsList>
                        <TabsContent value="profitAndLoss">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.profitAndLoss.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell>${item.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                        <TabsContent value="balanceSheet">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.balanceSheet.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell>${item.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                        <TabsContent value="cashFlow">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.cashFlow.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.category}</TableCell>
                                            <TableCell>${item.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div>No data available. Please select a date range and report type.</div>
                )}
            </CardContent>
        </Card>
    );
};

export default FinancialReports;
