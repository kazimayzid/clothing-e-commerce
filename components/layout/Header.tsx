import Container from "./Container";
import Logo from "../shared/Logo";
import Menu from "../ui/Menu";
import Actions from "../localUI/Actions";

export default function Header() {
  return (
    <div className="sticky top-0 z-40 w-full border-b border-border/10 bg-background/80 backdrop-blur-md transition-all">
      <Container>
        <div className="flex justify-between py-2">
          <Logo />
          <Menu />
          <Actions />
        </div>
      </Container>
    </div>
  );
}
