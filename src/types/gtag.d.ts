export {};

declare global {
  interface Window {
    dataLayer: IArguments[];
    gtag: (...args: unknown[]) => void;
    __gaInit?: boolean;
  }
}
