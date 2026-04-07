type InterestSignal = {
  email: string;
  note: string;
  createdAt: string;
};

const STORAGE_KEY = "actionbrief-interest-signals-v1";

export function readInterestSignals(): InterestSignal[] {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveInterestSignal(email: string, note: string) {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return [];
  }

  const nextSignal: InterestSignal = {
    email: email.trim(),
    note: note.trim(),
    createdAt: new Date().toISOString(),
  };

  const nextSignals = [...readInterestSignals(), nextSignal];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSignals));
  return nextSignals;
}
