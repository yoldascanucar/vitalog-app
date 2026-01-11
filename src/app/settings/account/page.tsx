"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, User, Calendar, ChevronLeft, Camera, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export default function AccountPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        tc_no: "",
        birth_date: "",
        gender: "",
        email: "",
        phone: "",
        avatar_url: ""
    });
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                const metadata = user.user_metadata || {};

                // Normalize gender values (convert old Turkish values to new format)
                let genderValue = profile?.gender || metadata.gender || "";
                if (genderValue === 'Erkek') genderValue = 'male';
                if (genderValue === 'Kadın') genderValue = 'female';
                if (genderValue === 'Diğer') genderValue = 'other';

                setFormData({
                    first_name: profile?.first_name || metadata.first_name || "",
                    last_name: profile?.last_name || metadata.last_name || "",
                    tc_no: profile?.tc_no || metadata.tc_no || "",
                    birth_date: profile?.birth_date || metadata.birth_date || "",
                    gender: genderValue,
                    email: user.email || "",
                    phone: profile?.phone || "",
                    avatar_url: localStorage.getItem(`avatar_${user.id}`) || ""
                });
                setPhotoPreview(localStorage.getItem(`avatar_${user.id}`) || null);
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [router]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setPhotoPreview(base64);
                setFormData({ ...formData, avatar_url: base64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    tc_no: formData.tc_no,
                    birth_date: formData.birth_date,
                    gender: formData.gender
                }
            });

            if (authError) throw authError;

            if (formData.avatar_url) {
                localStorage.setItem(`avatar_${user.id}`, formData.avatar_url);
            }

            const { error: profileError } = await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    tc_no: formData.tc_no,
                    birth_date: formData.birth_date,
                    gender: formData.gender,
                    phone: formData.phone
                });

            if (profileError) throw profileError;

            setMessage({ type: 'success', text: t('profile.profile_updated_success') });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    const avatarUrl = formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.first_name}+${formData.last_name}&background=10b981&color=fff&size=200&bold=true`;

    return (
        <div className="flex flex-col min-h-full bg-background p-6 pb-24">
            <div className="mb-6 flex items-center gap-4">
                <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="h-6 w-6 text-gray-600" />
                </button>
                <h1 className="text-2xl font-black tracking-tighter text-foreground">{t('settings.profile')}</h1>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Photo Upload */}
                <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                    <div className="relative mb-4">
                        <img src={photoPreview || avatarUrl} alt="Profile" className="h-24 w-24 rounded-full border-4 border-emerald-50 shadow-md object-cover" />
                        <label className="absolute bottom-0 right-0 rounded-full bg-emerald-600 p-2 text-white ring-2 ring-white cursor-pointer hover:bg-emerald-700 transition-colors">
                            <Camera className="h-4 w-4" />
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500">{t('profile.change_photo')}</p>
                </div>

                {/* Form Fields */}
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('register.first_name')}</label>
                            <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full rounded-xl bg-gray-50 border-2 border-gray-200 p-3 text-sm font-medium focus:border-emerald-500 focus:ring-0" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{t('register.last_name')}</label>
                            <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full rounded-xl bg-gray-50 border-2 border-gray-200 p-3 text-sm font-medium focus:border-emerald-500 focus:ring-0" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('settings.email')}</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-xl bg-gray-50 border-2 border-gray-200 p-3 text-sm font-medium focus:border-emerald-500 focus:ring-0" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('settings.phone')}</label>
                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full rounded-xl bg-gray-50 border-2 border-gray-200 p-3 text-sm font-medium focus:border-emerald-500 focus:ring-0" placeholder="+90" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('profile.tc_no')}</label>
                        <input type="text" value={formData.tc_no} maxLength={11} onChange={(e) => setFormData({ ...formData, tc_no: e.target.value.replace(/[^0-9]/g, "") })} className="w-full rounded-xl bg-gray-50 border-2 border-gray-200 p-3 text-sm font-medium focus:border-emerald-500 focus:ring-0" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('profile.birth_date')}</label>
                        <input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} className="w-full rounded-xl bg-gray-50 border-2 border-gray-200 p-3 text-sm font-medium focus:border-emerald-500 focus:ring-0" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">{t('profile.gender')}</label>
                        <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full rounded-xl bg-gray-50 border-2 border-gray-200 p-3 text-sm font-medium focus:border-emerald-500 focus:ring-0">
                            <option value="">{t('register.gender_placeholder')}</option>
                            <option value="male">{t('profile.gender_male')}</option>
                            <option value="female">{t('profile.gender_female')}</option>
                            <option value="other">{t('profile.gender_other')}</option>
                        </select>
                    </div>
                </div>

                {/* Save Button */}
                <button type="submit" disabled={saving} className="w-full rounded-xl bg-emerald-600 py-4 text-sm font-black text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? t('medication_detail.saving') : t('profile.save_changes')}
                </button>
            </form>

            {/* Success/Error Message */}
            {message && (
                <div className={cn("fixed bottom-24 left-6 right-6 p-4 rounded-2xl shadow-2xl flex items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-300 z-[60]", message.type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white")}>
                    <p className="text-xs font-black">{message.text}</p>
                </div>
            )}
        </div>
    );
}
