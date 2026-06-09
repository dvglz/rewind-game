export interface AuthUser {
  id: number;
  objectId: string;
  username: string | null;
  email: string | null;
  firstName: string;
  lastName: string;
  accessToken: string;
  avatarUrl: string | null;
  thumbnailUrl: string | null;
}

// Google Identity Services global types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_button?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              width?: number;
              text?: 'signin_with' | 'signup_with' | 'continue_with';
            },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}
