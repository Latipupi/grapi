import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseSafeExpiryDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date();
  if (d.getFullYear() < 100) {
    d.setFullYear(d.getFullYear() + 2000);
  } else if (d.getFullYear() < 1000) {
    const yrStr = d.getFullYear().toString();
    if (yrStr.startsWith('2') && yrStr.length === 3) {
      d.setFullYear(2000 + parseInt(yrStr.substring(1)));
    }
  }
  return d;
}

