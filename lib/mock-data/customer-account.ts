import { mockProducts20 } from "@/Data/mockProducts";

export type CustomerAddress = {
  id: string;
  name: string;
  phone: string;
  type: "Home" | "Office";
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  isDefault: boolean;
};

export type AccountOrderStatus =
  | "PROCESSING"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export type CustomerOrderItem = {
  id: string;
  slug: string;
  name: string;
  imageSrc: string;
  sku: string;
  variant: string;
  quantity: number;
  unitPrice: number;
};

export type TrackingEvent = {
  title: string;
  description: string;
  date: string | null;
};

export type CustomerOrder = {
  id: string;
  number: string;
  placedAt: string;
  deliveredAt: string | null;
  status: AccountOrderStatus;
  paymentStatus: "Paid" | "Refunded";
  items: CustomerOrderItem[];
  shipping: CustomerAddress;
  courier: string;
  trackingNumber: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  tracking: TrackingEvent[];
};

function productItem(
  productId: string,
  sku: string,
  variant: string,
  quantity: number,
  unitPrice: number,
): CustomerOrderItem {
  const product = mockProducts20.find((entry) => entry.id === productId);
  if (!product) throw new Error(`Missing customer account mock product: ${productId}`);
  return {
    id: product.id,
    slug: product.slug,
    name: product.title,
    imageSrc: product.imageSrc,
    sku,
    variant,
    quantity,
    unitPrice,
  };
}

function trackingFor(status: AccountOrderStatus, placedAt: string, deliveredAt: string | null = null): TrackingEvent[] {
  const placedTime = new Date(placedAt).getTime();
  const hoursAfterPlaced = (hours: number) => new Date(placedTime + hours * 60 * 60 * 1000).toISOString();
  const stages = [
    ["Order placed", "We received your order.", placedAt],
    ["Order confirmed", "Your payment and order details were confirmed.", hoursAfterPlaced(2)],
    ["Processing", "Your items are being prepared with care.", hoursAfterPlaced(22)],
    ["Shipped", "Your parcel has left our fulfilment centre.", hoursAfterPlaced(48)],
    ["In transit", "Your parcel is travelling to the local delivery hub.", hoursAfterPlaced(72)],
    ["Delivered", "Your order has been delivered.", deliveredAt ?? hoursAfterPlaced(120)],
  ] as const;
  const progress: Record<AccountOrderStatus, number> = {
    PROCESSING: 2,
    SHIPPED: 3,
    IN_TRANSIT: 4,
    DELIVERED: 5,
    CANCELLED: 1,
  };
  return stages.map(([title, description, date], index) => ({
    title,
    description,
    date: index <= progress[status] ? date : null,
  }));
}

export const customerAccountProfile = {
  name: "Maizid Hasan",
  email: "maizid.hasan@example.com",
  phone: "+44 7700 900 248",
  createdAt: "2024-08-16T09:00:00+06:00",
  emailVerified: true,
};

export const mockCustomerAddresses: CustomerAddress[] = [
  {
    id: "address-home",
    name: "Maizid Hasan",
    phone: "+44 7700 900 248",
    type: "Home",
    line1: "24 Willow Lane",
    line2: "Flat 3B",
    city: "London",
    postcode: "N1 7GU",
    isDefault: true,
  },
  {
    id: "address-office",
    name: "Maizid Hasan",
    phone: "+44 7700 900 248",
    type: "Office",
    line1: "18 King Street",
    line2: "Floor 2",
    city: "London",
    postcode: "W6 0QA",
    isDefault: false,
  },
];

export const mockWishlistProducts = [
  { ...productItem("prod-102", "LC-SH-102-WHT", "White · M", 1, 69.5), previousPrice: 79.5, availability: "In stock" as const },
  { ...productItem("prod-104", "LC-BG-104-BLK", "Matte Black · One Size", 1, 75), previousPrice: null, availability: "In stock" as const },
  { ...productItem("prod-105", "LC-KN-105-CHR", "Charcoal Grey · L", 1, 79.95), previousPrice: null, availability: "Low stock" as const },
  { ...productItem("prod-106", "LC-SH-106-TAN", "Tan · 42", 1, 110), previousPrice: null, availability: "Unavailable" as const },
];

const homeAddress = mockCustomerAddresses[0];

export const mockCustomerOrders: CustomerOrder[] = [
  {
    id: "order-260118",
    number: "LC-260118",
    placedAt: "2026-11-21T09:45:00+06:00",
    deliveredAt: null,
    status: "PROCESSING",
    paymentStatus: "Paid",
    items: [productItem("prod-101", "LC-PO-101-PBL", "Petrol Blue · L", 1, 59.95), productItem("prod-105", "LC-KN-105-CHR", "Charcoal Grey · L", 1, 79.95)],
    shipping: homeAddress,
    courier: "Royal Mail",
    trackingNumber: "RM-UI-620118",
    subtotal: 139.9,
    discount: 0,
    shippingFee: 4.95,
    tax: 0,
    total: 144.85,
    tracking: trackingFor("PROCESSING", "2026-11-21T09:45:00+06:00"),
  },
  {
    id: "order-260104",
    number: "LC-260104",
    placedAt: "2026-11-12T13:10:00+06:00",
    deliveredAt: null,
    status: "IN_TRANSIT",
    paymentStatus: "Paid",
    items: [productItem("prod-104", "LC-BG-104-BLK", "Matte Black · One Size", 1, 75), productItem("prod-106", "LC-SH-106-TAN", "Tan · 42", 1, 110)],
    shipping: homeAddress,
    courier: "DHL Express",
    trackingNumber: "DHL-UI-7842106",
    subtotal: 185,
    discount: 10,
    shippingFee: 4.95,
    tax: 0,
    total: 179.95,
    tracking: trackingFor("IN_TRANSIT", "2026-11-12T13:10:00+06:00"),
  },
  {
    id: "order-251233",
    number: "LC-251233",
    placedAt: "2026-10-28T11:25:00+06:00",
    deliveredAt: "2026-11-02T16:40:00+06:00",
    status: "DELIVERED",
    paymentStatus: "Paid",
    items: [productItem("prod-102", "LC-SH-102-WHT", "White · M", 1, 69.5), productItem("prod-103", "LC-SH-103-OAT", "Oatmeal · 38", 1, 89)],
    shipping: homeAddress,
    courier: "Royal Mail",
    trackingNumber: "RM-UI-6251233",
    subtotal: 158.5,
    discount: 8.5,
    shippingFee: 4.95,
    tax: 0,
    total: 154.95,
    tracking: trackingFor("DELIVERED", "2026-10-28T11:25:00+06:00", "2026-11-02T16:40:00+06:00"),
  },
  {
    id: "order-251207",
    number: "LC-251207",
    placedAt: "2026-10-10T15:05:00+06:00",
    deliveredAt: "2026-10-14T12:15:00+06:00",
    status: "DELIVERED",
    paymentStatus: "Paid",
    items: [productItem("prod-105", "LC-KN-105-NVY", "Navy · M", 1, 76)],
    shipping: homeAddress,
    courier: "DPD",
    trackingNumber: "DPD-UI-3125207",
    subtotal: 76,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    total: 76,
    tracking: trackingFor("DELIVERED", "2026-10-10T15:05:00+06:00", "2026-10-14T12:15:00+06:00"),
  },
  {
    id: "order-251199",
    number: "LC-251199",
    placedAt: "2026-09-26T10:30:00+06:00",
    deliveredAt: null,
    status: "CANCELLED",
    paymentStatus: "Refunded",
    items: [productItem("prod-101", "LC-PO-101-NVY", "Navy · M", 1, 59.95)],
    shipping: homeAddress,
    courier: "—",
    trackingNumber: "—",
    subtotal: 59.95,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    total: 59.95,
    tracking: trackingFor("CANCELLED", "2026-09-26T10:30:00+06:00"),
  },
];

export const formatAccountPrice = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export const formatAccountDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/London" }).format(new Date(value));

export const formatAccountDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }).format(new Date(value));
