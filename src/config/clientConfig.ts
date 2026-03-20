/**
 * clientConfig.ts — White-label + buyer demo configuration
 *
 * To bundle for a buyer:
 *   1. Set CLIENT_NAME, CLIENT_LOGO, CLIENT_PRIMARY_COLOR
 *   2. Set DEMO_MODE = false for live deployment
 *   3. Replace seed data with real CSV import
 */

export interface ClientConfig {
  clientName: string;
  clientShortName: string;
  clientTagline: string;
  clientLogo?: string; // URL or import path
  primaryColor?: string; // HSL string e.g. "213 59% 24%"
  accentColor?: string;
  demoMode: boolean;
  demoAthleteCount: number;
  showLicensePage: boolean;
  showMethodologyPage: boolean;
  footerNote?: string;
  supportEmail?: string;
  maxAthletes?: number; // license limit
  features: {
    aiQuery: boolean;
    reports: boolean;
    dataImport: boolean;
    analytics: boolean;
    multiLanguage: boolean;
  };
}

/**
 * Default config — Pratibha by SPLINK
 * Override per client by creating src/config/clientConfig.override.ts
 */
export const CLIENT_CONFIG: ClientConfig = {
  clientName: "Pratibha",
  clientShortName: "SPLINK",
  clientTagline: "Athlete Intelligence Platform",
  demoMode: true, // Set to false in production deployments
  demoAthleteCount: 82,
  showLicensePage: true,
  showMethodologyPage: true,
  footerNote: "Powered by SPLINK Analytics Engine v1.0",
  supportEmail: "support@splink.in",
  features: {
    aiQuery: true,
    reports: true,
    dataImport: true,
    analytics: true,
    multiLanguage: true,
  },
};

export function isDemoMode(): boolean {
  return CLIENT_CONFIG.demoMode;
}
