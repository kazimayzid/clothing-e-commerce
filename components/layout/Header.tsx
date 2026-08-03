import Container from "./Container";
import Logo from "../shared/Logo";

export default function Header() {
  return (
    <div className="sticky top-0 z-40 w-full border-b border-border/10git bg-background/80 backdrop-blur-md transition-all">
      <Container>
        <Logo />
      </Container>
    </div>
  );
}
