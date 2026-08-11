type LogoProps = {
  size?: number;
  iconBg?: string;
  iconColor?: string;
  textColor?: string;
  textSize?: string;
  className?: string;
  showText?: boolean;
};

export default function Logo({
  size = 32,
  iconBg = "#4F46E5",
  iconColor = "#FFFFFF",
  textColor = "text-gray-900",
  textSize = "text-lg",
  className = "",
  showText = true,
}: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Brand logo"
      >
        <rect
          width="40"
          height="40"
          rx="8"
          fill={iconBg}
        />

        <path
          d="M12 26L20 12L28 26H12Z"
          fill={iconColor}
        />
      </svg>

      {showText && (
        <span className={`${textSize} font-semibold ${textColor}`}>
          Brand
        </span>
      )}
    </div>
  );
}