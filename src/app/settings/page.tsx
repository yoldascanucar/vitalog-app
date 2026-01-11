"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
    Bell,
    ChevronLeft,
    ChevronRight,
    Globe,
    Languages,
    Loader2,
    Lock,
    LogOut,
    Mail,
    Phone,
    Shield,
    Type,
    User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useAlarm } from "@/context/AlarmContext";
import { Volume2, VolumeX } from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
    const { font, language, setFont, setLanguage } = useSettings();
    const { audioEnabled, setAudioEnabled } = useAlarm();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [tcNo, setTcNo] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [gender, setGender] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        async function getInitialData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUser(user);
            setEmail(user.email || "");

            const metadata = user.user_metadata || {};
            setFirstName(metadata.first_name || "");
            setLastName(metadata.last_name || "");
            setTcNo(metadata.tc_no || "");
            setBirthDate(metadata.birth_date || "");
            setGender(metadata.gender || "");

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profile) {
                if (profile.first_name) setFirstName(profile.first_name);
                if (profile.last_name) setLastName(profile.last_name);
                if (profile.tc_no) setTcNo(profile.tc_no);
                if (profile.birth_date) setBirthDate(profile.birth_date);
                if (profile.gender) setGender(profile.gender);
                if (profile.phone) setPhone(profile.phone);
            }
            setLoading(false);
        }
        getInitialData();
    }, [router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage(null);

        try {
            // Update Auth Metadata
            const { error: authError } = await supabase.auth.updateUser({
                email,
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    tc_no: tcNo,
                    birth_date: birthDate,
                    gender: gender
                }
            });

            if (authError) throw authError;

            // Update Profiles Table
            const { error: profileError } = await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    tc_no: tcNo,
                    birth_date: birthDate,
                    gender: gender,
                    phone: phone
                });

            if (profileError) throw profileError;

            setMessage({ type: 'success', text: t('settings.profile_updated') });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex h-full flex-1 items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-background p-6 pb-24 transition-colors duration-300">
            <h1 className="text-3xl font-black tracking-tighter text-foreground mb-8">
                {t('settings.title')}
            </h1>

            <div className="space-y-8">
                {/* Account Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <User className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">HESAP</h2>
                    </div>
                    <button
                        onClick={() => router.push('/settings/account')}
                        className="flex w-full items-center justify-between p-6 rounded-3xl bg-white shadow-sm border border-zinc-100 hover:bg-zinc-50 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-zinc-100 p-2 text-zinc-600">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-zinc-900">{t('settings.profile')}</p>
                                <p className="text-[10px] text-zinc-500">Ad, Soyad, TC, Doğum Tarihi, Cinsiyet</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-300" />
                    </button>
                </section>

                {/* Notification Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">{t('settings.sound')}</h2>
                    </div>
                    <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className="flex w-full items-center justify-between p-6 rounded-3xl bg-white shadow-sm border border-zinc-100 hover:bg-zinc-50 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "rounded-xl p-2 transition-colors",
                                audioEnabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"
                            )}>
                                {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-zinc-900">{t('settings.alarm_sound')}</p>
                                <p className="text-[10px] text-zinc-500">{t('settings.alarm_sound_desc')}</p>
                            </div>
                        </div>
                        <div className={cn(
                            "w-12 h-6 rounded-full transition-colors relative",
                            audioEnabled ? "bg-emerald-600" : "bg-zinc-200"
                        )}>
                            <div className={cn(
                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                audioEnabled ? "left-7" : "left-1"
                            )} />
                        </div>
                    </button>
                </section>
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Type className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">{t('settings.font')}</h2>
                    </div>
                    <div className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-100 grid grid-cols-2 gap-2">
                        {(['Inter', 'Outfit', 'Roboto', 'Lexend'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFont(f)}
                                className={cn(
                                    "w-full px-4 py-3 rounded-xl text-xs font-bold transition-all",
                                    font === f
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </section>
                {/* Language Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Languages className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">{t('settings.language')}</h2>
                    </div>
                    <div className="rounded-3xl bg-white border border-zinc-100 grid grid-cols-3 gap-2 p-4 shadow-sm">
                        {[
                            { name: 'Türkçe', code: 'tr' },
                            { name: 'English', code: 'en' },
                            { name: 'Deutsch', code: 'de' }
                        ].map((l) => (
                            <button
                                key={l.code}
                                onClick={() => setLanguage(l.code as any)}
                                className={cn(
                                    "w-full px-2 py-3 rounded-2xl text-[11px] font-black transition-all",
                                    language === l.code
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                                )}
                            >
                                {l.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Security Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500">{t('settings.security')}</h2>
                    </div>
                    <button
                        onClick={async () => {
                            setUpdating(true);
                            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                                redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
                            });
                            if (error) setMessage({ type: 'error', text: error.message });
                            else setMessage({ type: 'success', text: t('settings.password_reset_sent') });
                            setUpdating(false);
                        }}
                        disabled={updating}
                        className="flex w-full items-center justify-between p-6 rounded-3xl bg-white shadow-sm border border-zinc-100 hover:bg-zinc-50 transition-all disabled:opacity-50"
                    >
                        <div className="flex items-center gap-4">
                            <div className="rounded-xl bg-zinc-100 p-2 text-zinc-600">
                                <Lock className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-zinc-900">{t('settings.change_password')}</p>
                                <p className="text-[10px] text-zinc-500">{t('settings.change_password_desc')}</p>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-300" />
                    </button>
                </section>

                {/* Logout */}
                <section className="pt-4">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-3 p-6 rounded-3xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition-all active:scale-95"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="text-sm font-black uppercase tracking-widest">{t('common.logout')}</span>
                    </button>
                </section>
            </div>

            {message && (
                <div className={cn(
                    "fixed bottom-24 left-6 right-6 p-4 rounded-2xl shadow-2xl flex items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-300 z-[60]",
                    message.type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                )}>
                    <p className="text-xs font-black">{message.text}</p>
                </div>
            )}
        </div>
    );
}
