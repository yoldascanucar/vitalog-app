"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export default function LandingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex h-full w-full flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      {/* Video Background Layer */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover opacity-60"
        >
          <source
            src="https://cdn.pixabay.com/video/2020/09/13/49808-458438856_large.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/90 backdrop-blur-[1px]" />
      </div>

      {/* Main UI Content */}
      <div className="relative z-10 flex w-full flex-col items-center px-8 text-center">

        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/20 backdrop-blur-xl shadow-2xl ring-1 ring-emerald-500/40">
            <Heart className="h-10 w-10 text-emerald-400 fill-emerald-400/20" />
          </div>

          <h1 className="text-5xl font-black tracking-tighter text-white">
            Vita<span className="text-emerald-500">Log</span>
          </h1>
        </motion.div>

        {/* Tagline Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-12 space-y-4"
        >
          <p className="max-w-[280px] text-lg font-bold leading-tight text-gray-200">
            {t('landing.tagline')}
          </p>
          <div className="flex justify-center gap-1.5">
            <div className="h-1 w-2 rounded-full bg-emerald-500" />
            <div className="h-1 w-8 rounded-full bg-emerald-500/30" />
            <div className="h-1 w-2 rounded-full bg-emerald-500" />
          </div>
        </motion.div>

        {/* Buttons Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full max-w-[320px]"
        >
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push("/login")}
              className="group flex flex-col items-center gap-3 rounded-[28px] bg-white py-6 text-black shadow-2xl transition-all active:scale-95"
            >
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <LogIn className="h-6 w-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">{t('landing.login_btn')}</span>
            </button>

            <button
              onClick={() => router.push("/register")}
              className="group flex flex-col items-center gap-3 rounded-[28px] bg-emerald-600 py-6 text-white shadow-2xl transition-all active:scale-95"
            >
              <div className="rounded-xl bg-white/10 p-3 text-white">
                <UserPlus className="h-6 w-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">{t('landing.register_btn')}</span>
            </button>
          </div>
        </motion.div>

        {/* Footer Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.2 }}
          className="mt-12 text-[9px] font-black uppercase tracking-[0.35em] text-gray-500"
        >
          VitaLog Medical Systems © 2026
        </motion.p>
      </div>
    </div>
  );
}
