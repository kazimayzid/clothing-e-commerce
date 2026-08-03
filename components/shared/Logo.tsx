export default function Logo() {
  return (
    <div className="inline-flex items-center gap-2">
      <svg width="32" height="32" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#4F46E5" />
        <path d="M12 26L20 12L28 26H12Z" fill="white" />
      </svg>
      <span className="text-lg font-semibold text-gray-900">
        Brand
      </span>
    </div>
  );
}