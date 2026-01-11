"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { AlarmModal } from "@/components/AlarmModal";

interface AlarmContextType {
    pendingDoses: any[];
    audioEnabled: boolean;
    setAudioEnabled: (enabled: boolean) => void;
    enableAudio: () => void;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export function AlarmProvider({ children }: { children: React.ReactNode }) {
    const [pendingDoses, setPendingDoses] = useState<any[]>([]);
    const [activeDose, setActiveDose] = useState<any | null>(null);
    const [audioEnabled, _setAudioEnabled] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Persist setting
    useEffect(() => {
        const saved = localStorage.getItem("alarm_audio_enabled");
        if (saved !== null) {
            _setAudioEnabled(saved === "true");
        }
        setIsInitialized(true);
    }, []);

    const setAudioEnabled = (enabled: boolean) => {
        _setAudioEnabled(enabled);
        localStorage.setItem("alarm_audio_enabled", String(enabled));
    };

    // Remote Fallback URL
    const REMOTE_ALARM = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

    // AudioContext Siren Generator
    const playSiren = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 1);
        } catch (e) {
            console.error("Siren failed", e);
        }
    };

    // Audio setup
    useEffect(() => {
        const audio = new Audio("/alarm.mp3");
        audio.loop = true;

        audio.onerror = () => {
            console.warn("alarm.mp3 not found, switching to remote fallback.");
            audio.src = REMOTE_ALARM;
        };

        audioRef.current = audio;
    }, []);

    // Handle audio activation (Browser Autoplay bypass)
    const enableAudio = () => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current?.pause();
                if (audioRef.current) audioRef.current.currentTime = 0;
                setAudioEnabled(true);
            }).catch(e => {
                console.error("Audio activation failed", e);
                // Try siren to see if AudioContext works
                playSiren();
                setAudioEnabled(true);
            });
        }
    };

    // Play alarm when activeDose exists
    useEffect(() => {
        if (activeDose && audioEnabled) {
            console.log("Attempting to play alarm...");
            audioRef.current?.play().catch(e => {
                console.error("Play failed", e);
                playSiren();
            });
        } else {
            audioRef.current?.pause();
            if (audioRef.current) audioRef.current.currentTime = 0;
        }
    }, [activeDose, audioEnabled]);

    const fetchPendingDoses = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const { data, error } = await supabase
            .from("medication_logs")
            .select("*, medications(name, dosage)")
            .eq("user_id", user.id)
            .eq("status", "pending")
            .lte("scheduled_time", now.toISOString())
            .gte("scheduled_time", oneHourAgo.toISOString())
            .order("scheduled_time", { ascending: true });

        if (error) {
            console.error("Fetch error:", error);
            return;
        }

        if (data && data.length > 0) {
            setPendingDoses(data);
            if (!activeDose) {
                setActiveDose(data[0]);
            }
        } else {
            setPendingDoses([]);
        }
    };

    useEffect(() => {
        // Check every 1 second for instant alarm triggering
        const interval = setInterval(fetchPendingDoses, 1000);
        fetchPendingDoses();
        return () => clearInterval(interval);
    }, [activeDose]);

    const handleAction = async (status: "taken" | "missed") => {
        if (!activeDose) return;

        const { error } = await supabase
            .from("medication_logs")
            .update({
                status,
                taken_at: status === "taken" ? new Date().toISOString() : null
            })
            .eq("id", activeDose.id);

        if (error) {
            alert("İşlem kaydedilemedi: " + error.message);
            return;
        }

        setActiveDose(null);
        fetchPendingDoses();
    };

    return (
        <AlarmContext.Provider value={{ pendingDoses, audioEnabled, setAudioEnabled, enableAudio }}>
            {children}
            {activeDose && (
                <AlarmModal
                    medicationName={activeDose.medications?.name || "İlaç"}
                    dosage={activeDose.medications?.dosage || ""}
                    scheduledTime={activeDose.scheduled_time}
                    onTaken={() => handleAction("taken")}
                    onMissed={() => handleAction("missed")}
                />
            )}
        </AlarmContext.Provider>
    );
}

export const useAlarm = () => {
    const context = useContext(AlarmContext);
    if (!context) throw new Error("useAlarm must be used within AlarmProvider");
    return context;
};
