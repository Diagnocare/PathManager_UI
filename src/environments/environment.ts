/**
 * PRODUCTION environment (default for `ng build`).
 * Overridden per configuration via angular.json fileReplacements:
 *   development → environment.development.ts
 *   qa         → environment.qa.ts
 *   uat        → environment.uat.ts
 * Replace the placeholder host below with your real production API URL.
 */
export const environment = {
  production: false,
  name: 'local',
  apiBaseUrl: 'https://localhost:7080',
};
