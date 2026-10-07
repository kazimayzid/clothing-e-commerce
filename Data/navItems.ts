import type { LucideIcon } from "lucide-react";

import {
  Home,
  ShoppingBag,
  Package,
  UserRound,
} from "lucide-react";

export interface NavItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
  },

  {
    label: "Shop",
    href: "/shop",
    icon: ShoppingBag,

    children: [
      {
        label: "Men",
        children: [
          {
            label: "Shirt",
            href: "/shop?category=shirt",
          },
          {
            label: "Pant",
            href: "/shop?category=pant",
          },
          {
            label: "T-Shirt",
            href: "/shop?category=t-shirt",
          },
        ],
      },

      {
        label: "Women",
        children: [
          {
            label: "Dress",
            href: "/shop?category=dress",
          },
          {
            label: "Tops",
            href: "/shop?category=tops",
          },
        ],
      },

      {
        label: "Accessories",
        children: [
          {
            label: "Bags",
            href: "/shop?category=bags",
          },
          {
            label: "Wallets",
            href: "/shop?category=wallets",
          },
        ],
      },
    ],
  },

  {
    label: "My Orders",
    href: "/orders",
    icon: Package,
  },

  {
    label: "Account",
    href: "/account",
    icon: UserRound,
  },
];