const apiBaseUrl =
  window.__FOAM_RUNTIME_CONFIG__?.apiBaseUrl?.replace(/\/$/, '') ?? '';
const configuredPublicApiBaseUrl =
  window.__FOAM_RUNTIME_CONFIG__?.publicApiBaseUrl?.replace(/\/$/, '') ?? '';
const developmentApiBaseUrl =
  typeof __FOAM_DEV_API_TARGET__ === 'string'
    ? __FOAM_DEV_API_TARGET__.replace(/\/$/, '')
    : '';

export const runtimeConfig = {
  apiBaseUrl,
  publicApiBaseUrl:
    configuredPublicApiBaseUrl ||
    apiBaseUrl ||
    developmentApiBaseUrl ||
    window.location.origin,
};
