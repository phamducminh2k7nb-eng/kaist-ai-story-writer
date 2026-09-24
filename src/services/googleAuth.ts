/**
 * KAIST Shared Google Identity Services (GSI) Singleton Service
 *
 * Designed to comply strictly with Google Identity Services Guidelines:
 * https://developers.google.com/identity/gsi/web/reference/js-reference
 *
 * Core Guarantees:
 * 1. google.accounts.id.initialize() is called strictly ONCE per page session per Client ID.
 * 2. Survives React StrictMode double-mount, component unmount/remount, and tab/mode switches.
 * 3. Stable callback delegation: newest component callback receives credentials without re-initializing.
 * 4. Independent renderGoogleSignInButton: safely re-renders the Google button when containers mount,
 *    dark/light themes switch, or views change, without re-calling initialize().
 * 5. Handles both Credential Response (ID token) and OAuth2 Token Client (access token).
 */

export type GoogleCredentialCallback = (response: {
  credential?: string;
  select_by?: string;
  clientId?: string;
}) => void;

interface GsiState {
  isInitialized: boolean;
  initializedClientId: string | null;
  currentCallback: GoogleCredentialCallback | null;
  scriptPromise: Promise<boolean> | null;
}

const state: GsiState = {
  isInitialized: false,
  initializedClientId: null,
  currentCallback: null,
  scriptPromise: null,
};

// Stable delegate passed to Google Identity Services ONCE
function delegateCredentialCallback(response: any) {
  if (state.currentCallback) {
    try {
      state.currentCallback(response);
    } catch (err) {
      console.error("[KAIST Google Auth] Error in credential callback delegate:", err);
    }
  } else {
    console.warn("[KAIST Google Auth] Credential received but no active callback is registered.");
  }
}

/**
 * Checks or waits until window.google.accounts.id is loaded and available.
 */
export function waitForGoogleIdentityScript(timeoutMs = 10000): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(true);
  }

  if (state.scriptPromise) {
    return state.scriptPromise;
  }

  state.scriptPromise = new Promise<boolean>((resolve) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        console.warn("[KAIST Google Auth] Google Identity Services script wait timed out.");
        resolve(false);
      }
    }, 100);
  });

  return state.scriptPromise;
}

/**
 * Registers or updates the active credential callback without re-initializing GSI.
 */
export function setGoogleCredentialCallback(callback: GoogleCredentialCallback | null) {
  state.currentCallback = callback;
}

/**
 * Initializes Google Identity Services ONCE per page session for a given clientId.
 * If already initialized with this clientId, it updates the callback delegate and returns true immediately.
 */
export async function ensureGoogleIdentityInitialized(
  clientId: string,
  callback: GoogleCredentialCallback
): Promise<boolean> {
  if (!clientId || typeof window === "undefined") {
    return false;
  }

  // Always update the active callback so newly mounted component instances receive the event
  state.currentCallback = callback;

  const scriptReady = await waitForGoogleIdentityScript();
  if (!scriptReady || !window.google?.accounts?.id) {
    return false;
  }

  // If already initialized with this exact Client ID, DO NOT call initialize() again
  if (state.isInitialized && state.initializedClientId === clientId) {
    return true;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: delegateCredentialCallback,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    state.isInitialized = true;
    state.initializedClientId = clientId;
    return true;
  } catch (err) {
    console.warn("[KAIST Google Auth] Error initializing Google Identity Services:", err);
    return false;
  }
}

/**
 * Renders the Google Sign-In button into a specified container element.
 * Safe to call whenever the container mounts or themes toggle, without re-calling initialize().
 */
export async function renderGoogleSignInButton(
  container: HTMLElement,
  options?: {
    theme?: "outline" | "filled_blue" | "filled_black";
    size?: "large" | "medium" | "small";
    type?: "standard" | "icon";
    shape?: "rectangular" | "pill" | "circle" | "square";
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    width?: number;
    logo_alignment?: "left" | "center";
  }
): Promise<boolean> {
  if (!container || typeof window === "undefined") {
    return false;
  }

  const scriptReady = await waitForGoogleIdentityScript();
  if (!scriptReady || !window.google?.accounts?.id) {
    return false;
  }

  try {
    container.innerHTML = "";
    window.google.accounts.id.renderButton(container, {
      theme: options?.theme || "outline",
      size: options?.size || "large",
      type: options?.type || "standard",
      shape: options?.shape || "pill",
      text: options?.text || "continue_with",
      logo_alignment: options?.logo_alignment || "left",
      width: options?.width || 320,
    });
    return true;
  } catch (err) {
    console.warn("[KAIST Google Auth] Error rendering Google button:", err);
    return false;
  }
}

/**
 * Disables Google Identity Services One Tap auto-selection on logout.
 */
export function disableGoogleAutoSelect() {
  if (typeof window !== "undefined" && window.google?.accounts?.id?.disableAutoSelect) {
    try {
      window.google.accounts.id.disableAutoSelect();
    } catch (err) {
      console.warn("[KAIST Google Auth] Error disabling auto select:", err);
    }
  }
}

/**
 * Initiates Google OAuth2 Token Client for popup-based authentication.
 */
export async function requestGoogleAccessToken(
  clientId: string,
  onSuccess: (accessToken: string) => void,
  onError: (error: string) => void
): Promise<void> {
  const scriptReady = await waitForGoogleIdentityScript();
  if (!scriptReady || !window.google?.accounts?.oauth2) {
    onError("Đang tải thư viện Google, vui lòng thử lại sau giây lát.");
    return;
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: (tokenResponse: any) => {
        if (tokenResponse.error) {
          const errDetail = tokenResponse.error_description || tokenResponse.error;
          onError(errDetail);
        } else if (tokenResponse.access_token) {
          onSuccess(tokenResponse.access_token);
        } else {
          onError("Không nhận được token truy cập từ Google.");
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  } catch (err: any) {
    onError(err?.message || "Không thể khởi tạo hộp thoại đăng nhập Google.");
  }
}
