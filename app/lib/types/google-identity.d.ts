/**
 * TypeScript declarations for Google Identity Services (GIS)
 * @see https://developers.google.com/identity/gsi/web/reference/js-reference
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

interface GoogleAccountsId {
  /**
   * Initializes the Sign In With Google client.
   */
  initialize: (config: GoogleIdConfiguration) => void;

  /**
   * Displays the One Tap prompt or the browser native credential manager.
   */
  prompt: (momentListener?: (notification: PromptMomentNotification) => void) => void;

  /**
   * Renders a Sign In With Google button in the specified container.
   */
  renderButton: (
    parent: HTMLElement,
    options: GsiButtonConfiguration
  ) => void;

  /**
   * Disables automatic One Tap prompt on page load.
   */
  disableAutoSelect: () => void;

  /**
   * Cancels the One Tap prompt.
   */
  cancel: () => void;

  /**
   * Revokes the OAuth grant used to share the ID token.
   */
  revoke: (hint: string, callback?: (response: RevocationResponse) => void) => void;
}

interface GoogleIdConfiguration {
  /** Your Google API client ID */
  client_id: string;

  /** The callback function to handle the ID token response */
  callback?: (response: CredentialResponse) => void;

  /** Enables automatic sign-in */
  auto_select?: boolean;

  /** The URL of your login endpoint (for redirect mode) */
  login_uri?: string;

  /** A random string for ID token verification */
  nonce?: string;

  /** The DOM ID of the One Tap prompt container */
  prompt_parent_id?: string;

  /** Controls One Tap UX behavior */
  context?: "signin" | "signup" | "use";

  /** The title for the One Tap prompt */
  itp_support?: boolean;

  /** Use FedCM for the prompt (Chrome's cookie phase-out) */
  use_fedcm_for_prompt?: boolean;

  /** Cancel the One Tap flow if user clicks outside */
  cancel_on_tap_outside?: boolean;

  /** Native callback for credential response */
  native_callback?: (response: CredentialResponse) => void;

  /** State cookie domain for login_uri */
  state_cookie_domain?: string;

  /** Sets the UX flow (popup or redirect) */
  ux_mode?: "popup" | "redirect";

  /** List of hosted domains to restrict sign-in */
  hosted_domain?: string;

  /** Allowed parent origin for iframe embedding */
  allowed_parent_origin?: string | string[];

  /** Whether to use Intermediate iframes for sign-in */
  intermediate_iframe_close_callback?: () => void;

  /** ITW context for data sharing */
  itw_context?: boolean;
}

interface CredentialResponse {
  /** The ID token as a base64-encoded JWT string */
  credential: string;

  /** How the credential was selected */
  select_by?:
    | "auto"
    | "user"
    | "user_1tap"
    | "user_2tap"
    | "btn"
    | "btn_confirm"
    | "btn_add_session"
    | "btn_confirm_add_session"
    | "fedcm"
    | "fedcm_auto";

  /** The client ID that was used */
  client_id?: string;
}

interface PromptMomentNotification {
  /** Returns true if the prompt was displayed */
  isDisplayed: () => boolean;

  /** Returns true if the prompt was not displayed */
  isNotDisplayed: () => boolean;

  /** Returns true if the prompt was skipped */
  isSkippedMoment: () => boolean;

  /** Returns true if the prompt was dismissed */
  isDismissedMoment: () => boolean;

  /** Returns the reason the prompt was not displayed */
  getNotDisplayedReason: () =>
    | "browser_not_supported"
    | "invalid_client"
    | "missing_client_id"
    | "opt_out_or_no_session"
    | "secure_http_required"
    | "suppressed_by_user"
    | "unregistered_origin"
    | "unknown_reason";

  /** Returns the reason the prompt was skipped */
  getSkippedReason: () =>
    | "auto_cancel"
    | "user_cancel"
    | "tap_outside"
    | "issuing_failed";

  /** Returns the reason the prompt was dismissed */
  getDismissedReason: () =>
    | "credential_returned"
    | "cancel_called"
    | "flow_restarted";

  /** Returns the moment type */
  getMomentType: () => "display" | "skipped" | "dismissed";
}

interface GsiButtonConfiguration {
  /** The button type */
  type?: "standard" | "icon";

  /** The button theme */
  theme?: "outline" | "filled_blue" | "filled_black";

  /** The button size */
  size?: "large" | "medium" | "small";

  /** The button text */
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";

  /** The button shape */
  shape?: "rectangular" | "pill" | "circle" | "square";

  /** The Google logo alignment */
  logo_alignment?: "left" | "center";

  /** The button width in pixels */
  width?: number;

  /** The locale for button text */
  locale?: string;

  /** Click handler for the button */
  click_listener?: () => void;

  /** State for sign-in */
  state?: string;
}

interface RevocationResponse {
  /** Whether the revocation was successful */
  successful: boolean;

  /** Error message if revocation failed */
  error?: string;
}

export {};
