/** Feature flags — set via Vite env (VITE_*) */
export const features = {
  /** PIN tab on login (requires auth_pin on API) */
  pinAuth: import.meta.env.VITE_ENABLE_PIN_AUTH === "true",
  postgresApi: Boolean(import.meta.env.VITE_POSTGRES_API),
} as const;
