"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Pill, Clock, Calendar, FileText, CheckCircle2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export default function AddMedicinePage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        dosage: "",
        frequency: "1",
        first_dose_time: "08:00",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        notes: "",
    });

    const calculateReminderTimes = (startTime: string, interval: number, count: number) => {
        const times: string[] = [];
        let [hours, minutes] = startTime.split(":").map(Number);

        for (let i = 0; i < count; i++) {
            const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
            times.push(timeStr);

            hours = (hours + interval) % 24;
        }
        return times;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            const frequencyCount = parseInt(formData.frequency);
            const intervalHours = Math.floor(24 / frequencyCount);
            const reminderTimes = calculateReminderTimes(
                formData.first_dose_time,
                intervalHours,
                frequencyCount
            );

            const { data: medicationData, error: insertError } = await supabase
                .from("medications")
                .insert([
                    {
                        user_id: user.id,
                        name: formData.name,
                        dosage: formData.dosage,
                        frequency: `${formData.frequency} kez`,
                        frequency_count: frequencyCount,
                        first_dose_time: formData.first_dose_time,
                        interval_hours: intervalHours,
                        reminder_times: reminderTimes,
                        start_date: formData.start_date,
                        end_date: formData.end_date || null,
                        notes: formData.notes,
                        status: "active",
                    },
                ])
                .select()
                .single();

            if (insertError) throw insertError;

            // Logları oluştur
            if (medicationData) {
                try {
                    // Tarihleri "YYYY-MM-DD" formatından güvenli bir şekilde ayrıştır (Yerel saat diliminde)
                    const [sYear, sMonth, sDay] = formData.start_date.split("-").map(Number);
                    const startDate = new Date(sYear, sMonth - 1, sDay);

                    let endDate: Date;
                    if (formData.end_date) {
                        const [eYear, eMonth, eDay] = formData.end_date.split("-").map(Number);
                        endDate = new Date(eYear, eMonth - 1, eDay);
                    } else {
                        endDate = new Date(startDate);
                        endDate.setFullYear(endDate.getFullYear() + 1); // 1 yıl limit
                    }

                    const logs = [];
                    let currentDate = new Date(startDate);

                    // Şu anki zamanı al (geçmiş loglar oluşturulmasın)
                    const now = new Date();

                    // Tarih aralığını dön
                    while (currentDate <= endDate) {
                        for (const timeStr of reminderTimes) {
                            const [hours, minutes] = timeStr.split(":").map(Number);
                            const scheduledTime = new Date(currentDate);
                            scheduledTime.setHours(hours, minutes, 0, 0);

                            // Sadece gelecekteki zamanlar için log oluştur
                            if (scheduledTime > now) {
                                logs.push({
                                    medication_id: medicationData.id,
                                    user_id: user.id,
                                    scheduled_time: scheduledTime.toISOString(),
                                    status: "pending"
                                });
                            }
                        }
                        currentDate.setDate(currentDate.getDate() + 1);

                        // Sonsuz döngü koruması (Maksimum 400 gün)
                        if (logs.length > 3200) break;
                    }

                    // Toplu insert (Batch insert)
                    if (logs.length > 0) {
                        const { error: logsError } = await supabase
                            .from("medication_logs")
                            .insert(logs);

                        if (logsError) {
                            // Hata durumunda ilacı silerek tutarlılığı koru
                            await supabase.from("medications").delete().eq("id", medicationData.id);
                            throw new Error("Doz kayıtları oluşturulamadı: " + logsError.message);
                        }
                    } else {
                        throw new Error("Seçilen tarihler için herhangi bir doz vaktine ulaşılamadı. Lütfen tarihleri kontrol edin.");
                    }
                } catch (logErr: any) {
                    // Eğer log oluşturma safhasında bir hata çıkarsa, ana try/catch'e fırlat
                    throw logErr;
                }
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/medications");
                router.refresh();
            }, 2000);

        } catch (err: any) {
            console.error("Error adding medicine:", err);
            setError(err.message || t('add_medicine.generic_error'));
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex h-full flex-1 flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="mb-6 rounded-full bg-emerald-100 p-6">
                    <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-foreground">{t('common.success')}</h2>
                <p className="mt-4 text-lg text-gray-600">
                    {t('add_medicine.success_msg')}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-6 pb-32 max-w-lg mx-auto">
            <div className="mb-8 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="rounded-full p-3 hover:bg-gray-100 transition-colors bg-white shadow-sm border border-gray-200"
                >
                    <ArrowLeft className="h-7 w-7 text-gray-800" />
                </button>
                <h1 className="text-3xl font-extrabold text-foreground">{t('add_medicine.title')}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Name */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        <Pill className="h-6 w-6 text-emerald-600" /> {t('add_medicine.name')}
                    </label>
                    <input
                        type="text"
                        required
                        className="block w-full rounded-2xl border-2 border-gray-200 p-5 text-xl font-medium text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 transition-all shadow-sm"
                        placeholder={t('add_medicine.name_placeholder')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                {/* Dosage */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        <Clock className="h-6 w-6 text-emerald-600" /> {t('add_medicine.dosage')}
                    </label>
                    <input
                        type="text"
                        required
                        className="block w-full rounded-2xl border-2 border-gray-200 p-5 text-xl font-bold text-gray-900 appearance-none shadow-sm pr-12"
                        placeholder={t('add_medicine.dosage_placeholder')}
                        value={formData.dosage}
                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    />
                </div>

                {/* Frequency Dropdown (1-8 times) */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        {t('add_medicine.frequency')}
                    </label>
                    <div className="relative">
                        <select
                            required
                            className="block w-full rounded-2xl border-2 border-gray-200 p-5 text-xl font-bold text-gray-900 appearance-none shadow-sm pr-12"
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                <option key={n} value={n}>{t('add_medicine.times_per_day', { n })}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* First Dose Time & Interval Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-lg font-bold text-gray-800">
                            {t('add_medicine.first_dose')}
                        </label>
                        <input
                            type="time"
                            required
                            className="block w-full rounded-2xl border-2 border-gray-200 p-5 text-xl font-bold text-gray-900 shadow-sm"
                            value={formData.first_dose_time}
                            onChange={(e) => setFormData({ ...formData, first_dose_time: e.target.value })}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-lg font-bold text-gray-800">
                            {t('add_medicine.interval')}
                        </label>
                        <div className="block w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-5 text-xl font-black text-emerald-700 shadow-inner">
                            {t('add_medicine.hours_apart', { n: Math.floor(24 / parseInt(formData.frequency)) })}
                        </div>
                    </div>
                </div>

                {/* Hidden calculated interval for logic */}
                <input type="hidden" value={Math.floor(24 / parseInt(formData.frequency))} />

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-lg font-bold text-gray-800">
                            <Calendar className="h-6 w-6 text-emerald-600" /> {t('add_medicine.start_date')}
                        </label>
                        <input
                            type="date"
                            required
                            className="block w-full rounded-2xl border-2 border-gray-200 p-5 text-xl font-bold text-gray-900 shadow-sm"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-lg font-bold text-gray-800">
                            {t('add_medicine.end_date')}
                        </label>
                        <input
                            type="date"
                            className="block w-full rounded-2xl border-2 border-gray-200 p-5 text-xl font-bold text-gray-900 shadow-sm"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        />
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        <FileText className="h-6 w-6 text-emerald-600" /> {t('add_medicine.notes')}
                    </label>
                    <textarea
                        rows={3}
                        className="block w-full rounded-2xl border-2 border-gray-200 p-5 text-xl font-medium text-gray-900 resize-none shadow-sm"
                        placeholder={t('add_medicine.notes_placeholder')}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                {error && (
                    <div className="rounded-2xl bg-red-50 p-6 text-lg font-bold text-red-600 border-2 border-red-100">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-3xl bg-emerald-600 p-4 text-base font-black text-white shadow-xl shadow-emerald-200 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-all active:scale-[0.96] mt-4"
                >
                    {loading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : (
                        t('add_medicine.save_btn')
                    )}
                </button>
            </form>
        </div>
    );
}
