import Container from "@/components/layout/Container";
import AccountNavigation from "@/components/account/AccountNavigation";

export default function AccountFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[65vh] bg-[#fbfaf8] pb-14 sm:pb-20">
      <Container className="py-7 sm:py-10 lg:py-12">
        <p className="mb-5 text-[10px] tracking-[0.14em] text-stone-400 sm:mb-7">
          <span>HOME</span><span className="mx-2">/</span><span className="text-stone-700">MY ACCOUNT</span>
        </p>
        <div className="grid min-w-0 gap-0 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[230px_minmax(0,1fr)] xl:gap-16">
          <AccountNavigation />
          <main className="min-w-0">{children}</main>
        </div>
      </Container>
    </div>
  );
}
