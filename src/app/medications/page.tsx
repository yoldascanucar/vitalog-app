"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Pill, Plus, Loader2, TrendingUp, Calendar, Clock, Trash2, X, ChevronRight } from "lucide-react";
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
    reminder_times?: string[];
    missed_count?: number;
    taken_count?: number;
    total_past_count?: number;
    compliance_rate?: number;
    missed_logs?: any[];
}

export default function MedicationsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedMeds, setSelectedMeds] = useState<string[]>([]);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        async function fetchMedications() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push("/login");
                    return;
                }

                const { data, error } = await supabase
                    .from("medications")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Error fetching medications:", error);
                } else {
                    const now = new Date().toISOString();
                    // Her ilaç için istatistikleri ve logları çek
                    const medsWithStats = await Promise.all((data || []).map(async (med) => {
                        const { data: allPastLogs, error: logsError } = await supabase
                            .from("medication_logs")
                            .select("*")
                            .eq("medication_id", med.id)
                            .lte("scheduled_time", now)
                            .order("scheduled_time", { ascending: false });

                        const logs = allPastLogs || [];
                        const missed = logs.filter(l => l.status === "missed");
                        const taken = logs.filter(l => l.status === "taken");
                        const totalPast = logs.length;
                        const rate = totalPast > 0 ? Math.round((taken.length / totalPast) * 100) : 100;

                        return {
                            ...med,
                            missed_count: missed.length,
                            taken_count: taken.length,
                            total_past_count: totalPast,
                            compliance_rate: rate,
                            missed_logs: missed
                        };
                    }));
                    setMedications(medsWithStats);
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchMedications();
    }, [router]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { error } = await supabase
                .from("medications")
                .delete()
                .in("id", selectedMeds);

            if (error) throw error;

            // Refresh medications list
            setMedications(medications.filter(med => !selectedMeds.includes(med.id)));
            setSelectedMeds([]);
            setShowDeleteModal(false);
        } catch (error) {
            console.error("Error deleting medications:", error);
        } finally {
            setDeleting(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedMeds(prev =>
            prev.includes(id) ? prev.filter(medId => medId !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <div className="flex h-full flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-gradient-to-b from-emerald-50 to-white p-6 pb-24">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black tracking-tighter text-gray-900">
                    {t('medications.title')}
                </h1>
                <div className="flex items-center gap-2">
                    {medications.length > 0 && (
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="rounded-full p-2 bg-red-50 hover:bg-red-100 transition-colors"
                            title="İlaç Sil"
                        >
                            <Trash2 className="h-5 w-5 text-red-600" />
                        </button>
                    )}
                    <Link
                        href="/add-medicine"
                        className="rounded-full bg-emerald-600 p-2 text-white hover:bg-emerald-700 transition-all active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                    </Link>
                </div>
            </div>

            {medications.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100">
                    <div className="mb-4 rounded-full bg-gray-50 p-4">
                        <Pill className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{t('medications.empty_title')}</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        {t('medications.empty_desc')}
                    </p>
                    <Link
                        href="/add-medicine"
                        className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                        {t('medications.add_first')}
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {medications.map((med) => (
                        <Link
                            key={med.id}
                            href={`/medications/${med.id}`}
                            className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 hover:ring-emerald-200 transition-all active:scale-[0.98]"
                        >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Pill className="h-6 w-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-foreground truncate mb-1">
                                    {med.name}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div> {med.compliance_rate}% {t('medications.success_rate')}
                                    </span>
                                    <span className="flex items-center gap-1.5 font-medium">
                                        {t('add_medicine.times_per_day', { n: med.frequency_count || parseInt(med.frequency) || 1 })}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="h-6 w-6 text-gray-400 transition-transform group-hover:translate-x-1" />
                        </Link>
                    ))}
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="bg-white border-b border-gray-100 p-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black text-gray-900">İlaç Sil</h2>
                                <button onClick={() => { setShowDeleteModal(false); setSelectedMeds([]); }} className="rounded-full p-1.5 hover:bg-gray-100 transition-colors">
                                    <X className="h-4 w-4 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-2 overflow-y-auto flex-1">
                            <p className="text-sm text-gray-600 mb-4">Silmek istediğiniz ilaçları seçin:</p>
                            {medications.map((med) => (
                                <label
                                    key={med.id}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedMeds.includes(med.id)}
                                        onChange={() => toggleSelection(med.id)}
                                        className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900">{med.name}</p>
                                        <p className="text-xs text-gray-500">{med.dosage}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="bg-white border-t border-gray-100 p-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting || selectedMeds.length === 0}
                                    className="flex-1 rounded-lg bg-red-600 py-2.5 text-xs font-black text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    {deleting ? "SİLİNİYOR..." : `SİL (${selectedMeds.length})`}
                                </button>
                                <button
                                    onClick={() => { setShowDeleteModal(false); setSelectedMeds([]); }}
                                    disabled={deleting}
                                    className="flex-1 rounded-lg bg-gray-200 py-2.5 text-xs font-black text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    <X className="h-3 w-3" />
                                    İPTAL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
