import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { calculateEndTime } from "@/lib/utils/time-calculations";

type UseBookingSlotsOptions = {
  isOpen: boolean;
  initialDate?: Date;
  initialHour?: number;
};

export function useBookingSlots({
  isOpen,
  initialDate,
  initialHour,
}: UseBookingSlotsOptions) {
  const [date, setDate] = useState(format(initialDate || new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(
    `${String(initialHour ?? 9).padStart(2, "0")}:00`
  );

  useEffect(() => {
    if (!isOpen) return;
    const baseDate = initialDate || new Date();
    const baseHour = initialHour ?? 9;
    setDate(format(baseDate, "yyyy-MM-dd"));
    setStartTime(`${String(baseHour).padStart(2, "0")}:00`);
  }, [isOpen, initialDate, initialHour]);

  const getEndTime = useCallback(
    (durationMinutes: number) => calculateEndTime(startTime, durationMinutes),
    [startTime]
  );

  return {
    date,
    setDate,
    startTime,
    setStartTime,
    getEndTime,
  };
}
