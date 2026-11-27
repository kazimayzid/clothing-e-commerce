import Container from "./Container";
import Logo from "../shared/Logo";
import Menu from "../ui/Menu";
import Actions from "../localUI/Actions";
import MobileMenu from "../localUI/MobileMenu";
import UserButton from "../shared/UserButton";
import { getPublicCategoryNavigation } from "@/lib/product-category-service";
import type { NavItem } from "@/Data/navItems";

function toNavItem(node: Awaited<ReturnType<typeof getPublicCategoryNavigation>>[number]): NavItem {
  return { id: node.id, label: node.label, href: node.href, children: node.children.map(toNavItem) };
}

export default async function Header() {
  const categories = await getPublicCategoryNavigation();
  const items = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop", children: [{ label: "Shop all", href: "/shop" }, ...categories.map(toNavItem)] },
  ];
  return (
    <div className="sticky top-0 z-40 w-full border-b border-border/10 bg-background/80 backdrop-blur-md transition-all">
      <Container>
        <div className="relative flex items-center justify-between py-2">
          <MobileMenu items={items}
            actions={
              <div className="flex items-center gap-3">
                <UserButton variant="mobile" />
              </div>
            }
          />
          <Logo className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0" />
          <Menu items={items} />
          <Actions />
        </div>
      </Container>
    </div>
  );
}
