import FooterBottom from "../localUI/FooterBottom";
import FooterNav from "../localUI/FooterNav";
import FooterTop from "../localUI/FooterTop";
import Container from "./Container";


export default function Footer() {
  return (
    <footer role="contentinfo" className="border-t border-muted/50 bg-foreground pt-8">
      <Container>
        {/* Row 1: brand + links side by side */}
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <FooterTop/>
          <FooterNav/>
        </div>

        {/* Row 2: legal bar, full width, separated by divider */}
        <div className="mt-10 border-t border-0 border-muted/50 pb-5">
          <FooterBottom/>
        </div>
      </Container>
    </footer>
  );
}