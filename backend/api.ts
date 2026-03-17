/**
 * Generates a deterministic float between 0 and 1 based on a string seed.
 * Used to ensure unknown diseases consistently return the same random ratios.
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    return Math.abs(hash) / 2147483647;
}

/**
 * Hardcoded baseline ratios for known diseases.
 * ratio: multiplier against global COVID baseline
 * activeRatio: percentage of total cases that are currently active
 * cfr: Case Fatality Rate
 * growthBase: baseline day-over-day growth percentage
 * trend: shape of the historical timeline curve
 */
const DISEASE_PROFILES: Record<string, any> = {
    "covid-19": { ratio: 1.0, activeRatio: 0.03, cfr: 0.01, growthBase: 0, trend: "flat" },
    "dengue": { ratio: 0.06, activeRatio: 0.1, cfr: 0.005, growthBase: 5, trend: "rising" },
    "influenza": { ratio: 0.4, activeRatio: 0.08, cfr: 0.001, growthBase: 2, trend: "flat" },
    "ebola": { ratio: 0.0001, activeRatio: 0.2, cfr: 0.5, growthBase: 10, trend: "exponential" },
    "mpox": { ratio: 0.001, activeRatio: 0.15, cfr: 0.03, growthBase: 4, trend: "rising" },
    "cholera": { ratio: 0.01, activeRatio: 0.12, cfr: 0.02, growthBase: -2, trend: "declining" },
    "tuberculosis": { ratio: 0.015, activeRatio: 0.2, cfr: 0.1, growthBase: -1, trend: "flat" },
    "malaria": { ratio: 0.3, activeRatio: 0.1, cfr: 0.003, growthBase: 1, trend: "flat" },
    "h5n1": { ratio: 0.00001, activeRatio: 0.3, cfr: 0.52, growthBase: 12, trend: "exponential" },
    "sars": { ratio: 0.00002, activeRatio: 0.01, cfr: 0.1, growthBase: -5, trend: "declining" },
    "measles": { ratio: 0.02, activeRatio: 0.05, cfr: 0.015, growthBase: 8, trend: "rising" },
    "typhoid": { ratio: 0.03, activeRatio: 0.08, cfr: 0.01, growthBase: 0, trend: "flat" },
    "fever": { ratio: 0.5, activeRatio: 0.1, cfr: 0.001, growthBase: 0, trend: "flat" }
};

/**
 * Returns the configured profile for a disease, or generates a deterministic
 * fallback profile for unknown diseases.
 */
function getDiseaseProfile(query: string) {
    const key = query.toLowerCase().trim();
    if (DISEASE_PROFILES[key]) return DISEASE_PROFILES[key];
    
    const h = hashString(key);
    
    // Deterministic fallback bounds:
    // ratio: 0.01% to 10% of COVID baseline
    // activeRatio: 1% to 21%
    // cfr: 0.1% to 10%
    // growthBase: -5 to +15
    return {
        ratio: 0.0001 + (h * 0.1), 
        activeRatio: 0.01 + (h * 0.2), 
        cfr: 0.001 + (h * 0.1), 
        growthBase: -5 + (h * 20),
        trend: h > 0.75 ? "exponential" : (h > 0.5 ? "rising" : (h > 0.25 ? "flat" : "declining"))
    };
}

export async function fetchDiseaseStats(disease: string) {
    // 1. Fetch the real baseline (COVID) data from your backend
    // Adjust URL as needed for your environment (e.g., process.env.NEXT_PUBLIC_API_URL)
    const res = await fetch('/api/overview');
    if (!res.ok) throw new Error("Failed to fetch overview data");
    const baseData = await res.json();
    
    // 2. Derive disease-specific numbers
    const profile = getDiseaseProfile(disease);
    const h = hashString(disease + "growth"); // secondary seed for variance
    
    const totalCases = Math.floor((baseData.cases || baseData.totalCases) * profile.ratio);
    const activeCases = Math.floor(totalCases * profile.activeRatio);
    const deaths = Math.floor(totalCases * profile.cfr);
    
    // Add slight deterministic variance to the hardcoded growth base (+/- 2%)
    const growthRate = parseFloat((profile.growthBase + (h * 4 - 2)).toFixed(2));
    
    // Derive Risk Level based on Growth and Case Fatality Rate
    let riskLevel = "Low";
    if (growthRate > 5 || profile.cfr > 0.05) riskLevel = "High";
    if (growthRate > 10 || profile.cfr > 0.2) riskLevel = "Severe";
    if (riskLevel === "Low" && (growthRate > 2 || profile.cfr > 0.01)) riskLevel = "Moderate";
    
    return {
        disease: disease.charAt(0).toUpperCase() + disease.slice(1),
        totalCases,
        activeCases,
        deaths,
        recovered: totalCases - activeCases - deaths,
        cfr: (profile.cfr * 100).toFixed(2) + "%",
        growthRate,
        riskLevel
    };
}

export async function fetchTrendData(disease: string, days: number = 30) {
    // 1. Fetch base timeline
    const res = await fetch(`/api/trends?days=${days}`);
    if (!res.ok) throw new Error("Failed to fetch trend data");
    const baseTimeline = await res.json();
    
    // 2. Apply disease curve logic
    const profile = getDiseaseProfile(disease);
    const h = hashString(disease + "curve");
    
    return baseTimeline.map((point: any, index: number) => {
        const progress = index / days; // 0.0 to 1.0 over the timeline
        let curveMultiplier = 1;
        
        switch (profile.trend) {
            case "exponential":
                // Starts low, spikes heavily towards the end of the timeline
                curveMultiplier = Math.pow(1.1 + (h * 0.05), index);
                break;
            case "rising":
                // Linear rise
                curveMultiplier = 1 + (progress * 2);
                break;
            case "declining":
                // Linear decline
                curveMultiplier = 1 - (progress * 0.8);
                break;
            case "flat":
            default:
                // Mostly flat but with some deterministic sine-wave noise
                curveMultiplier = 1 + (Math.sin(index + h * 10) * 0.15);
                break;
        }
        
        return {
            date: point.date,
            cases: Math.max(0, Math.floor((point.cases * profile.ratio) * curveMultiplier)),
            deaths: Math.max(0, Math.floor((point.deaths * profile.ratio) * curveMultiplier))
        };
    });
}