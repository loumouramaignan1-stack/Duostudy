// Google Analytics 4 (GA4) Integration Utility

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Read GA4 Measurement ID from environment variables or use a default test one
const DEFAULT_ID = "G-HELLOGA4PRO"; // Place-holder tracking tag
export const GA4_MEASUREMENT_ID = (import.meta as any).env?.VITE_GA4_MEASUREMENT_ID || DEFAULT_ID;

/**
 * Dynamically loads the GA4 gtag.js script and initializes window.dataLayer.
 */
export function initGA4() {
  if (typeof window === "undefined" || !GA4_MEASUREMENT_ID) return;

  // Prevent duplicate script loading
  if (window.gtag) return;

  try {
    // 1. Create and inject script tag
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // 2. Setup standard gtag global fields
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: any[]) {
      window.dataLayer.push(args);
    };

    // 3. Initialize config
    window.gtag("js", new Date());
    window.gtag("config", GA4_MEASUREMENT_ID, {
      send_page_view: false, // We'll manage page views manually in Router/tabs
      cookie_flags: "SameSite=None;Secure",
    });

    console.log(`[GA4] Initialized tracking with ID: ${GA4_MEASUREMENT_ID}`);
  } catch (err) {
    console.error("[GA4] Error while initializing GA4 script dynamic loading: ", err);
  }
}

/**
 * Log a custom GA4 event.
 */
export function logGA4Event(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;
  
  // Ensure initialized
  if (!window.gtag) {
    initGA4();
  }

  if (window.gtag) {
    window.gtag("event", eventName, {
      ...params,
      timestamp: new Date().toISOString(),
      platform: "ai-studio",
    });
    console.log(`[GA4 Tracked Event] ${eventName}`, params);
  }
}

/**
 * Log page or tab changes as page_view events.
 */
export function logGA4PageView(pagePath: string, pageTitle: string) {
  if (typeof window === "undefined") return;
  
  if (!window.gtag) {
    initGA4();
  }

  if (window.gtag) {
    window.gtag("config", GA4_MEASUREMENT_ID, {
      page_path: pagePath,
      page_title: pageTitle,
    });
    // Send event manually since we disabled automatic page_views
    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_title: pageTitle,
    });
    console.log(`[GA4 Tracked PageView] Path: ${pagePath} | Title: ${pageTitle}`);
  }
}

/**
 * Configure logged-in user context in GA4.
 */
export function setGA4UserContext(userId: string, userEmail?: string | null) {
  if (typeof window === "undefined") return;
  
  if (!window.gtag) {
    initGA4();
  }

  if (window.gtag) {
    // Set user ID and user properties
    window.gtag("config", GA4_MEASUREMENT_ID, {
      user_id: userId,
      user_properties: {
        email: userEmail || "anonymous",
      },
    });
    console.log(`[GA4 User Context Set] ID: ${userId} (${userEmail})`);
  }
}
