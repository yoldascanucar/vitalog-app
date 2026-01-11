"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export default function ResetPasswordPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: 'Lütfen tüm alanları doldurun' });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Şifreler eşleşmiyor' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Şifreniz başarıyla güncellendi!' });

            // Auto-dismiss and redirect after 3 seconds
            setTimeout(() => {
                setMessage(null);
                router.push('/login');
            }, 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Bir hata oluştu' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
            <div className="w-full max-w-md">
                <div className="rounded-[32px] bg-white p-8 shadow-2xl ring-1 ring-gray-100">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                            <Lock className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">Şifre Sıfırlama</h1>
                        <p className="mt-2 text-sm text-gray-500">Yeni şifrenizi belirleyin</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Yeni Şifre
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-12 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    placeholder="En az 6 karakter"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Şifre Tekrar
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-12 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    placeholder="Şifrenizi tekrar girin"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-emerald-600 py-4 text-sm font-black text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Güncelleniyor...
                                </>
                            ) : (
                                'Şifremi Güncelle'
                            )}
                        </button>
                    </form>
                </div>

                {/* Success/Error Message */}
                {message && (
                    <div className={cn(
                        "mt-4 p-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 text-center animate-in fade-in slide-in-from-bottom-4 duration-300",
                        message.type === 'success' ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                    )}>
                        {message.type === 'success' && <span className="text-lg">✓</span>}
                        <p className="text-xs font-black">{message.text}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
