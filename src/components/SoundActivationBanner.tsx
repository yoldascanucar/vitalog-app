"use client";

import { useAlarm } from "@/context/AlarmContext";
import { Volume2, VolumeX } from "lucide-react";

export function SoundActivationBanner() {
    const { audioEnabled, enableAudio } = useAlarm();

    if (audioEnabled) return null;

    return (
        <div className="sticky top-0 z-[60] flex items-center justify-between bg-emerald-600 px-4 py-3 text-white shadow-lg animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2">
                    <VolumeX className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-sm font-black leading-none">SES KAPALI</h3>
                    <p className="mt-1 text-[10px] font-bold opacity-80 uppercase tracking-wider">Alarmlar için sesi açın</p>
                </div>
            </div>
            <button
                onClick={enableAudio}
                className="rounded-xl bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-sm active:scale-95 transition-all"
            >
                AKTİF ET
            </button>
        </div>
    );
}
