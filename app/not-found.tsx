
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#fafafa] text-[#202329]">
     

      {/* 404 Content */}
      <section className="mx-auto flex max-w-[1440px] flex-col items-center px-5 pb-20 pt-12 text-center sm:px-10 sm:pt-16">
        {/* Illustration */}
        <div className="relative flex h-[300px] w-full max-w-[650px] items-center justify-center sm:h-[390px]">
          {/* Background 404 */}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[150px] font-bold leading-none tracking-tighter text-[#e5e7e9] sm:text-[240px]">
            404
          </span>

          {/* Illustration composition */}
          <div className="relative z-10 mt-12 flex items-end justify-center gap-3 sm:gap-8">
            {/* Plant */}
            <div className="mb-3 flex h-28 w-20 flex-col items-center justify-end sm:h-36 sm:w-24">
              <div className="relative h-20 w-16 sm:h-24 sm:w-20">
                <span className="absolute bottom-0 left-1/2 h-16 w-1 -translate-x-1/2 bg-[#71806b]" />
                <span className="absolute left-1 top-7 h-7 w-12 -rotate-45 rounded-full bg-[#84947c]" />
                <span className="absolute right-0 top-2 h-8 w-12 rotate-45 rounded-full bg-[#9aa58f]" />
                <span className="absolute left-3 top-0 h-8 w-10 -rotate-12 rounded-full bg-[#73856b]" />
                <span className="absolute bottom-3 right-0 h-7 w-10 rotate-45 rounded-full bg-[#71806b]" />
              </div>
              <div className="h-9 w-16 rounded-b-lg bg-[#d9d4d0] shadow-sm sm:w-20" />
            </div>

            {/* Person */}
            <div className="relative flex flex-col items-center">
              {/* Question mark */}
              <span className="absolute -top-10 right-0 text-4xl font-semibold text-gray-400 sm:-top-12 sm:text-5xl">
                ?
              </span>

              {/* Head */}
              <div className="relative z-20 h-[76px] w-[68px] rounded-[45%] border border-[#b68b6d] bg-[#e8b18b] sm:h-[92px] sm:w-[82px]">
                {/* Hair */}
                <div className="absolute -top-2 left-0 h-12 w-full rounded-t-[45%] bg-[#292626]" />
                <div className="absolute left-0 top-5 h-10 w-4 rounded-full bg-[#292626]" />
                <div className="absolute right-0 top-5 h-9 w-3 rounded-full bg-[#292626]" />

                {/* Face */}
                <div className="absolute left-4 top-10 h-1 w-2 rounded-full bg-[#292626] sm:left-5 sm:top-12" />
                <div className="absolute right-4 top-10 h-1 w-2 rounded-full bg-[#292626] sm:right-5 sm:top-12" />
                <div className="absolute bottom-4 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full bg-[#a65d50]" />
              </div>

              {/* Body */}
              <div className="relative -mt-1 h-28 w-28 rounded-t-[35px] bg-[#25272c] sm:h-36 sm:w-36">
                <div className="absolute left-1/2 top-0 h-12 w-9 -translate-x-1/2 rounded-b-xl bg-[#e8b18b]" />
                <div className="absolute left-3 top-8 h-16 w-7 rotate-12 rounded-full bg-[#34363b]" />
                <div className="absolute right-3 top-8 h-16 w-7 -rotate-12 rounded-full bg-[#34363b]" />
              </div>

              {/* Legs */}
              <div className="relative -mt-1 flex gap-1">
                <div className="h-24 w-12 -rotate-6 rounded-b-[24px] bg-[#eee4d8] sm:h-32 sm:w-16" />
                <div className="h-24 w-12 rotate-6 rounded-b-[24px] bg-[#f6eee4] sm:h-32 sm:w-16" />
              </div>

              {/* Shoes */}
              <div className="flex -mt-2 gap-2">
                <div className="h-5 w-14 rounded-full bg-white shadow sm:w-16" />
                <div className="h-5 w-14 rounded-full bg-white shadow sm:w-16" />
              </div>
            </div>

            {/* Shopping bag */}
            <div className="relative mb-4 flex h-28 w-20 items-center justify-center border border-[#d8d2ce] bg-[#f7f2ed] shadow-sm sm:h-36 sm:w-28">
              <div className="absolute -top-7 h-8 w-9 rounded-t-full border-2 border-b-0 border-[#bcb5b0]" />
              <span className="text-sm font-light tracking-[0.2em] sm:text-base">
                LUNE
              </span>
            </div>
          </div>

          {/* Ground */}
          <div className="absolute bottom-5 left-1/2 h-3 w-[80%] -translate-x-1/2 rounded-full bg-gray-200/70 blur-sm" />
        </div>

        {/* Message */}
        <div className="mt-6 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-gray-500">
            Error 404
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Oops! Page Not Found
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-gray-500 sm:text-lg">
            The page you are looking for might have been removed,
            had its name changed, or is temporarily unavailable.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-9 flex w-full flex-col items-center gap-5 sm:w-auto">
          <Link
            href="/"
            className="group flex w-full items-center justify-center gap-5 rounded-xl bg-[#202329] px-8 py-4 text-sm font-medium text-white transition hover:bg-black sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Go Back Home
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/shop"
            className="group flex items-center gap-2 text-sm text-gray-500 transition hover:text-black"
          >
            Or explore our latest collections
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Service Highlights */}
      
    </main>
  );
}

function ServiceItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4 sm:justify-center">
      <div className="text-gray-500 [&_svg]:h-7 [&_svg]:w-7">
        {icon}
      </div>

      <div>
        <h2 className="text-sm font-medium text-gray-700">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}