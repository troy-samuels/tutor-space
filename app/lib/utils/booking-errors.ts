export function formatBookingError(error?: string | null): string | null {
  if (!error) return null;

  const message = error.trim();
  if (!message) return null;

  const normalized = message.toLowerCase();

  if (normalized.includes("log in")) {
    return "Please log in to book. You will be returned here after signing in.";
  }
  if (normalized.includes("approved connection")) {
    return "You need the tutor's approval before booking. Request access first.";
  }
  if (normalized.includes("service not found") || normalized.includes("inactive")) {
    return "That service is not available right now. Refresh the page or choose another service.";
  }
  if (normalized.includes("duration") && normalized.includes("match")) {
    return "The lesson length changed. Refresh the page and choose a new time.";
  }
  if (normalized.includes("invalid currency") || normalized.includes("invalid price")) {
    return "Pricing for this service changed. Refresh the page and try again.";
  }
  if (normalized.includes("price is not configured")) {
    return "This service does not have a price set yet. Ask the tutor to update pricing.";
  }
  if (normalized.includes("just booked")) {
    return "That time was just booked. Please choose another slot.";
  }
  if (normalized.includes("blocked")) {
    return "That time is no longer available. Please choose another slot.";
  }
  if (normalized.includes("calendar is busy") || normalized.includes("retry booking")) {
    return "The calendar is busy right now. Wait a moment and try again.";
  }
  if (normalized.includes("too many booking attempts")) {
    return "Too many booking attempts. Please wait a minute and try again.";
  }
  if (normalized.includes("credits are not required")) {
    return "This lesson is free. Remove credits and try again.";
  }
  if (normalized.includes("failed to save student")) {
    return "We could not save your details. Check your information and try again.";
  }
  if (normalized.includes("failed to create booking")) {
    return "We could not complete the booking. Try again or contact your tutor.";
  }

  return message;
}
