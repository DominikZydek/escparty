"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackArrowProps {
  className?: string;
  label?: string;
}

export default function BackArrow({
  className = "",
  label = "Go back",
}: BackArrowProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      type="button"
      className={`
        group flex items-center gap-3 
        text-white hover:text-white/80 
        transition-all duration-300 ease-out
        cursor-pointer bg-transparent border-none p-0
        ${className}
      `}
    >
      <ArrowLeft className="w-8 h-8 transition-transform duration-300 group-hover:-translate-x-0.5" />
      <span className="text-2xl font-bold tracking-wide select-none">
        {label}
      </span>
    </button>
  );
}
