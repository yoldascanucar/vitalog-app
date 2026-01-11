"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import {
    Loader2, Pill, Clock, Calendar,
    ChevronLeft, CheckCircle2, XCircle,
    FileText, TrendingUp, AlertCircle, Edit, Save, X
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    frequency_count: number;
    start_date: string;
    end_date: string | null;
    status: string;
    notes: string;
    reminder_times: string[];
}

export default function MedicationDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { t } = useTranslation();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [medication, setMedication] = useState<Medication | null>(null);
    const [stats, setStats] = useState({
        taken: 0,
        missed: 0,
        totalPast: 0,
        rate: 0,
        missedLogs: [] as any[]
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        dosage: "",
        frequency_count: 1
    });
    const [saving, setSaving] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [editedNotes, setEditedNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        async function fetchDetails() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }

                // Fetch medication details
                const { data: medData, error: medError } = await supabase
                    .from("medications")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (medError || !medData) {
                    console.error("Error fetching medication:", medError);
                    router.push("/medications");
                    return;
                }

                setMedication(medData);

                // Fetch logs for TODAY only
                const todayCurrent = new Date();
                todayCurrent.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);

                const { data: logs, error: logsError } = await supabase
                    .from("medication_logs")
                    .select("*")
                    .eq("medication_id", id)
                    .gte("scheduled_time", todayCurrent.toISOString())
                    .lte("scheduled_time", todayEnd.toISOString())
                    .order("scheduled_time", { ascending: false });

                if (logsError) {
                    console.error("Error fetching logs:", logsError);
                } else {
                    const l = logs || [];
                    const missed = l.filter(log => log.status === "missed");
                    const taken = l.filter(log => log.status === "taken");

                    // Daily Stats Calculation
                    // Robust check: use frequency_count, or reminder_times length, or fallback to 1
                    const dailyFrequency = medData.frequency_count || medData.reminder_times?.length || 1;
                    const takenCount = taken.length;

                    // Rate is based on daily goal
                    const complianceRate = Math.round((takenCount / dailyFrequency) * 100);

                    setStats({
                        taken: takenCount,
                        missed: missed.length,
                        totalPast: dailyFrequency, // We use daily frequency as the "total" goal
                        rate: Math.min(complianceRate, 100), // Cap at 100%
                        missedLogs: missed
                    });
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchDetails();
    }, [id, router]);

    const handleUpdate = async () => {
        setSaving(true);
        try {
            // Calculate new reminder times based on frequency_count
            const timesPerDay = editForm.frequency_count;
            const interval = 24 / timesPerDay;
            const newReminderTimes = Array.from({ length: timesPerDay }, (_, i) => {
                const hour = Math.floor(i * interval);
                return `${hour.toString().padStart(2, '0')}:00`;
            });

            const { error } = await supabase
                .from("medications")
                .update({
                    dosage: editForm.dosage,
                    frequency_count: editForm.frequency_count,
                    frequency: editForm.frequency_count.toString(),
                    reminder_times: newReminderTimes
                })
                .eq("id", id);

            if (error) throw error;

            // Update local state
            setMedication({
                ...medication!,
                dosage: editForm.dosage,
                frequency_count: editForm.frequency_count,
                frequency: editForm.frequency_count.toString(),
                reminder_times: newReminderTimes
            });

            // Recalculate stats based on new frequency
            const currentTaken = stats.taken;
            const newFrequency = editForm.frequency_count;
            const newRate = Math.round((currentTaken / newFrequency) * 100);

            setStats(prev => ({
                ...prev,
                totalPast: newFrequency,
                rate: Math.min(newRate, 100)
            }));

            setShowEditModal(false);
        } catch (error) {
            console.error("Error updating medication:", error);
        } finally {
            setSaving(false);
        }
    };

    const startEditing = () => {
        setEditForm({
            dosage: medication?.dosage || "",
            frequency_count: medication?.frequency_count || 1
        });
        setShowEditModal(true);
    };

    if (loading) {
        return (
            <div className="flex h-full flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!medication) return null;

    return (
        <div className="flex flex-col min-h-full bg-gray-50">
            {/* Header / Navigation */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="rounded-xl bg-gray-100 p-2 text-gray-600 active:scale-90 transition-all"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('medication_detail.title')}</h1>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none mt-1">{medication.name}</p>
                    </div>
                    <button
                        onClick={startEditing}
                        className="rounded-xl bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100 active:scale-90 transition-all"
                        title={t('medication_detail.edit')}
                    >
                        <Edit className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6 space-y-6 pb-24">
                {/* Medication Info Card */}
                <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <Pill className="h-8 w-8" />
                        </div>
                        <div className="text-right">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600 uppercase">
                                {medication.status === 'active' ? t('medication_detail.active') : t('medication_detail.inactive')}
                            </span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 mb-2">{medication.name}</h2>
                    <div className="flex flex-wrap gap-4 text-sm font-bold text-gray-500">
                        <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-500" /> {medication.dosage}</span>
                        <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-emerald-500" /> {t('add_medicine.times_per_day', { n: medication.frequency_count || parseInt(medication.frequency) || 1 })}</span>
                    </div>

                    {/* Reminder Times Tags */}
                    {medication.reminder_times && (
                        <div className="mt-6 flex flex-wrap gap-2">
                            {medication.reminder_times.map((time, idx) => (
                                <span key={idx} className="px-3 py-1.5 bg-gray-50 rounded-xl text-xs font-black text-gray-700 ring-1 ring-gray-100">
                                    {time}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Score & Compliance Section */}
                <div className="grid grid-cols-1 gap-6">
                    <div className="rounded-[32px] bg-emerald-600 p-8 text-white shadow-xl shadow-emerald-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <span className="text-4xl font-black tracking-tighter">%{stats.rate}</span>
                        </div>
                        <h3 className="text-xl font-black mb-2 uppercase tracking-tight">{t('medication_detail.usage_success')}</h3>
                        <p className="text-sm font-medium opacity-80 leading-relaxed mb-6">
                            {stats.taken === 0
                                ? t('medication_detail.no_dose_today')
                                : t('medication_detail.doses_taken', { total: stats.totalPast, taken: stats.taken })}
                        </p>

                        {/* Progress Bar */}
                        <div className="h-4 w-full rounded-full bg-black/10 overflow-hidden shrink-0">
                            <div
                                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-1000"
                                style={{ width: `${stats.rate}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Counters */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-gray-100 text-center">
                            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{t('medication_detail.taken')}</p>
                            <p className="text-3xl font-black text-gray-900">{stats.taken}</p>
                        </div>
                        <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-gray-100 text-center">
                            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                                <XCircle className="h-6 w-6" />
                            </div>
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{t('medication_detail.missed')}</p>
                            <p className="text-3xl font-black text-gray-900">{stats.missed}</p>
                        </div>
                    </div>
                </div>

                {/* Missed Doses Detailed List */}
                {stats.missedLogs.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="flex items-center gap-2 text-lg font-black text-gray-900 uppercase tracking-tight">
                            <AlertCircle className="h-5 w-5 text-red-500" /> {t('medication_detail.missed_days')}
                        </h3>
                        <div className="space-y-3">
                            {stats.missedLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                        <span className="font-bold text-gray-800">
                                            {new Date(log.scheduled_time).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" })}
                                        </span>
                                    </div>
                                    <span className="font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                                        {new Date(log.scheduled_time).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes Section */}
                <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="flex items-center gap-2 text-lg font-black text-gray-900 uppercase tracking-tight">
                            <FileText className="h-5 w-5 text-emerald-500" /> {t('medication_detail.notes')}
                        </h3>
                        {!isEditingNotes && (
                            <button
                                onClick={() => {
                                    setIsEditingNotes(true);
                                    setEditedNotes(medication.notes || "");
                                }}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                                {t('medication_detail.edit_notes')}
                            </button>
                        )}
                    </div>
                    {isEditingNotes ? (
                        <div className="space-y-3">
                            <textarea
                                value={editedNotes}
                                onChange={(e) => setEditedNotes(e.target.value)}
                                className="w-full rounded-2xl bg-gray-50 p-4 text-gray-700 leading-relaxed border-2 border-emerald-200 focus:border-emerald-500 focus:ring-0 min-h-[120px]"
                                placeholder={t('medication_detail.notes_placeholder')}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        setSavingNotes(true);
                                        const { error } = await supabase
                                            .from("medications")
                                            .update({ notes: editedNotes })
                                            .eq("id", id);

                                        if (!error) {
                                            setMedication({ ...medication!, notes: editedNotes });
                                            setIsEditingNotes(false);
                                        }
                                        setSavingNotes(false);
                                    }}
                                    disabled={savingNotes}
                                    className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    {savingNotes ? t('medication_detail.saving') : t('medication_detail.save')}
                                </button>
                                <button
                                    onClick={() => setIsEditingNotes(false)}
                                    disabled={savingNotes}
                                    className="flex-1 rounded-xl bg-gray-200 py-3 text-xs font-black text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                                >
                                    {t('medication_detail.cancel')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-gray-50 p-4">
                            <p className="text-gray-700 leading-relaxed italic">
                                {medication.notes || t('medication_detail.no_notes')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="bg-white border-b border-gray-100 p-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-gray-900">{t('medication_detail.update_med')}</h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="rounded-full p-1.5 hover:bg-gray-100 transition-colors"
                                >
                                    <X className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Medication Name - Read Only */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                                    {t('medication_detail.med_name')}
                                </label>
                                <input
                                    type="text"
                                    value={medication.name}
                                    disabled
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            {/* Dosage */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                                    {t('medication_detail.dose_amount')}
                                </label>
                                <input
                                    type="text"
                                    value={editForm.dosage}
                                    onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                                    placeholder="Örn: 500mg, 1 tablet"
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                            </div>

                            {/* Frequency Count */}
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
                                    {t('medication_detail.times_per_day_label')}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="24"
                                    value={editForm.frequency_count}
                                    onChange={(e) => setEditForm({ ...editForm, frequency_count: parseInt(e.target.value) || 1 })}
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    {t('medication_detail.dose_interval', { hours: editForm.frequency_count > 0 ? Math.floor(24 / editForm.frequency_count) : 0 })}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white border-t border-gray-100 p-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpdate}
                                    disabled={saving || !editForm.dosage}
                                    className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-black text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    {saving ? t('medication_detail.saving') : t('medication_detail.save')}
                                </button>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    disabled={saving}
                                    className="flex-1 rounded-lg bg-gray-200 py-2.5 text-xs font-black text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    <X className="h-3 w-3" />
                                    {t('medication_detail.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
