import {
  Activity,
  BarChart3,
  Boxes,
  FileBarChart2,
  Heart,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  Package,
  ReceiptText,
  RefreshCcw,
  Settings2,
  Truck,
  UserRoundCog,
  UsersRound,
  ShoppingBag,
} from "lucide-react";

export const adminNavigation = [
  {
    label: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview of your store's performance.", superAdminOnly: true },
      { id: "analytics", label: "Analytics", icon: BarChart3, description: "Explore trends across your store.", superAdminOnly: true },
      { id: "sales-reports", label: "Sales & Reports", icon: FileBarChart2, description: "Review sales performance and reports.", superAdminOnly: true },
    ],
  },
  {
    label: "STORE MANAGEMENT",
    items: [
      { id: "orders", label: "Orders", icon: ShoppingBag, description: "Review and organize customer orders.", requiredPermission: "orders:read" },
      { id: "products", label: "Products", icon: Package, description: "Manage the products in your storefront.", requiredPermission: "products:read" },
      { id: "inventory", label: "Inventory", icon: Boxes, description: "Keep track of stock levels and availability.", requiredPermission: "inventory:read" },
      { id: "customers", label: "Customers", icon: UsersRound, description: "View customer profiles and activity.", requiredPermission: "users:read" },
      { id: "wishlist", label: "Wishlist", icon: Heart, description: "See products customers have saved.", requiredPermission: "users:read" },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { id: "marketing", label: "Marketing", icon: Megaphone, description: "Plan campaigns and customer offers.", requiredPermission: "__not_implemented__" },
      { id: "returns-refunds", label: "Returns & Refunds", icon: RefreshCcw, description: "Review return and refund requests.", requiredPermission: "orders:read" },
      { id: "shipping-delivery", label: "Shipping & Delivery", icon: Truck, description: "Monitor shipping and delivery operations.", requiredPermission: "shipping:read" },
      { id: "expenses", label: "Expenses", icon: ReceiptText, description: "Organize business expenses and costs.", requiredPermission: "__not_implemented__" },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { id: "admin-users", label: "Admin Users", icon: UserRoundCog, description: "Manage administrators, staff accounts, roles, and access to your store.", superAdminOnly: true },
      { id: "roles-permissions", label: "Roles & Permissions", icon: KeyRound, description: "Control what administrators and staff members can access and manage.", superAdminOnly: true },
      { id: "settings", label: "Settings", icon: Settings2, description: "Configure store and dashboard preferences.", superAdminOnly: true },
      { id: "activity-logs", label: "Activity Logs", icon: Activity, description: "Review recent changes across the store.", superAdminOnly: true },
    ],
  },
] as const;

export type AdminPageKey = (typeof adminNavigation)[number]["items"][number]["id"];

export function isAdminPageKey(value: string | undefined): value is AdminPageKey {
  return adminNavigation.some((group) =>
    group.items.some((item) => item.id === value),
  );
}

export function getAdminPage(value: AdminPageKey) {
  for (const group of adminNavigation) {
    const page = group.items.find((item) => item.id === value);
    if (page) return page;
  }
  return adminNavigation[0].items[0];
}
