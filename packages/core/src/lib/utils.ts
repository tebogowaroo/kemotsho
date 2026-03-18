import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { getTenantConfig } from "@kemotsho/core/config/tenant"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
    const config = getTenantConfig()
    return new Intl.NumberFormat(config.store.locale, {
        style: "currency",
        currency: config.store.currency,
        minimumFractionDigits: 2
    }).format(amount / 100)
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, "") // Trim - from end of text
}

export function formatDate(date: Date | string | number) {
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date))
}

