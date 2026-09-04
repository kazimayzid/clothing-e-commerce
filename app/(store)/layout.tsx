import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";


export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar/>
      <Header/>
      {children}

      <Footer/>
    </>
  );
}