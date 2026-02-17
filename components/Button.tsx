import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>{
    children: ReactNode;
    onClick?: () => void;
    href?: string;
    className?: string;
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary";
}

export default function Button({
    children,
    onClick,
    href,
    className = "",
    type = "button",
    variant = "primary"
} : ButtonProps) {

    const baseStyles = `
        inline-flex items-center justify-center
        px-8 py-3 rounded-full font-bold text-sm tracking-wide
        transition-all duration-300 ease-out transform
        active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
    `;

    const variants = {
        primary: `
            bg-white text-black 
            hover:bg-gray-100 
            shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_35px_rgba(255,255,255,0.5)]
            border border-transparent
        `,
        secondary: `
            bg-white/5 text-white 
            backdrop-blur-md border border-white/20
            hover:bg-white/10 hover:border-white/50
            shadow-none
        `,
    };

    const finalClass = `${baseStyles} ${variants[variant]} ${className}`;

    // navigation case
    if (href) {
        return (
            <Link href={href} className={finalClass}>
                {children}
            </Link>
        );
    }

    // normal button
    return (
        <button
            type={type}
            onClick={onClick}
            className={finalClass}>
            {children}
        </button>
    );
}