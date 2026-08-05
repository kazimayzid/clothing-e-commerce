import FavoriteButton from "../shared/FavaouriteButton";
import CartButton from "./Cart";
import SearchBar from "./Search";

export default function Actions() {
    return (
        <div className="flex gap-1 md:gap-2">
        <SearchBar/>
        <FavoriteButton/>
        <CartButton/>
        </div>
        
    )
}