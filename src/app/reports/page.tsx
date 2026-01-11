"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
    Loader2, CheckCircle2, XCircle,
    Calendar, Clock, TrendingUp,
    Filter, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface Transaction {
    id: string;
    status: string;
    scheduled_time: string;
    taken_at: string | null;
    medications: {
        id: string;
        name: string;
        dosage: string;
    };
}

interface Medication {
    id: string;
    name: string;
}

export default function TransactionsPage() {
    const router = useRouter();
    const { t, language } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [allLogs, setAllLogs] = useState<any[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [selectedMedId, setSelectedMedId] = useState<string>("all");
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({
        todayTaken: 0,
        todayTotal: 0,
        monthlyRate: 0
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }

                // Fetch Medications for Filter and Calculation
                const { data: medsData } = await supabase
                    .from("medications")
                    .select("id, name, frequency_count, reminder_times, start_date")
                    .eq("user_id", user.id)
                    // Removed strict status filter to ensure we get all meds with logs
                    .order("name");

                setMedications(medsData || []);

                const now = new Date();

                // Fetch all past and current logs
                const { data: logs, error } = await supabase
                    .from("medication_logs")
                    .select("*, medications(id, name, dosage)")
                    .eq("user_id", user.id)
                    .lte("scheduled_time", now.toISOString())
                    .order("scheduled_time", { ascending: false });

                if (error) throw error;

                setAllLogs(logs || []);
                processLogs(logs || [], "all");
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [router]);

    // Handle filtering and summary calculation
    const processLogs = (logs: any[], medId: string) => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        // Filter logs by medication if selected, AND filter out ghost logs (before med start_date)
        let filteredLogs = medId === "all"
            ? logs
            : logs.filter(log => log.medications?.id === medId);

        // Filter out logs scheduled before medication start_date
        filteredLogs = filteredLogs.filter(log => {
            const med = medications.find(m => m.id === log.medications?.id) as any;
            if (med && med.start_date) {
                const medStartDate = new Date(med.start_date);
                medStartDate.setHours(0, 0, 0, 0);
                return new Date(log.scheduled_time) >= medStartDate;
            }
            return true; // Keep if no start_date found
        });

        // Process Summary Stats (for today)
        const todayLogs = filteredLogs.filter(l => l.scheduled_time >= startOfToday && l.scheduled_time < now.toISOString()); // Past logs today
        const todayTaken = todayLogs.filter(l => l.status === "taken").length;

        // Calculate Daily Goal (Total) based on frequency
        let dailyGoal = 0;
        if (medId === "all") {
            // Sum of all active medications' frequencies
            dailyGoal = medications.reduce((sum, med: any) => {
                const freq = med.frequency_count || med.reminder_times?.length || 1;
                return sum + freq;
            }, 0);
        } else {
            const med = medications.find(m => m.id === medId) as any;
            if (med) {
                dailyGoal = med.frequency_count || med.reminder_times?.length || 1;
            }
        }

        // Calculate Rate based on Goal
        // If dailyGoal is 8, taken is 1, rate is 12.5% -> 13%
        const dailyRate = dailyGoal > 0 ? Math.round((todayTaken / dailyGoal) * 100) : 0;

        setSummary({
            todayTaken,
            todayTotal: dailyGoal,
            monthlyRate: Math.min(dailyRate, 100)
        });

        // Group by Date for Timeline
        const grouped = filteredLogs.reduce((acc: any, log) => {
            const date = new Date(log.scheduled_time);
            const dateStr = date.toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : 'en-US', {
                day: "numeric",
                month: "long",
                year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
            });

            let label = dateStr;
            const isToday = date.toDateString() === now.toDateString();
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            const isYesterday = date.toDateString() === yesterday.toDateString();

            if (isToday) label = t('reports.today');
            else if (isYesterday) label = t('reports.yesterday');

            if (!acc[label]) acc[label] = [];
            acc[label].push(log);
            return acc;
        }, {});

        setTransactions(Object.entries(grouped));
    };

    useEffect(() => {
        if (!loading) {
            processLogs(allLogs, selectedMedId);
        }
    }, [selectedMedId]);

    if (loading) {
        return (
            <div className="flex h-full flex-1 items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-background p-6 pb-24">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">{t('reports.title')}</h1>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{t('reports.subtitle')}</p>
            </div>

            {/* Filter Section */}
            <div className="mb-8 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Filter className="h-5 w-5" />
                </div>
                <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full appearance-none rounded-3xl bg-white px-12 py-5 text-lg font-black text-gray-900 shadow-sm ring-1 ring-gray-100 outline-none focus:ring-4 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                    <option value="all">{t('reports.filter_all')}</option>
                    {medications.map(med => (
                        <option key={med.id} value={med.id}>{med.name.toUpperCase()}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown className="h-5 w-5" />
                </div>
            </div>

            {/* Timeline */}
            <div className="relative space-y-10">
                <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-200"></div>

                {transactions.map(([date, logs]: [string, any[]]) => (
                    <div key={date} className="relative space-y-6">
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
                                <Calendar className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{date}</h3>
                        </div>

                        <div className="ml-6 space-y-3 pl-8">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="group relative flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 hover:ring-emerald-200 transition-all"
                                >
                                    <div className={cn(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                        log.status === 'taken'
                                            ? "bg-emerald-50 text-emerald-600"
                                            : "bg-red-50 text-red-600"
                                    )}>
                                        {log.status === 'taken'
                                            ? <CheckCircle2 className="h-6 w-6" />
                                            : <XCircle className="h-6 w-6" />
                                        }
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <h4 className="text-base font-black text-foreground truncate">
                                                {log.medications?.name}
                                            </h4>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                {log.medications?.dosage}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-500 truncate">
                                            {log.status === 'taken'
                                                ? t('reports.status_taken')
                                                : (new Date(log.scheduled_time) > new Date() ? t('reports.status_planned') : t('reports.status_missed'))
                                            }
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
                                            <Clock className="h-3.5 w-3.5 text-emerald-500" />
                                            {new Date(log.taken_at || log.scheduled_time).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </div>
                                        <p className="text-[9px] font-medium text-gray-400 uppercase mt-0.5">
                                            {log.status === 'taken'
                                                ? t('reports.status_taken_short')
                                                : (new Date(log.scheduled_time) > new Date() ? t('reports.status_planned') : t('reports.status_missed'))
                                            }
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {transactions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 rounded-full bg-gray-50 p-6">
                            <TrendingUp className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{t('reports.empty_title')}</h3>
                        <p className="mt-2 text-sm text-gray-500 max-w-[200px]">
                            {selectedMedId === 'all'
                                ? t('reports.empty_all')
                                : t('reports.empty_single')}
                        </p>
                    </div>
                )}
            </div>
        </div >
    );
}
