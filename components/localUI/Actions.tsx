import FavoriteButton from "../shared/FavaouriteButton";
import UserButton from "../shared/UserButton";
import CartButton from "./Cart";
import SearchBar from "./Search";

export default function Actions() {
  return (
    <div className="flex items-center">
      <div className="hidden items-center gap-[15px] md:flex">
        <SearchBar />
        <FavoriteButton />
        <CartButton />
        <UserButton />
      </div>
      <div className="flex items-center gap-1 md:hidden">
        <SearchBar />
        <CartButton />
      </div>
    </div>
  );
}
