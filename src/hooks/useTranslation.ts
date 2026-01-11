"use client";

import { useSettings } from "@/context/SettingsContext";
import { translations, TranslationKeys } from "@/lib/translations";

export function useTranslation() {
    const { language } = useSettings();

    // Fallback to Turkish if language not found
    const t = (path: string, params?: Record<string, any>) => {
        const keys = path.split('.');
        let result: any = translations[language] || translations.tr;

        for (const key of keys) {
            if (result[key] === undefined) {
                // Return key if path not found
                return path;
            }
            result = result[key];
        }

        if (typeof result === 'string' && params) {
            Object.keys(params).forEach(key => {
                result = (result as string).replace(`{${key}}`, params[key]);
            });
        }

        return result;
    };

    return { t, language };
}
