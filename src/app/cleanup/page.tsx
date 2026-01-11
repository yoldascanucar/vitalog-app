"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CleanupPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Temizleniyor...");

    useEffect(() => {
        async function cleanup() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setStatus("Kullanıcı bulunamadı. Lütfen giriş yapın.");
                    return;
                }

                // Remove avatar_url from metadata
                const { error } = await supabase.auth.updateUser({
                    data: {
                        ...user.user_metadata,
                        avatar_url: null
                    }
                });

                if (error) throw error;

                setStatus("✅ Metadata temizlendi! Yönlendiriliyorsunuz...");

                // Logout and login again to refresh session
                await supabase.auth.signOut();
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } catch (error: any) {
                setStatus(`❌ Hata: ${error.message}`);
            }
        }

        cleanup();
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-900">{status}</p>
                <p className="text-sm text-gray-500 mt-2">Lütfen bekleyin...</p>
            </div>
        </div>
    );
}
