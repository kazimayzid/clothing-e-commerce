import Container from "./Container";
import Logo from "../shared/Logo";
import Menu from "../ui/Menu";
import Actions from "../localUI/Actions";
import MobileMenu from "../localUI/MobileMenu";
import FavoriteButton from "../shared/FavaouriteButton";
import UserButton from "../shared/UserButton";

export default function Header() {
  return (
    <div className="sticky top-0 z-40 w-full border-b border-border/10 bg-background/80 backdrop-blur-md transition-all">
      <Container>
        <div className="relative flex items-center justify-between py-2">
          <MobileMenu
            actions={
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <FavoriteButton />
                  <span className="text-sm">Wishlist</span>
                </div>
                <div className="flex items-center gap-3">
                  <UserButton variant="mobile" />
                </div>
              </div>
            }
          />
          <Logo className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0" />
          <Menu />
          <Actions />
        </div>
      </Container>
    </div>
  );
}
