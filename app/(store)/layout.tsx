import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { CartContext } from "@/contexts/cartContext";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      {children}

      <Footer />
    </>
  );
}
