import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import OrderCard from "@/components/account/OrderCard";
import {
  customerAccountProfile,
  mockCustomerAddresses,
  mockCustomerOrders,
  mockWishlistProducts,
  formatAccountPrice,
} from "@/lib/mock-data/customer-account";

const summary = [
  {
    label: "Total orders",
    value: mockCustomerOrders.length,
    icon: ShoppingBag,
    href: "/account/orders",
  },
  {
    label: "Active orders",
    value: mockCustomerOrders.filter(
      ({ status }) =>
        status === "PROCESSING" ||
        status === "SHIPPED" ||
        status === "IN_TRANSIT",
    ).length,
    icon: Truck,
    href: "/account/orders",
  },
  {
    label: "Delivered",
    value: mockCustomerOrders.filter(({ status }) => status === "DELIVERED")
      .length,
    icon: PackageCheck,
    href: "/account/orders",
  },
  {
    label: "Wishlist",
    value: mockWishlistProducts.length,
    icon: Heart,
    href: "/account/wishlist",
  },
];

export default function AccountOverviewPage() {
  const initials = customerAccountProfile.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const defaultAddress = mockCustomerAddresses.find(
    ({ isDefault }) => isDefault,
  );

  return (
    <>
      <AccountPageHeader
        eyebrow="YOUR LUNECRAFT ACCOUNT"
        title={`Welcome back, ${customerAccountProfile.name.split(" ")[0]}`}
        description="A little space to keep your orders, saved pieces and account details together."
        aside={
          <Link
            href="/account/profile"
            className="inline-flex items-center gap-2 text-[11px] text-stone-600 transition hover:text-stone-950"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-[#eee9df] font-serif text-sm text-stone-800">
              {initials}
            </span>
            Account details
            <ArrowRight className="size-3" />
          </Link>
        }
      />

      <section
        aria-label="Account summary"
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {summary.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group border border-stone-200 bg-white p-4 transition-colors hover:border-stone-400 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-stone-500 sm:text-[11px]">
                {label}
              </p>
              <Icon className="size-4 text-[#a88238]" strokeWidth={1.6} />
            </div>
            <p className="mt-4 font-serif text-[26px] leading-none text-stone-900">
              {value}
            </p>
          </Link>
        ))}
      </section>

      <section className="mt-9 sm:mt-11">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[9px] tracking-[0.18em] text-[#9b7a3b]">
              YOUR PURCHASES
            </p>
            <h2 className="mt-1 font-serif text-xl text-stone-900 sm:text-2xl">
              Recent orders
            </h2>
          </div>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-[10px] text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-950"
          >
            View all orders
            <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {mockCustomerOrders.slice(0, 3).map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>

      <div className="mt-9 grid gap-8 border-t border-stone-200 pt-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(230px,0.8fr)] sm:mt-11 sm:pt-9">
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] tracking-[0.18em] text-[#9b7a3b]">
                SAVED FOR LATER
              </p>
              <h2 className="mt-1 font-serif text-xl text-stone-900 sm:text-2xl">
                Your wishlist
              </h2>
            </div>
            <Link
              href="/account/wishlist"
              className="inline-flex items-center gap-1.5 text-[10px] text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-950"
            >
              View wishlist
              <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {mockWishlistProducts.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.slug}`}
                className="group min-w-0"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#f1efeb]">
                  <Image
                    src={item.imageSrc}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 30vw, 20vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-2 line-clamp-1 text-[10px] text-stone-700 sm:text-xs">
                  {item.name}
                </p>
                <p className="mt-1 text-[10px] font-medium text-stone-900">
                  {formatAccountPrice(item.unitPrice)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {defaultAddress && (
          <section className="border border-stone-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] tracking-[0.16em] text-[#9b7a3b]">
                DEFAULT DELIVERY
              </p>
              <MapPin className="size-4 text-stone-400" />
            </div>
            <p className="mt-4 text-xs font-medium text-stone-900">
              {defaultAddress.name}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-stone-500">
              {defaultAddress.line1}
              <br />
              {defaultAddress.line2}
              <br />
              {defaultAddress.city}, {defaultAddress.postcode}
            </p>
            <Link
              href="/account/addresses"
              className="mt-5 inline-flex items-center gap-1.5 text-[10px] text-stone-600 underline decoration-stone-300 underline-offset-4"
            >
              Manage addresses
              <ArrowRight className="size-3" />
            </Link>
          </section>
        )}
      </div>
      <p className="mt-8 text-[10px] leading-5 text-stone-400">
        This account dashboard is a UI preview. Order, address and wishlist
        information shown is illustrative sample data.
      </p>
    </>
  );
}
