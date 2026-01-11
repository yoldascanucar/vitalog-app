"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Font = "Inter" | "Outfit" | "Roboto" | "Lexend";
type Language = "tr" | "en" | "de";

interface SettingsContextType {
    font: Font;
    language: Language;
    setFont: (font: Font) => void;
    setLanguage: (lang: Language) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [font, setFont] = useState<Font>("Outfit");
    const [language, setLanguage] = useState<Language>("tr");

    // Load from localStorage on mount
    useEffect(() => {
        const savedFont = localStorage.getItem("app-font") as Font;
        const savedLang = localStorage.getItem("app-lang") as Language;

        if (savedFont) setFont(savedFont);
        if (savedLang) setLanguage(savedLang);
    }, []);

    // Apply font to document body
    useEffect(() => {
        const fontClassMap: Record<Font, string> = {
            'Inter': 'font-inter',
            'Outfit': 'font-outfit',
            'Roboto': 'font-roboto',
            'Lexend': 'font-lexend'
        };

        // Remove all font classes
        Object.values(fontClassMap).forEach(cls => document.body.classList.remove(cls));
        // Add current font class
        document.body.classList.add(fontClassMap[font]);

        localStorage.setItem("app-font", font);
    }, [font]);

    // Language persistence
    useEffect(() => {
        localStorage.setItem("app-lang", language);
    }, [language]);

    return (
        <SettingsContext.Provider value={{ font, language, setFont, setLanguage }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) throw new Error("useSettings must be used within SettingsProvider");
    return context;
};
