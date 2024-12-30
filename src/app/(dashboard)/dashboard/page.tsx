'use client'

import React, {useMemo} from 'react';
import {useQuery} from 'react-query';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';
import {
    CircleDollarSign,
    TrendingUp,
    Users,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingCart,
    Clock,
    Percent, Loader2, Calendar, CalendarDays, CalendarRange
} from 'lucide-react';
import axiosInstance from "@/lib/axiosInstance";

// Type definitions
interface SaleItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    unitPrice: number;
}

interface Sale {
    id: string;
    transactionNumber: string;
    customerName: string;
    customerId: string;
    saleDate: string;
    totalAmount: number;
    status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
    items: SaleItem[];
}

interface PaginatedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
}

interface DashboardMetrics {
    totalRevenue: number;
    completedSales: number;
    averageOrderValue: number;
    uniqueCustomers: number;
    growth: number;
    dailyTotal: number;
    weeklyTotal: number;
    monthlyTotal: number;
}

interface ChartDataPoint {
    date: string;
    revenue: number;
    orders: number;
}

interface ProductPerformance {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
    percentageOfTotal: number;
}

interface TimeBasedMetrics {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];


// Loading Spinner Component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center w-full h-full min-h-[100px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
);

// Card Loading Skeleton
const CardSkeleton = () => (
    <div className="bg-gray-100 animate-pulse rounded-lg p-6 h-full">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
    </div>
);

// Chart Loading Skeleton
const ChartSkeleton = () => (
    <div className="bg-gray-100 animate-pulse rounded-lg p-6 h-[300px]">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-full bg-gray-200 rounded"></div>
    </div>
);

// Modified MetricCard to handle loading state
const MetricCard: React.FC<MetricCardProps & { isLoading?: boolean }> = ({
                                                                             title,
                                                                             value,
                                                                             subtitle,
                                                                             icon,
                                                                             trend,
                                                                             className = "",
                                                                             isLoading = false
                                                                         }) => {
    if (isLoading) {
        return <CardSkeleton />;
    }

    return (
        <Card className={`${className} p-2`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                <CardTitle className="text-xs font-medium text-white">{title}</CardTitle>
                {icon && <div className="h-4 w-4">{icon}</div>}
            </CardHeader>
            <CardContent className="p-2">
                <div className="space-y-1">
                    <div className="text-xl font-bold text-white">
                        {value}
                    </div>
                    {trend && (
                        <div className="flex items-center text-xs text-white/80">
                            {trend.isPositive ? (
                                <ArrowUpRight className="h-3 w-3 text-green-300 mr-0.5"/>
                            ) : (
                                <ArrowDownRight className="h-3 w-3 text-red-300 mr-0.5"/>
                            )}
                            <span className="truncate">
                                {`${Math.abs(trend.value).toFixed(1)}% from last period`}
                            </span>
                        </div>
                    )}
                    {subtitle && (
                        <p className="text-xs text-white/80 truncate">
                            {subtitle}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const CustomTooltip = ({active, payload, label}: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-lg border">
                <p className="font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{color: entry.color}}>
                        {entry.name}: {formatCurrency(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Format currency helper
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS'
    }).format(amount);
};

const Dashboard: React.FC = () => {
    // Query with proper typing
    const {data: salesData, isLoading} = useQuery<PaginatedResponse<Sale>>(['sales-dashboard'],
        async () => {
            const response = await axiosInstance.get<PaginatedResponse<Sale>>('/sales/history', {
                params: {
                    page: 0,
                    size: 100,
                }
            });
            return response.data;
        }
    );

    // Calculate basic metrics
    const calculateMetrics = (): DashboardMetrics | null => {
        if (!salesData?.content) return null;

        const sales = salesData.content;
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const completedSales = sales.filter(sale => sale.status === 'COMPLETED').length;
        const averageOrderValue = totalRevenue / (sales.length || 1);
        const uniqueCustomers = new Set(sales.map(sale => sale.customerId)).size;

        const midPoint = Math.floor(sales.length / 2);
        const recentRevenue = sales.slice(0, midPoint).reduce((sum, sale) => sum + sale.totalAmount, 0);
        const previousRevenue = sales.slice(midPoint).reduce((sum, sale) => sum + sale.totalAmount, 0);
        const growth = previousRevenue === 0 ? 0 : ((recentRevenue - previousRevenue) / previousRevenue) * 100;

        // Calculate time-based totals
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const dailyTotal = sales
            .filter(sale => new Date(sale.saleDate) >= today)
            .reduce((sum, sale) => sum + sale.totalAmount, 0);

        const weeklyTotal = sales
            .filter(sale => new Date(sale.saleDate) >= weekStart)
            .reduce((sum, sale) => sum + sale.totalAmount, 0);

        const monthlyTotal = sales
            .filter(sale => new Date(sale.saleDate) >= monthStart)
            .reduce((sum, sale) => sum + sale.totalAmount, 0);

        return {
            totalRevenue,
            completedSales,
            averageOrderValue,
            uniqueCustomers,
            growth,
            dailyTotal,
            weeklyTotal,
            monthlyTotal
        };
    };

    // Calculate advanced metrics
    const calculateAdvancedMetrics = () => {
        if (!salesData?.content) return null;

        const sales = salesData.content;

        // Product performance analysis
        const productStats = sales.reduce((acc: Record<string, ProductPerformance>, sale) => {
            sale.items.forEach(item => {
                if (!acc[item.productId]) {
                    acc[item.productId] = {
                        productId: item.productId,
                        productName: item.productName,
                        quantity: 0,
                        revenue: 0,
                        percentageOfTotal: 0
                    };
                }
                acc[item.productId].quantity += item.quantity;
                acc[item.productId].revenue += item.totalPrice;
            });
            return acc;
        }, {});

        const totalRevenue = Object.values(productStats).reduce((sum, product) => sum + product.revenue, 0);
        Object.values(productStats).forEach(product => {
            product.percentageOfTotal = (product.revenue / totalRevenue) * 100;
        });

        // Time-based analysis
        const timeBasedSales = sales.reduce((acc: TimeBasedMetrics, sale) => {
            const hour = new Date(sale.saleDate).getHours();
            if (hour >= 5 && hour < 12) acc.morning += sale.totalAmount;
            else if (hour >= 12 && hour < 17) acc.afternoon += sale.totalAmount;
            else if (hour >= 17 && hour < 22) acc.evening += sale.totalAmount;
            else acc.night += sale.totalAmount;
            return acc;
        }, {morning: 0, afternoon: 0, evening: 0, night: 0});

        // Average ticket size by day of week
        const ticketsByDay = sales.reduce((acc: Record<string, number[]>, sale) => {
            const day = new Date(sale.saleDate).toLocaleDateString('en-US', {weekday: 'short'});
            if (!acc[day]) acc[day] = [];
            acc[day].push(sale.totalAmount);
            return acc;
        }, {});

        const avgTicketByDay = Object.entries(ticketsByDay).map(([day, tickets]) => ({
            day,
            avgTicket: tickets.reduce((sum, ticket) => sum + ticket, 0) / tickets.length
        }));

        return {
            productStats: Object.values(productStats),
            timeBasedSales,
            avgTicketByDay
        };
    };

    // Prepare chart data
    const prepareChartData = (): ChartDataPoint[] => {
        if (!salesData?.content) return [];

        const salesByDate: Record<string, ChartDataPoint> = salesData.content.reduce((acc, sale) => {
            const date = new Date(sale.saleDate).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = {date, revenue: 0, orders: 0};
            }
            acc[date].revenue += sale.totalAmount;
            acc[date].orders += 1;
            return acc;
        }, {} as Record<string, ChartDataPoint>);

        return Object.values(salesByDate);
    };

    const metrics = calculateMetrics();
    const advancedMetrics = useMemo(() => calculateAdvancedMetrics(), [salesData]);
    const chartData = prepareChartData();

    return (
        <div className="space-y-4 p-4 max-w-[1200px] mx-auto">
            {/* First row - Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Revenue"
                    value={metrics ? formatCurrency(metrics.totalRevenue) : 'Loading...'}
                    icon={<CircleDollarSign className="h-4 w-4 text-white"/>}
                    trend={metrics ? {
                        value: metrics.growth,
                        isPositive: metrics.growth >= 0
                    } : undefined}
                    className="bg-gradient-to-br from-blue-500 to-blue-600"
                />

                <MetricCard
                    title="Completed Orders"
                    value={metrics?.completedSales ?? 'Loading...'}
                    subtitle={metrics ? `Avg. ${formatCurrency(metrics.averageOrderValue)} per order` : ''}
                    icon={<TrendingUp className="h-4 w-4 text-white"/>}
                    className="bg-gradient-to-br from-purple-500 to-purple-600"
                />

                <MetricCard
                    title="Unique Customers"
                    value={metrics?.uniqueCustomers ?? 'Loading...'}
                    subtitle="Active buyers"
                    icon={<Users className="h-4 w-4 text-white"/>}
                    className="bg-gradient-to-br from-pink-500 to-pink-600"
                />

                <MetricCard
                    title="Products Sold"
                    value={salesData ? salesData.content.reduce((total, sale) =>
                        total + sale.items.reduce((sum, item) => sum + item.quantity, 0), 0
                    ) : 'Loading...'}
                    subtitle="Total units"
                    icon={<Package className="h-4 w-4 text-white"/>}
                    className="bg-gradient-to-br from-orange-500 to-orange-600"
                />
            </div>

            {/* Second row - Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Average Order Size"
                    value={metrics ? formatCurrency(metrics.averageOrderValue) : 'Loading...'}
                    subtitle="Average Order Size"
                    icon={<ShoppingCart className="h-4 w-4 text-white"/>}
                    className="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />

                <MetricCard
                    title="Peak Hours Revenue"
                    value={advancedMetrics ? formatCurrency(Math.max(
                        ...Object.values(advancedMetrics.timeBasedSales)
                    )) : 'Loading...'}
                    subtitle="Peek Hours Revenue"
                    icon={<Clock className="h-4 w-4 text-white"/>}
                    className="bg-gradient-to-br from-cyan-500 to-cyan-600"
                />

                <MetricCard
                    title="Conversion Rate"
                    value={`${((metrics?.completedSales || 0) / (salesData?.content.length || 1) * 100).toFixed(1)}%`}
                    subtitle="Conversion Rate"
                    icon={<Percent className="h-4 w-4 text-white"/>}
                    className="bg-gradient-to-br from-violet-500 to-violet-600"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Today's Sales"
                    value={metrics ? formatCurrency(metrics.dailyTotal) : 'Loading...'}
                    subtitle="Todays sales"
                    icon={<Calendar className="h-4 w-4 text-white"/>}
                    className="bg-gradient-to-br from-green-500 to-green-600"
                />

                <MetricCard
                    title="This Week's Sales"
                    value={metrics ? formatCurrency(metrics.weeklyTotal) : 'Loading...'}
                    subtitle="This Week's Sales"
                    icon={<CalendarDays className="h-4 w-4 text-white"/>}
                    className="bg-gradient-to-br from-teal-500 to-teal-600"
                />

                <MetricCard
                    title="This Month's Sales"
                    value={metrics ? formatCurrency(metrics.monthlyTotal) : 'Loading...'}
                    subtitle="Monthly Sales"
                    icon={<CalendarRange className="h-4 w-4 text-white"/>}
                    className="bg-gradient-to-br from-indigo-500 to-indigo-600"
                />
            </div>

            {/* Third row - Main Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {isLoading ? (
                            <LoadingSpinner/>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis dataKey="date"/>
                                    <YAxis/>
                                    <Tooltip/>
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Orders by Day</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {isLoading ? (
                            <LoadingSpinner/>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis dataKey="date"/>
                                    <YAxis/>
                                    <Tooltip/>
                                    <Bar
                                        dataKey="orders"
                                        fill="#8b5cf6"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Fourth row - Advanced Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Revenue by Product</CardTitle>
                        <CardDescription>Top products by revenue share</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {isLoading ? (
                            <LoadingSpinner/>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={advancedMetrics?.productStats.slice(0, 5)}
                                        dataKey="revenue"
                                        nameKey="productName"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label
                                    >
                                        {advancedMetrics?.productStats.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                        ))}
                                    </Pie>
                                    <Tooltip/>
                                    <Legend/>
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Sales by Time of Day</CardTitle>
                        <CardDescription>Revenue distribution across different times</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {isLoading ? (
                            <LoadingSpinner/>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={advancedMetrics ? Object.entries(advancedMetrics.timeBasedSales).map(([time, value]) => ({
                                        time,
                                        value
                                    })) : []}
                                >
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis dataKey="time"/>
                                    <YAxis/>
                                    <Tooltip content={<CustomTooltip/>}/>
                                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}/>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Avg. Ticket by Day</CardTitle>
                        <CardDescription>Average order value for each day</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={advancedMetrics?.avgTicketByDay}>
                                <CartesianGrid strokeDasharray="3 3"/>
                                <XAxis dataKey="day"/>
                                <YAxis/>
                                <Tooltip content={<CustomTooltip/>}/>
                                <Line
                                    type="monotone"
                                    dataKey="avgTicket"
                                    stroke="#82ca9d"
                                    strokeWidth={2}
                                    dot={{fill: '#82ca9d'}}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Fifth row - Top Products Table */}
            <div className="grid grid-cols-1 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Performing Products</CardTitle>
                        <CardDescription>Products with highest revenue contribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-8 bg-gray-100 rounded animate-pulse"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {advancedMetrics?.productStats
                                    .sort((a, b) => b.revenue - a.revenue)
                                    .slice(0, 5)
                                    .map((product, index) => (
                                        <div key={product.productId} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">{index + 1}.</span>
                                                <span>{product.productName}</span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className="text-gray-600">{product.quantity} units</span>
                                                <span className="font-medium">{formatCurrency(product.revenue)}</span>
                                                <span className="text-sm text-gray-500">
                                                    ({product.percentageOfTotal.toFixed(1)}%)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
