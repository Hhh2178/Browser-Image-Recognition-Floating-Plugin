const HOVER_ORIGINS = ["http://*/*", "https://*/*"];
const HOVER_SCRIPT_ID = "hhh-hover";

type PermissionRequest = (
  permissions: chrome.permissions.Permissions
) => Promise<boolean>;

export function endpointOriginPattern(value: string): string {
  const url = new URL(value);
  return `${url.protocol}//${url.host}/*`;
}

export function requestEndpointPermission(
  value: string,
  request?: PermissionRequest
): Promise<boolean> {
  return requestEndpointPermissions([value], request);
}

export async function requestEndpointPermissions(
  values: string[],
  request?: PermissionRequest
): Promise<boolean> {
  const origins = [...new Set(values.map(endpointOriginPattern))];
  if (origins.length === 0) {
    return true;
  }
  if (request) {
    return request({ origins });
  }
  if (typeof chrome.permissions?.request === "function") {
    return chrome.permissions.request({ origins });
  }
  const response: { granted?: boolean } = await chrome.runtime.sendMessage({
    type: "permissions/request-endpoints",
    payload: { origins }
  });
  return response.granted === true;
}

export async function setHoverPermission(enabled: boolean): Promise<boolean> {
  if (
    typeof chrome.permissions?.request !== "function"
    || typeof chrome.scripting?.getRegisteredContentScripts !== "function"
  ) {
    const response: { granted?: boolean } = await chrome.runtime.sendMessage({
      type: "permissions/set-hover",
      payload: { enabled }
    });
    return response.granted === true;
  }
  if (enabled) {
    const granted = await chrome.permissions.request({ origins: HOVER_ORIGINS });
    if (!granted) {
      return false;
    }
    const registrations = await chrome.scripting.getRegisteredContentScripts({
      ids: [HOVER_SCRIPT_ID]
    });
    if (registrations.length === 0) {
      await chrome.scripting.registerContentScripts([{
        id: HOVER_SCRIPT_ID,
        js: ["content-scripts/hover.js"],
        matches: HOVER_ORIGINS,
        runAt: "document_idle"
      }]);
    }
    return true;
  }

  await chrome.scripting.unregisterContentScripts({ ids: [HOVER_SCRIPT_ID] })
    .catch(() => undefined);
  await chrome.permissions.remove({ origins: HOVER_ORIGINS });
  return false;
}
