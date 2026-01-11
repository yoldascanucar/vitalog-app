"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={pathname}
                initial={{ opacity: 0, x: "-100%" }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: "100%" }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 1,
                    duration: 0.3
                }}
                className="flex-1 flex flex-col relative h-full w-full bg-zinc-950 overflow-y-auto overflow-x-hidden"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
