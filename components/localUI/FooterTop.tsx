import Logo from "../shared/Logo";
import SocialLinks from "../shared/SocialLink";
import Tagline from "../shared/Tagline";

export default function FooterTop() {
    return (
        <div className="mt-5">

            <Logo size={50} textColor={"text-muted"} textSize={"text-2xl"}/> 
            <Tagline/>
            <SocialLinks/>
        </div>
    )
}