import FavoriteButton from "../shared/FavaouriteButton";
import UserButton from "../shared/UserButton";
import CartButton from "./Cart";
import SearchBar from "./Search";

export default function Actions() {
  return (
    <div className="flex items-center gap-1 md:gap-[15px]">
      <SearchBar />
      <FavoriteButton />
      <CartButton />
      <div className="hidden md:block">
        <UserButton />
      </div>
    </div>
  );
}
