import { useCallback, useEffect, useState } from "react";

type UseBookingFormOptions = {
  isOpen: boolean;
  isReady: boolean;
  tutorTimezone: string;
  defaultServiceId: string;
  defaultStudentId: string;
  quickModeEnabled: boolean;
};

export function useBookingForm({
  isOpen,
  isReady,
  tutorTimezone,
  defaultServiceId,
  defaultStudentId,
  quickModeEnabled,
}: UseBookingFormOptions) {
  const [serviceId, setServiceId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid">("unpaid");
  const [notes, setNotes] = useState("");
  const [isQuickMode, setIsQuickMode] = useState(true);
  const [step, setStep] = useState(0);

  const [showNewStudent, setShowNewStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentTimezone, setNewStudentTimezone] = useState(tutorTimezone);

  useEffect(() => {
    if (!isOpen || !isReady) return;
    setIsQuickMode(quickModeEnabled);
    setServiceId(defaultServiceId);
    setStudentId(defaultStudentId);
    setPaymentStatus("unpaid");
    setNotes("");
    setShowNewStudent(false);
    setNewStudentName("");
    setNewStudentEmail("");
    setNewStudentTimezone(tutorTimezone);
    setStep(0);
  }, [
    isOpen,
    isReady,
    quickModeEnabled,
    defaultServiceId,
    defaultStudentId,
    tutorTimezone,
  ]);

  const handleQuickModeChange = useCallback((checked: boolean) => {
    setIsQuickMode(checked);
    setStep(0);
  }, []);

  const resetNewStudent = useCallback(() => {
    setShowNewStudent(false);
    setNewStudentName("");
    setNewStudentEmail("");
  }, []);

  const resetForm = useCallback(() => {
    setServiceId("");
    setStudentId("");
    setPaymentStatus("unpaid");
    setNotes("");
    setShowNewStudent(false);
    setNewStudentName("");
    setNewStudentEmail("");
  }, []);

  return {
    serviceId,
    setServiceId,
    studentId,
    setStudentId,
    paymentStatus,
    setPaymentStatus,
    notes,
    setNotes,
    isQuickMode,
    setIsQuickMode,
    step,
    setStep,
    showNewStudent,
    setShowNewStudent,
    newStudentName,
    setNewStudentName,
    newStudentEmail,
    setNewStudentEmail,
    newStudentTimezone,
    setNewStudentTimezone,
    handleQuickModeChange,
    resetNewStudent,
    resetForm,
  };
}
