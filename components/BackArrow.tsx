"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackArrowProps {
  className?: string;
  label?: string;
  onClick?: () => void;
}

export default function BackArrow({
  className = "",
  label = "Go back",
  onClick,
}: BackArrowProps) {
  const router = useRouter();

  const handleNavigation = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleNavigation}
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
