import { requireCustomer } from "@/lib/dal";

export default async function AccountPage() {
  const session = await requireCustomer();

  return (
    <main>
      <h1>My account</h1>
      <p>Welcome, {session.user.name}</p>

      <section>
        <h2>Order history and tracking</h2>
        <p>Your orders will appear here.</p>
      </section>

      <section>
        <h2>Wishlist</h2>
        <p>Your saved products will appear here.</p>
      </section>
    </main>
  );
}