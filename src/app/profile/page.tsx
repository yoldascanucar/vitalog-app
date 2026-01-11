"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, User, Calendar, Hash, LogOut, ShieldCheck, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

interface Profile {
    first_name: string;
    last_name: string;
    tc_no: string;
    birth_date: string;
    gender: string;
    patient_id: string;
    full_name: string;
    avatar_url?: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { t, language } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        async function getProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }

                const { data: dbProfile, error: dbError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (dbError && dbError.code !== 'PGRST116') throw dbError;

                const metadata = user.user_metadata || {};
                const mergedProfile: Profile = {
                    first_name: dbProfile?.first_name || metadata.first_name || "",
                    last_name: dbProfile?.last_name || metadata.last_name || "",
                    tc_no: dbProfile?.tc_no || metadata.tc_no || "",
                    birth_date: dbProfile?.birth_date || metadata.birth_date || "",
                    gender: dbProfile?.gender || metadata.gender || "",
                    patient_id: dbProfile?.patient_id || metadata.patient_id || "",
                    full_name: dbProfile?.full_name || metadata.full_name || `${metadata.first_name || ""} ${metadata.last_name || ""}`.trim(),
                    avatar_url: localStorage.getItem(`avatar_${user.id}`) || ""
                };

                setProfile(mergedProfile);
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }
        }

        getProfile();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex h-full flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex h-full flex-1 flex-col items-center justify-center p-6 text-center">
                <p className="text-gray-500">{t('profile.error_loading')}</p>
                <button onClick={handleLogout} className="mt-4 text-sm font-medium text-red-600 hover:text-red-500">
                    {t('common.logout')}
                </button>
            </div>
        );
    }

    const avatarUrl = profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.first_name}+${profile.last_name}&background=10b981&color=fff&size=200&bold=true`;

    return (
        <div className="flex flex-col p-6 pb-24">
            <div className="mb-2 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">{t('profile.title')}</h1>
                <div className="flex items-center gap-2">
                    <Link href="/settings" title={t('nav.settings')}>
                        <SettingsIcon className="h-6 w-6 text-zinc-500 hover:bg-zinc-100 rounded-full p-1 transition-all box-content" />
                    </Link>
                    <button onClick={handleLogout} title={t('common.logout')}>
                        <LogOut className="h-6 w-6 text-red-500 hover:bg-red-50 rounded-full p-1 transition-all box-content" />
                    </button>
                </div>
            </div>

            {/* Header Card */}
            <div className="mb-8 flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <div className="relative mb-4">
                    <img src={avatarUrl} alt="Profile" className="h-24 w-24 rounded-full border-4 border-emerald-50 shadow-md object-cover" />
                    <div className="absolute bottom-0 right-0 rounded-full bg-emerald-600 p-1.5 text-white ring-2 ring-white">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-foreground">{profile.first_name} {profile.last_name}</h2>
                <p className="text-sm font-medium text-emerald-600">
                    {t('profile.patient_id')}: {profile.patient_id || t('common.not_specified')}
                </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-4">
                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-gray-100 p-2.5 text-gray-600"><Hash className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">{t('profile.tc_no')}</p>
                            <p className="font-semibold text-foreground">
                                {profile.tc_no ? `${profile.tc_no.substring(0, 2)}*******${profile.tc_no.substring(9)}` : t('common.not_entered')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-gray-100 p-2.5 text-gray-600"><Calendar className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">{t('profile.birth_date')}</p>
                            <p className="font-semibold text-foreground">
                                {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : 'en-US') : t('common.not_entered')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-gray-100 p-2.5 text-gray-600"><User className="h-5 w-5" /></div>
                        <div>
                            <p className="text-xs font-medium text-gray-500">{t('profile.gender')}</p>
                            <p className="font-semibold text-foreground">{profile.gender || t('common.not_specified')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
