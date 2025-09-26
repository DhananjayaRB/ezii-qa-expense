import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
}

export function formatDate(date: string | Date, format: "short" | "long" = "short"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (format === "long") {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

/**
 * Format date for display consistently across the application.
 * Always shows dates in DD-MM-YYYY format for Indian users.
 * Use this function for all date displays to maintain consistency.
 * 
 * @param date - Date string or Date object
 * @returns Formatted date string in DD-MM-YYYY format
 */
export function formatDateDisplay(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-GB');
}

/**
 * Get current date in YYYY-MM-DD format for HTML date inputs.
 * HTML date inputs always expect and return this format regardless of display locale.
 * Use this for initializing date input fields.
 * 
 * @returns Current date in YYYY-MM-DD format
 */
export function getCurrentDateForInput(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Convert date to API format (Date object).
 * Use this when sending dates to the backend API.
 * 
 * @param dateString - Date string from HTML input (YYYY-MM-DD format)
 * @returns Date object for API submission
 */
export function formatDateForAPI(dateString: string): Date {
  return new Date(dateString);
}
