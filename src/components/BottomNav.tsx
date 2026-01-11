"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, History, User, Pill, Settings, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export function BottomNav() {
    const pathname = usePathname();
    const { t } = useTranslation();

    // Hide on auth and landing pages
    if (pathname === "/login" || pathname === "/register" || pathname === "/") return null;

    const navItems = [
        { name: t('nav.medications'), href: "/medications", icon: Pill },
        { name: t('nav.add'), href: "/add-medicine", icon: PlusCircle },
        { name: t('nav.reports'), href: "/reports", icon: History },
        { name: t('nav.settings'), href: "/settings", icon: Settings },
        { name: t('nav.profile'), href: "/profile", icon: User },
        { name: t('nav.about'), href: "/about", icon: Info },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 w-full items-center justify-around border-t border-gray-200 bg-white px-4 pb-2 shadow-lg sm:absolute sm:bottom-0 sm:left-0 sm:right-0">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-1 min-w-0 flex-col items-center justify-center space-y-1 rounded-xl p-2 transition-colors",
                            isActive
                                ? "text-emerald-600"
                                : "text-gray-500 hover:text-gray-900"
                        )}
                    >
                        <Icon className={cn("h-6 w-6", isActive && "fill-current/10")} />
                        <span className="text-[9px] font-medium truncate w-full text-center">{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
