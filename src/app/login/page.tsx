"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export default function LoginPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState<string | null>(null);

    const handleResendVerification = async () => {
        setResendLoading(true);
        setResendSuccess(null);
        setError(null);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) {
                setError(error.message);
            } else {
                setResendSuccess(t('login.resend_success'));
            }
        } catch (err: any) {
            setError(err.message || t('common.error'));
        } finally {
            setResendLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResendSuccess(null);
        setLoading(true);

        if (!email || !password) {
            setError(t('login.error_required'));
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message.includes("Invalid login credentials")) {
                    setError(t('login.error_invalid'));
                } else if (error.message.includes("Email not confirmed")) {
                    setError(t('login.error_unconfirmed'));
                } else {
                    setError(error.message);
                }
            } else {
                router.push("/profile");
                router.refresh();
            }
        } catch (err) {
            setError(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-background to-background p-6 overflow-hidden">
            <div className="w-full max-w-lg space-y-8 rounded-3xl bg-white/95 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] backdrop-blur-sm border border-white/10">
                <div className="text-center">
                    <h2 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
                        {t('login.title')}
                    </h2>
                    <p className="mt-2 text-sm font-bold text-gray-500">
                        {t('login.subtitle')}
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">{t('common.email')}</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full rounded-xl border border-gray-200 p-4 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-0"
                                placeholder={t('login.email_placeholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-500">{t('common.password')}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="block w-full rounded-xl border border-gray-200 p-4 text-sm font-bold text-gray-900 focus:border-emerald-500 focus:ring-0"
                                placeholder={t('login.password_placeholder')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-700">
                            <p>{error}</p>
                            {(error === t('login.error_unconfirmed') || error.includes("Email not confirmed")) && (
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={resendLoading}
                                    className="mt-2 text-emerald-600 hover:text-emerald-500 underline disabled:opacity-50"
                                >
                                    {resendLoading ? t('login.resend_loading') : t('login.resend_link')}
                                </button>
                            )}
                        </div>
                    )}

                    {resendSuccess && (
                        <div className="rounded-xl bg-green-50 p-4 text-xs font-bold text-green-700">
                            {resendSuccess}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "group relative flex w-full justify-center rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-black text-white hover:bg-emerald-700 focus:outline-none focus:ring-0 disabled:opacity-50 active:scale-95 transition-all text-center uppercase tracking-widest",
                            loading && "cursor-not-allowed"
                        )}
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : t('login.btn')}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-xs font-bold text-gray-500">
                        {t('login.no_account')}{" "}
                        <Link
                            href="/register"
                            className="font-black text-emerald-600 hover:text-emerald-500"
                        >
                            {t('login.register_link')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
