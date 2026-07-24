export {};

declare global {
  const __FOAM_DEV_API_TARGET__: string;

  interface Window {
    __FOAM_RUNTIME_CONFIG__?: {
      apiBaseUrl?: string;
      publicApiBaseUrl?: string;
    };
  }
}
