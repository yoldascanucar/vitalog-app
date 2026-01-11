"use client";

import { CheckCircle2, XCircle, Pill, Clock } from "lucide-react";

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-sm rounded-[32px] bg-white p-8 text-center shadow-2xl border-4 border-emerald-500 animate-in zoom-in duration-500">
                <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                    <Pill className="h-12 w-12" />
                </div>

                <h2 className="mb-2 text-3xl font-black text-gray-900 uppercase leading-tight">
                    {medicationName} VAKTİ GELDİ!
                </h2>
                <p className="mb-6 text-xl font-bold text-emerald-600 flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5" /> {timeStr}
                </p>

                <div className="mb-8 rounded-2xl bg-gray-50 p-6">
                    <h3 className="text-2xl font-extrabold text-gray-800">{medicationName}</h3>
                    <p className="mt-1 text-lg font-medium text-gray-500">{dosage}</p>
                </div>

                <div className="grid gap-4">
                    <button
                        onClick={onTaken}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-6 text-2xl font-black text-white shadow-lg shadow-emerald-200 active:scale-95 transition-all outline-none ring-offset-2 focus:ring-4 focus:ring-emerald-500"
                    >
                        <CheckCircle2 className="h-8 w-8" /> İÇTİM
                    </button>

                    <button
                        onClick={onMissed}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-50 py-4 text-xl font-bold text-red-600 active:scale-95 transition-all"
                    >
                        <XCircle className="h-6 w-6" /> İÇMEDİM
                    </button>
                </div>
            </div>
        </div>
    );
}
