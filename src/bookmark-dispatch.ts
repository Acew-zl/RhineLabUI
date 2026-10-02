import { bookmarkTarget } from './bookmark-data.ts';
import { browserHost, getBookmarkOpenMode, openBookmarkDestination, openBookmarkInBackground, type BookmarkOpenMode, type NavigationHost } from './bookmark-navigation.ts';

/** One confirmed dispatch at a time. Cancelling never closes a user's opened tab. */
export class BookmarkDispatch {
  private request?: { url: string; controller: AbortController };
  private host?: NavigationHost;
  constructor(host?: NavigationHost) { this.host = host; }
  get pending() { return Boolean(this.request); }
  cancel() { this.request?.controller.abort(); this.request = undefined; }
  async open(value: string, options: {
    present?: (signal: AbortSignal) => Promise<boolean>;
    canActivate?: () => boolean;
    mode?: BookmarkOpenMode;
  } = {}) {
    const url = bookmarkTarget(value);
    if (!url || this.request?.url === url) return;
    this.cancel();
    const host = this.host ?? browserHost(), mode = options.mode ?? getBookmarkOpenMode();
    if (!options.present || (mode === 'new-tab' && !host.tabs)) {
      await openBookmarkDestination(url, host, mode);
      return;
    }
    const request = { url, controller: new AbortController() };
    this.request = request;
    try {
      // Create the destination and play the presentation in parallel. The page
      // can load while the existing lift/camera/decryption animation runs.
      const opening = mode === 'new-tab' ? openBookmarkInBackground(url, host).then(tab => {
        if (!tab) request.controller.abort();
        return tab;
      }) : Promise.resolve(undefined);
      const [tab, finished] = await Promise.all([opening, options.present(request.controller.signal)]);
      if (request.controller.signal.aborted || !finished || options.canActivate?.() === false) return;
      if (mode === 'current-tab') await openBookmarkDestination(url, host, mode);
      else await tab?.activate();
    } finally { if (this.request === request) this.request = undefined; }
  }
}
