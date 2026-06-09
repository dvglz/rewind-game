import { useEffect, useRef, useCallback, useState } from 'react';

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '182717589161-edketn4i47i5dl5oms8oke6o9bodg7ep.apps.googleusercontent.com';

interface UseGoogleSignInOptions {
  onCredential: (credential: string) => void;
}

export function useGoogleSignIn({ onCredential }: UseGoogleSignInOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Stable ref for callback so GSI doesn't re-init on every render
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  const loadScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
      document.head.appendChild(script);
    });
  }, []);

  useEffect(() => {
    if (!CLIENT_ID) return;

    let cancelled = false;

    loadScript().then(() => {
      if (cancelled || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response: { credential: string }) => {
          callbackRef.current(response.credential);
        },
        use_fedcm_for_button: true,
        use_fedcm_for_prompt: true,
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 280,
        text: 'signin_with',
      });

      if (!cancelled) setReady(true);
    });

    return () => { cancelled = true; };
  }, [loadScript]);

  return { containerRef, ready };
}
