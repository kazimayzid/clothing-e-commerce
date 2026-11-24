export default function AccountPageHeader({
  eyebrow = "LUNECRAFT ACCOUNT",
  title,
  description,
  aside,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 border-b border-stone-200 pb-6 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:pb-7">
      <div className="min-w-0">
        <p className="mb-2 text-[9px] font-medium tracking-[0.2em] text-[#9b7a3b]">{eyebrow}</p>
        <h1 className="font-serif text-[30px] leading-tight tracking-tight text-stone-950 sm:text-[36px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-stone-500">{description}</p>
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  );
}
