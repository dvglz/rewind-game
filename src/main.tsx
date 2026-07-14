import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { computeSpecialRedirect } from './data/specials';
import { getTodayString } from './lib/date';

const specialParam = new URLSearchParams(window.location.search).get('special');
const path = specialParam ? `/${specialParam}` : window.location.pathname;
const specialRedirect = computeSpecialRedirect(path, getTodayString());
if (specialRedirect !== null) {
  const params = new URLSearchParams(window.location.search);
  params.delete('special');
  const [target, redirectQuery] = specialRedirect.split('?');
  if (redirectQuery) new URLSearchParams(redirectQuery).forEach((v, k) => params.set(k, v));
  const qs = params.toString();
  window.history.replaceState({}, '', qs ? `${target}?${qs}` : target);
}

createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

