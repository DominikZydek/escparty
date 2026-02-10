"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
  options: string[];
  placeholder?: string;
  onSelect?: (value: string) => void;
  className?: string;
}

export default function Dropdown({
  options,
  placeholder = "Choose...",
  onSelect,
  className = "",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelected(option);
    setIsOpen(false);
    if (onSelect) onSelect(option);
  };

  const triggerStyles = `
    w-full flex items-center justify-between
    px-8 py-3 rounded-full font-bold text-sm tracking-wide
    bg-white/5 text-white 
    backdrop-blur-md border border-white/20
    hover:bg-white/10 hover:border-white/50
    transition-all duration-300 cursor-pointer
    ${isOpen ? "ring-2 ring-white/20" : ""}
    ${className}
  `;

  return (
    <div className="relative min-w-62.5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={triggerStyles}
      >
        <span className="truncate">{selected || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 ml-2 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 z-50 shadow-xl max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleSelect(option)}
              className={`
                px-4 py-2 rounded-xl text-sm text-white cursor-pointer transition-colors
                ${selected === option ? "bg-white/20 font-bold" : "hover:bg-white/10"}
              `}
            >
              {option}
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}
