"use client";

import { Check, X, Pill, Clock, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlarmModalProps {
    medicationName: string;
    dosage: string;
    scheduledTime: string;
    onTaken: () => void;
    onMissed: () => void;
}

export function AlarmModal({ medicationName, dosage, scheduledTime, onTaken, onMissed }: AlarmModalProps) {
    const timeStr = new Date(scheduledTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with Blur and Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-2xl animate-in fade-in duration-500"></div>

            {/* Main Card */}
            <div className="relative w-full max-w-sm rounded-[40px] bg-white p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden">
                {/* Decorative Background Blob */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-400 rounded-full blur-[80px] opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-600 rounded-full blur-[80px] opacity-20 animate-pulse delay-700"></div>

                <div className="relative flex flex-col items-center text-center">
                    {/* Pulsing Icon */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping delay-300 opacity-20"></div>
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-200">
                            <BellRing className="h-10 w-10 text-white animate-bounce" />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-sm border border-emerald-100 flex items-center gap-1.5 whitespace-nowrap">
                            <Clock className="h-3 w-3 text-emerald-600" />
                            <span className="text-xs font-black text-emerald-700">{timeStr}</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-1">
                        İLAÇ ZAMANI
                    </h2>

                    {/* Medication Name */}
                    <h1 className="text-3xl font-black text-gray-900 mb-2 leading-tight">
                        {medicationName}
                    </h1>

                    {/* Dosage Badge */}
                    <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 mb-8">
                        <Pill className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-bold text-gray-600">{dosage}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full space-y-3">
                        <button
                            onClick={onTaken}
                            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-5 text-white shadow-xl shadow-emerald-200 transition-all active:scale-95 hover:bg-emerald-700"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                                <Check className="h-5 w-5" />
                            </div>
                            <span className="text-lg font-black tracking-wide">KULLANDIM</span>
                        </button>

                        <button
                            onClick={onMissed}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-4 text-red-500 transition-all active:scale-95 hover:bg-red-100"
                        >
                            <X className="h-5 w-5" />
                            <span className="text-sm font-bold">Atla / İçmedim</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
