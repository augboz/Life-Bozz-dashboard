/**
 * Opening external links in the browser the user actually wants.
 *
 * The OS default browser is Edge on a lot of Windows machines whether or not
 * the person ever chose it, so "open in the default browser" quietly means
 * "open in Edge" for them. Settings → "Open links in" lets them pick Chrome,
 * Edge or Firefox explicitly; this helper honours that choice everywhere a
 * link is opened, and falls back to the OS default if the chosen browser
 * isn't installed on this machine (the preference syncs across devices, the
 * browsers don't).
 */

import { isTauri } from './platform';
import { getItem } from './storage';

export type LinkBrowser = 'default' | 'chrome' | 'edge' | 'firefox';

export const LINK_BROWSERS: Array<{ id: LinkBrowser; label: string }> = [
  { id: 'default', label: 'System default' },
  { id: 'chrome',  label: 'Google Chrome' },
  { id: 'edge',    label: 'Microsoft Edge' },
  { id: 'firefox', label: 'Firefox' },
];

/** The browser chosen in Settings, read from the same store Settings writes. */
export async function preferredBrowser(): Promise<LinkBrowser> {
  try {
    const r = await getItem('appearance');
    const pref = r?.value ? (JSON.parse(r.value) as { linkBrowser?: LinkBrowser }).linkBrowser : undefined;
    return pref && LINK_BROWSERS.some(b => b.id === pref) ? pref : 'default';
  } catch {
    return 'default';
  }
}

/** Open a URL in the user's preferred browser (desktop) or a new tab (web). */
export async function openLink(url: string): Promise<void> {
  if (!isTauri()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const browser = await preferredBrowser();
  if (browser !== 'default') {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_in_browser', { url, browser });
      return;
    } catch (e) {
      // Not installed here, or launch failed: the OS default is better than
      // a dead click, and the console says why the preference was skipped.
      console.warn(`[links] ${browser} unavailable, using the system default:`, e);
    }
  }
  const { openUrl } = await import('@tauri-apps/plugin-opener');
  await openUrl(url);
}
