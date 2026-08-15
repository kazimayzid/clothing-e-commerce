import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";

type SocialLink = {
  name: string;
  href: string;
  icon: React.ElementType;
};

const socialLinks: SocialLink[] = [
  {
    name: "Facebook",
    href: "https://facebook.com",
    icon: FaFacebookF,
  },
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: FaInstagram,
  },
  {
    name: "YouTube",
    href: "https://youtube.com",
    icon: FaYoutube,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    icon: FaLinkedinIn,
  },
  {
    name: "X",
    href: "https://x.com",
    icon: FaXTwitter,
  },
];

export default function SocialLinks() {
  return (
    <div className="flex items-center gap-3 mt-5">
      {socialLinks.map(({ name, href, icon: Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          className="
            flex h-10 w-10 items-center justify-center
            rounded-full
            bg-black text-white
            transition-all duration-300
            hover:bg-muted hover:text-black
          "
        >
          <Icon size={17} />
        </a>
      ))}
    </div>
  );
}