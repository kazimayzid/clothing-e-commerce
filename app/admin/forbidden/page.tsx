import Link from "next/link";

export default function AdminForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Access denied
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-neutral-900">
          You don’t have permission to view this page.
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          If you need access to the administration dashboard, ask a Super Admin
          to assign the required role permission.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/admin/sign-in"
            className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Admin sign in
          </Link>
          <Link
            href="/"
            className="rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Back to store
          </Link>
        </div>
      </section>
    </main>
  );
}
