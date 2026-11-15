import {
  CircleDollarSign,
  Clock3,
  ShoppingBag,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type DashboardMetric = {
  label: string;
  value: string;
  change: string;
  note: string;
  icon: LucideIcon;
  trend: "up" | "attention";
};

export const dashboardMetrics: DashboardMetric[] = [
  { label: "Total Revenue", value: "$48,294", change: "+12.8%", note: "vs. last month", icon: CircleDollarSign, trend: "up" },
  { label: "Total Orders", value: "1,284", change: "+8.2%", note: "vs. last month", icon: ShoppingBag, trend: "up" },
  { label: "Net Profit", value: "$18,642", change: "+6.4%", note: "vs. last month", icon: Wallet, trend: "up" },
  { label: "Total Customers", value: "846", change: "+4.6%", note: "vs. last month", icon: UsersRound, trend: "up" },
  { label: "Pending Orders", value: "24", change: "Needs attention", note: "ready to review", icon: Clock3, trend: "attention" },
];

export const weeklySalesSample = [
  { day: "Mon", value: 44 },
  { day: "Tue", value: 66 },
  { day: "Wed", value: 52 },
  { day: "Thu", value: 78 },
  { day: "Fri", value: 59 },
  { day: "Sat", value: 92 },
  { day: "Sun", value: 70 },
];

export const recentOrderSamples = [
  { id: "#LC-2048", customer: "Amelia Rose", initials: "AR", date: "12 Nov, 2026", amount: "$248.00", status: "Processing" },
  { id: "#LC-2047", customer: "Oliver James", initials: "OJ", date: "12 Nov, 2026", amount: "$186.50", status: "Shipped" },
  { id: "#LC-2046", customer: "Sophia Bennett", initials: "SB", date: "11 Nov, 2026", amount: "$324.00", status: "Delivered" },
  { id: "#LC-2045", customer: "Noah Williams", initials: "NW", date: "11 Nov, 2026", amount: "$92.00", status: "Pending" },
];

export const bestSellerSamples = [
  { name: "The Form Tote", category: "Bags", units: "128 sold", revenue: "$12,480" },
  { name: "Lune Knit Cardigan", category: "Clothing", units: "96 sold", revenue: "$9,120" },
  { name: "Everyday Leather Loafer", category: "Shoes", units: "74 sold", revenue: "$8,140" },
];

export const inventorySamples = [
  { label: "Total products", value: "248", note: "Across all categories" },
  { label: "Low stock", value: "12", note: "Below reorder threshold" },
  { label: "Out of stock", value: "4", note: "Currently unavailable" },
];
