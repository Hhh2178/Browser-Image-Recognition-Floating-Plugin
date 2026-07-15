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
  request: PermissionRequest = chrome.permissions.request
): Promise<boolean> {
  return request({ origins: [endpointOriginPattern(value)] });
}

export async function setHoverPermission(enabled: boolean): Promise<boolean> {
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
