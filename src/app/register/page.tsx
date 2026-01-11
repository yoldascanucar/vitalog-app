"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowRight, ArrowLeft, Check, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export default function RegisterPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        tcNo: "",
        birthDate: "",
        gender: "",
        email: "",
        password: "",
    });

    // Computed Age
    const calculateAge = (dateString: string) => {
        if (!dateString) return null;
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const age = calculateAge(formData.birthDate);

    const generatePatientId = () => {
        // Generate a simple random ID like PT-X7Y2Z9
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `PT-${randomPart}`;
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            if (!formData.firstName || !formData.lastName || !formData.tcNo || !formData.birthDate || !formData.gender) {
                setError(t('register.error_personal_info'));
                return;
            }
        }
        setError(null);
        setStep(step + 1);
    };

    const handlePrevStep = () => {
        setError(null);
        setStep(step - 1);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!formData.email || !formData.password) {
            setError(t('register.error_email_password'));
            setLoading(false);
            return;
        }

        try {
            const patientId = generatePatientId();
            const fullName = `${formData.firstName} ${formData.lastName}`;

            // 1. Sign up user with all metadata for the Trigger
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        full_name: fullName,
                        tc_no: formData.tcNo,
                        birth_date: formData.birthDate,
                        gender: formData.gender,
                        patient_id: patientId,
                    },
                },
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            // Trigger handles profile creation automatically
            // Security: Force logout and require manual login after registration
            if (authData.session) {
                await supabase.auth.signOut();
                setSuccess(t('register.success_msg') || "Kayıt başarılı! Lütfen giriş yapınız.");
                setTimeout(() => {
                    router.push('/login');
                    router.refresh();
                }, 2000);
            } else if (authData.user) {
                // Email verification case
                setSuccess(t('register.success_msg'));
                setTimeout(() => router.push('/login'), 3000);
            }
        } catch (err) {
            setError(t('common.error'));
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-background to-background p-6 overflow-hidden">
            <div className="w-full max-w-lg space-y-6 rounded-3xl bg-white/95 p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] backdrop-blur-sm border border-white/10">
                <div className="text-center">
                    <h2 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
                        {step === 1 ? t('register.step_personal') : t('register.step_account')}
                    </h2>
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <div className={cn("h-1.5 rounded-full transition-all duration-300", step === 1 ? "w-12 bg-emerald-600" : "w-4 bg-gray-200")} />
                        <div className={cn("h-1.5 rounded-full transition-all duration-300", step === 2 ? "w-12 bg-emerald-600" : "w-4 bg-gray-200")} />
                    </div>
                </div>

                <form className="space-y-4" onSubmit={step === 1 ? handleNextStep : handleRegister}>
                    {step === 1 && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">{t('register.first_name')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full rounded-xl border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-0"
                                        placeholder="Ahmet"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">{t('register.last_name')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full rounded-xl border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-0"
                                        placeholder="Yılmaz"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">{t('register.tc_no')}</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={11}
                                    className="block w-full rounded-xl border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-0"
                                    placeholder="12345678901"
                                    value={formData.tcNo}
                                    onChange={(e) => setFormData({ ...formData, tcNo: e.target.value.replace(/[^0-9]/g, "") })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">{t('register.birth_date')}</label>
                                    <input
                                        type="date"
                                        required
                                        className="block w-full rounded-xl border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-0"
                                        value={formData.birthDate}
                                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">{t('register.gender')}</label>
                                    <select
                                        required
                                        className="block w-full rounded-xl border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-0"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="">{t('register.gender_placeholder')}</option>
                                        <option value="Erkek">{t('register.gender_male')}</option>
                                        <option value="Kadın">{t('register.gender_female')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">{t('common.email')}</label>
                                <input
                                    type="email"
                                    required
                                    className="block w-full rounded-xl border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-0"
                                    placeholder="ornek@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">{t('common.password')}</label>
                                <input
                                    type="password"
                                    required
                                    className="block w-full rounded-xl border border-gray-200 p-3 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-0"
                                    placeholder="******"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-xl bg-red-50 p-3 text-[11px] font-bold text-red-700">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rounded-xl bg-green-50 p-3 text-[11px] font-bold text-green-700">
                            {success}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={handlePrevStep}
                                className="flex w-1/4 items-center justify-center rounded-xl border border-gray-200 bg-white py-3 text-xs font-black text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-widest ring-1 ring-gray-100"
                            >
                                {t('register.btn_prev')}
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "group relative flex flex-1 justify-center rounded-xl bg-emerald-600 px-4 py-4 text-xs font-black text-white hover:bg-emerald-700 focus:outline-none focus:ring-0 disabled:opacity-50 active:scale-95 transition-all uppercase tracking-widest",
                                loading && "cursor-not-allowed"
                            )}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : step === 1 ? (
                                t('register.btn_next')
                            ) : (
                                t('register.btn_complete')
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <p className="text-xs font-bold text-gray-500">
                        {t('register.has_account')}{" "}
                        <Link
                            href="/login"
                            className="font-black text-emerald-600 hover:text-emerald-500"
                        >
                            {t('register.login_link')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
