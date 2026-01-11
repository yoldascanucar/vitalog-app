"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ ease: "easeOut", duration: 0.3 }}
            className="flex-1 overflow-y-auto pb-24" // padding-bottom for BottomNav
        >
            {children}
        </motion.div>
    );
}
