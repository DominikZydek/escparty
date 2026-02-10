"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackArrowProps {
  className?: string;
}

export default function BackArrow({ className }: BackArrowProps) {
    const router = useRouter();
    const iconStyle = `w-10 h-10 text-white hover:text-gray-300 transition-colors cursor-pointer ${className}`;
  return (
    <button
      onClick={() => router.back()}
      type="button"
      className="bg-transparent border-none p-0"
    >
      <ArrowLeft className={iconStyle} />
    </button>
  );
}
