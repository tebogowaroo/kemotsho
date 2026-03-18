export const COURIERS: Record<string, string> = {
    "The Courier Guy": "https://portal.thecourierguy.co.za/track-colli?id={code}",
    "Fastway": "http://www.fastway.co.za/our-services/track-your-parcel?l={code}",
    "Aramex": "https://www.aramex.com/track/results?mode=0&shipment_type=0&shipments={code}",
    "Dawn Wing": "http://www.dawnwing.co.za/track-trace/?waybill={code}",
    "Internet Express": "https://internetexpress.co.za/track-trace/?waybill={code}",
    "RAM": "https://www.ram.co.za/track/{code}"
}

export function getTrackingLink(courier: string, code: string): string | null {
    if (!courier || !code) return null;
    
    // Exact match
    const template = COURIERS[courier];
    if (template) {
        return template.replace("{code}", code);
    }
    
    // Fallback? Or try to fuzzy match?
    // For now, return null or maybe a generic google search?
    return `https://www.google.com/search?q=${encodeURIComponent(`${courier} tracking ${code}`)}`;
}
