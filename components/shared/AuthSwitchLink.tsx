import Link from "next/link";

type AuthSwitchLinkProps = {
  message: string;
  linkText: string;
  href: string;
};

export default function AuthSwitchLink({
  message,
  linkText,
  href,
}: AuthSwitchLinkProps) {
  return (
    <>

       <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-neutral-400 tracking-luxury text-[10px]">
              Or
            </span>
          </div>
        </div>

      <p className="mt-6 text-sm text-neutral-400">
        {message}{" "}
        <Link
          href={href}
          className="font-medium text-foreground hover:underline"
        >
          {linkText}
        </Link>
      </p>
    </>
  );
}