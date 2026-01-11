"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { Info, Code, User, Building2, Calendar, Sparkles } from "lucide-react";

export default function AboutPage() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col min-h-full bg-gradient-to-b from-emerald-50 to-white p-6 pb-24">
            <h1 className="text-3xl font-black tracking-tighter text-gray-900 mb-8">
                {t('about.title')}
            </h1>

            <div className="space-y-6">
                {/* App Info Card */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="rounded-xl bg-emerald-50 p-2">
                            <Sparkles className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900">{t('about.app_name')}</h2>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                        {t('about.description')}
                    </p>
                    <p className="text-xs font-bold text-gray-500">
                        {t('about.version')} • {t('about.year')}
                    </p>
                </div>

                {/* Developer Card */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-xl bg-blue-50 p-2">
                            <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                                {t('about.developer')}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                                {t('about.developer_name')}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Solo Developer</p>
                </div>

                {/* Company Card */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-purple-50 p-2">
                            <Building2 className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                                {t('about.company')}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                                {t('about.company_name')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tech Stack Card */}
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="rounded-xl bg-orange-50 p-2">
                            <Code className="h-6 w-6 text-orange-600" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">
                            {t('about.tech_stack')}
                        </h3>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                        {t('about.tech_desc')}
                    </p>
                </div>

                {/* Footer */}
                <div className="text-center pt-4">
                    <p className="text-xs text-gray-400">
                        Made with ❤️ by {t('about.developer_name')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        © {t('about.year')} {t('about.company_name')}
                    </p>
                </div>
            </div>
        </div>
    );
}
