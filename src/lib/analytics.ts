type Params = Record<string, unknown>;

const measurementId = (): string | undefined =>
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || undefined;

const enabled = (): boolean => Boolean(measurementId());

const currentPageLocation = (): string | undefined =>
  typeof window === 'undefined' ? undefined : window.location.href;

const debugParams = (): Params => {
  if (typeof window === 'undefined') return {};
  return new URLSearchParams(window.location.search).get('gaDebug') === '1'
    ? { debug_mode: true }
    : {};
};

function ensureAnalytics(): string | undefined {
  const id = measurementId();
  if (!id || typeof window === 'undefined') return undefined;
  if (!window.__gaInit || typeof window.gtag !== 'function') {
    initAnalytics();
  }
  return typeof window.gtag === 'function' ? id : undefined;
}

/** Set up the gtag buffer + load the GA script. Safe to call once at startup. */
export function initAnalytics(): void {
  if (!enabled() || typeof window === 'undefined' || window.__gaInit) return;
  const id = measurementId() as string;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js expects the arguments object pushed verbatim.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments as unknown as IArguments);
  };

  window.gtag('js', new Date());
  // We fire page_view manually on screen change, so disable the automatic one.
  window.gtag('config', id, { send_page_view: false });
  window.gtag('set', 'user_properties', {
    is_pwa: window.matchMedia?.('(display-mode: standalone)').matches ?? false,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(script);

  window.__gaInit = true;
}

export function track(name: string, params: Params = {}): void {
  const id = ensureAnalytics();
  if (!id) return;
  window.gtag('event', name, {
    ...params,
    page_location: currentPageLocation(),
    send_to: id,
    ...debugParams(),
  });
}

/** Manual page_view for the SPA. `screen` is the App's screen-state string. */
export function trackPageView(screen: string): void {
  const id = ensureAnalytics();
  if (!id) return;
  window.gtag('event', 'page_view', {
    page_path: screen === 'home' ? '/' : `/${screen}`,
    page_title: screen,
    page_location: currentPageLocation(),
    send_to: id,
    ...debugParams(),
  });
}

export function setUser(props: {
  user_id?: number | string;
  is_authenticated?: boolean;
  auth_method?: 'google' | 'email';
}): void {
  if (!ensureAnalytics()) return;
  const { user_id, ...userProps } = props;
  if (user_id != null) window.gtag('set', { user_id: String(user_id) });
  if (Object.keys(userProps).length > 0) {
    window.gtag('set', 'user_properties', userProps);
  }
}

export function clearUser(): void {
  if (!ensureAnalytics()) return;
  window.gtag('set', { user_id: null });
  window.gtag('set', 'user_properties', { is_authenticated: false, auth_method: null });
}
