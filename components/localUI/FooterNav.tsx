import React from 'react';
import Link from 'next/link';

interface FooterSection {
  title: string;
  links: { label: string; href: string }[];
}

const footerNavData: FooterSection[] = [
  {
    title: 'HELP',
    links: [
      { label: 'FAQS', href: '/faqs' },
      { label: 'DELIVERY & SHIPPING', href: '/shipping' },
      { label: 'RETURNS & EXCHANGES', href: '/returns' },
      { label: 'SIZE GUIDES', href: '/size-guide' },
      { label: 'CONTACT US', href: '/contact' },
      { label: 'TRACK MY ORDER', href: '/track-order' },
    ],
  },
  {
    title: 'LEGAL',
    links: [
      { label: 'TERMS AND CONDITIONS', href: '/terms' },
      { label: 'PRIVACY POLICY', href: '/privacy' },
      { label: 'COOKIE POLICY', href: '/cookies' },
      { label: 'ACCESSIBILITY POLICY', href: '/accessibility' },
      { label: 'ETHICAL TRADING POLICY', href: '/ethical-trading' },
    ],
  },
  {
    title: 'MORE INFO',
    links: [
      { label: 'ABOUT US', href: '/about' },
      { label: 'FIND A STORE', href: '/stores' },
      { label: 'GIFT VOUCHERS', href: '/gift-cards' },
      { label: 'AFFILIATE PROGRAMME', href: '/affiliates' },
      { label: 'STUDENT DISCOUNT', href: '/student-discount' },
      { label: 'WHOLESALE PARTNERSHIPS', href: '/wholesale' },
    ],
  },
];

export default function FooterNav() {
  return (
    <footer className="w-full  py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
          {footerNavData.map((section) => (
            <div key={section.title} className="flex flex-col space-y-4">
              {/* Column Header */}
              <h3 className="text-xs font-bold tracking-[0.15em] text-brand uppercase">
                {section.title}
              </h3>

              {/* Navigation Links */}
              <ul className="flex flex-col space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="cursor-pointer text-[11px] font-normal tracking-wide text-background uppercase transition-colors duration-200 hover:text-muted hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}