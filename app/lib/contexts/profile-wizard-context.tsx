"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Step data types
export type Step1Data = {
  full_name: string;
  username: string;
  timezone: string;
  primary_language: string;
};

export type Step2Data = {
  bio: string;
  tagline: string;
  avatar_url: string;
  languages_taught: string;
};

export type Step3Data = {
  booking_enabled: boolean;
  auto_accept_bookings: boolean;
  buffer_time_minutes: number;
};

export type Step4Data = {
  website_url: string;
  instagram_handle: string;
};

// Combined wizard state
export type WizardState = {
  step1: Partial<Step1Data>;
  step2: Partial<Step2Data>;
  step3: Partial<Step3Data>;
  step4: Partial<Step4Data>;
  avatarFile: File | null;
};

// Context value type
type ProfileWizardContextValue = {
  state: WizardState;
  updateStep1: (data: Partial<Step1Data>) => void;
  updateStep2: (data: Partial<Step2Data>) => void;
  updateStep3: (data: Partial<Step3Data>) => void;
  updateStep4: (data: Partial<Step4Data>) => void;
  setAvatarFile: (file: File | null) => void;
  saveProgress: () => Promise<{ success: boolean; error?: string; avatarUrl?: string }>;
  isLoading: boolean;
  saveError: string | null;
};

const ProfileWizardContext = createContext<ProfileWizardContextValue | null>(null);

// Provider props
type ProfileWizardProviderProps = {
  children: ReactNode;
  initialValues?: Partial<WizardState>;
  onComplete?: () => void;
};

export function ProfileWizardProvider({
  children,
  initialValues,
  onComplete,
}: ProfileWizardProviderProps) {
  const [state, setState] = useState<WizardState>({
    step1: initialValues?.step1 || {},
    step2: initialValues?.step2 || {},
    step3: initialValues?.step3 || {
      booking_enabled: true,
      auto_accept_bookings: false,
      buffer_time_minutes: 15,
    },
    step4: initialValues?.step4 || {},
    avatarFile: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const updateStep1 = (data: Partial<Step1Data>) => {
    setState((prev) => ({
      ...prev,
      step1: { ...prev.step1, ...data },
    }));
  };

  const updateStep2 = (data: Partial<Step2Data>) => {
    setState((prev) => ({
      ...prev,
      step2: { ...prev.step2, ...data },
    }));
  };

  const updateStep3 = (data: Partial<Step3Data>) => {
    setState((prev) => ({
      ...prev,
      step3: { ...prev.step3, ...data },
    }));
  };

  const updateStep4 = (data: Partial<Step4Data>) => {
    setState((prev) => ({
      ...prev,
      step4: { ...prev.step4, ...data },
    }));
  };

  const setAvatarFile = (file: File | null) => {
    setState((prev) => ({
      ...prev,
      avatarFile: file,
    }));
  };

  const saveProgress = async (): Promise<{ success: boolean; error?: string; avatarUrl?: string }> => {
    setIsLoading(true);
    setSaveError(null);

    try {
      const { saveWizardProgress } = await import("@/lib/actions/profile-wizard");
      const result = await saveWizardProgress(state);

      if (result.success) {
        // Update avatar URL in state if one was uploaded
        if (result.avatarUrl) {
          setState((prev) => ({
            ...prev,
            step2: { ...prev.step2, avatar_url: result.avatarUrl },
            avatarFile: null, // Clear the file after successful upload
          }));
        }
        setIsLoading(false);
        return { success: true, avatarUrl: result.avatarUrl };
      } else {
        setSaveError(result.error || "Failed to save");
        setIsLoading(false);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save";
      setSaveError(errorMessage);
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const value: ProfileWizardContextValue = {
    state,
    updateStep1,
    updateStep2,
    updateStep3,
    updateStep4,
    setAvatarFile,
    saveProgress,
    isLoading,
    saveError,
  };

  return (
    <ProfileWizardContext.Provider value={value}>
      {children}
    </ProfileWizardContext.Provider>
  );
}

// Hook to use the context
export function useProfileWizard() {
  const context = useContext(ProfileWizardContext);
  if (!context) {
    throw new Error("useProfileWizard must be used within ProfileWizardProvider");
  }
  return context;
}
