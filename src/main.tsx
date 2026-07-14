import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { computeSpecialRedirect } from './data/specials';
import { getTodayString } from './lib/date';

const specialParam = new URLSearchParams(window.location.search).get('special');
const path = specialParam ? `/${specialParam}` : window.location.pathname;
const specialRedirect = computeSpecialRedirect(path, getTodayString());
if (specialRedirect !== null) {
  window.history.replaceState({}, '', specialRedirect);
}

createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

