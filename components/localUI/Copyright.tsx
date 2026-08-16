import React from 'react';
import Link from 'next/link';

export default function Copyright() {
  const currentYear = new Date().getFullYear();

  return (
        
        <p className="text-[11px] tracking-wide text-neutral-500 uppercase py-2 text-center">
          © {currentYear} Charles & Keith. All Rights Reserved.
        </p>
  );
}