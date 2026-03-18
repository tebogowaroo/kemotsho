export const formatCurrency = (amount: number, locale?: string, currency?: string) => {
    // Default to environment or standard if not provided
    const loc = locale || process.env.NEXT_PUBLIC_STORE_LOCALE || 'en-US'
    const curr = currency || process.env.NEXT_PUBLIC_STORE_CURRENCY || 'USD'
    
    // Safety check for invalid currency codes
    try {
        return new Intl.NumberFormat(loc, {
            style: 'currency',
            currency: curr,
            minimumFractionDigits: 2,
        }).format(amount / 100)
    } catch (e) {
        // Fallback
        return `${curr} ${(amount / 100).toFixed(2)}`
    }
}

export const formatDate = (date: Date | string | number, locale?: string) => {
    if (!date) return "";
    const d = new Date(date);
    const loc = locale || process.env.NEXT_PUBLIC_STORE_LOCALE || 'en-US';
    
    // Safety check
    try {
        return new Intl.DateTimeFormat(loc, {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(d);
    } catch (e) {
        return d.toDateString()
    }
}
