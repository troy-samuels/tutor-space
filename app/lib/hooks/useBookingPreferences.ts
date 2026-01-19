"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_SERVICE = "tutorlingua_last_service";
const STORAGE_KEY_STUDENT = "tutorlingua_last_student";
const STORAGE_KEY_QUICK_MODE = "tutorlingua_quick_booking_quick_mode";

export type BookingPreferences = {
  lastServiceId: string | null;
  lastStudentId: string | null;
  quickModeEnabled: boolean;
};

type Service = {
  id: string;
  name?: string;
};

type Student = {
  id: string;
  full_name?: string;
};

type UseBookingPreferencesOptions = {
  mostUsedServiceId?: string;
};

export function useBookingPreferences(options: UseBookingPreferencesOptions = {}) {
  const { mostUsedServiceId } = options;

  const [preferences, setPreferences] = useState<BookingPreferences>({
    lastServiceId: null,
    lastStudentId: null,
    quickModeEnabled: true,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const lastServiceId = localStorage.getItem(STORAGE_KEY_SERVICE);
      const lastStudentId = localStorage.getItem(STORAGE_KEY_STUDENT);
      const quickModeStored = localStorage.getItem(STORAGE_KEY_QUICK_MODE);
      const quickModeEnabled = quickModeStored ? quickModeStored === "true" : true;

      setPreferences({
        lastServiceId,
        lastStudentId,
        quickModeEnabled,
      });
    } catch {
      // Ignore storage failures (e.g., blocked localStorage) and keep defaults.
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save service ID to localStorage
  const saveServiceId = useCallback((serviceId: string) => {
    setPreferences((prev) => ({ ...prev, lastServiceId: serviceId }));
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_SERVICE, serviceId);
    } catch {
      // Ignore storage failures and keep in-memory preference.
    }
  }, []);

  // Save student ID to localStorage
  const saveStudentId = useCallback((studentId: string) => {
    setPreferences((prev) => ({ ...prev, lastStudentId: studentId }));
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_STUDENT, studentId);
    } catch {
      // Ignore storage failures and keep in-memory preference.
    }
  }, []);

  // Toggle quick mode
  const setQuickMode = useCallback((enabled: boolean) => {
    setPreferences((prev) => ({ ...prev, quickModeEnabled: enabled }));
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_QUICK_MODE, String(enabled));
    } catch {
      // Ignore storage failures and keep in-memory preference.
    }
  }, []);

  // Get smart default service based on priority:
  // 1. Last used service (if still exists in list)
  // 2. Most used service (if provided)
  // 3. First service (if only one exists)
  // 4. Empty string (prompt selection)
  const getSmartDefaultService = useCallback(
    (services: Service[]): string => {
      if (services.length === 0) return "";

      // Priority 1: Last used service
      if (
        preferences.lastServiceId &&
        services.some((s) => s.id === preferences.lastServiceId)
      ) {
        return preferences.lastServiceId;
      }

      // Priority 2: Most used service (from analytics)
      if (mostUsedServiceId && services.some((s) => s.id === mostUsedServiceId)) {
        return mostUsedServiceId;
      }

      // Priority 3: Single service auto-select
      if (services.length === 1) {
        return services[0].id;
      }

      // Priority 4: Prompt selection
      return "";
    },
    [preferences.lastServiceId, mostUsedServiceId]
  );

  // Get smart default student based on priority:
  // 1. Last used student (if still exists in list)
  // 2. Most recent student from recent bookings
  // 3. Empty string (prompt selection)
  const getSmartDefaultStudent = useCallback(
    (students: Student[], recentIds: string[] = []): string => {
      if (students.length === 0) return "";

      // Priority 1: Last used student
      if (
        preferences.lastStudentId &&
        students.some((s) => s.id === preferences.lastStudentId)
      ) {
        return preferences.lastStudentId;
      }

      // Priority 2: Most recent from recent bookings
      if (recentIds.length > 0) {
        const firstRecent = recentIds.find((id) =>
          students.some((s) => s.id === id)
        );
        if (firstRecent) return firstRecent;
      }

      // Priority 3: Prompt selection
      return "";
    },
    [preferences.lastStudentId]
  );

  return {
    preferences,
    isLoaded,
    saveServiceId,
    saveStudentId,
    setQuickMode,
    getSmartDefaultService,
    getSmartDefaultStudent,
  };
}
