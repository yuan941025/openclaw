import { html } from "lit";
import { t } from "../../i18n/index.ts";
import type { AppViewState } from "../app-view-state.ts";
import { icons } from "../icons.ts";
import { normalizeBasePath } from "../navigation.ts";
import { agentLogoUrl } from "./agents-utils.ts";

type LoginErrorState = {
  title: string;
  body: string;
  tips: string[];
  raw: string;
};

function formatLoginError(rawError: string): LoginErrorState {
  const raw = rawError.trim();
  const normalized = raw.toLowerCase();

  if (normalized.includes("disconnected (1006)")) {
    return {
      title: "Connection closed before the gateway finished responding",
      body: "The Control UI reached the gateway address, but the connection ended before it could return a clear reason.",
      tips: [
        "Check that `openclaw gateway run` is still running.",
        "Confirm the WebSocket URL and port are correct.",
        "If auth is enabled, try the dashboard token again.",
      ],
      raw,
    };
  }

  if (normalized.includes("disconnected (1005)")) {
    return {
      title: "Connection closed without a response",
      body: "The gateway closed the socket before sending connection details back to the Control UI.",
      tips: [
        "Restart the gateway and reconnect.",
        "Verify the gateway URL points to the active host.",
      ],
      raw,
    };
  }

  if (normalized.includes("gateway token mismatch")) {
    return {
      title: "Gateway token did not match",
      body: "The gateway is reachable, but the token in Control UI does not match the token expected by the gateway.",
      tips: [
        "Copy the token from `openclaw dashboard --no-open` again.",
        "Paste it into the token field exactly as shown.",
      ],
      raw,
    };
  }

  if (normalized.includes("gateway token missing")) {
    return {
      title: "Gateway token is required",
      body: "This gateway expects a token before it will allow the Control UI to connect.",
      tips: [
        "Run `openclaw dashboard --no-open` to get the current tokenized URL.",
        "Or generate a token with `openclaw doctor --generate-gateway-token`.",
      ],
      raw,
    };
  }

  if (normalized.includes("gateway auth failed")) {
    return {
      title: "Authentication failed",
      body: "The gateway rejected the credentials provided by the Control UI.",
      tips: [
        "Check the token and password fields.",
        "If the gateway config changed recently, refresh the credentials and try again.",
      ],
      raw,
    };
  }

  if (normalized.includes("too many failed authentication attempts")) {
    return {
      title: "Too many failed sign-in attempts",
      body: "The gateway temporarily blocked new auth attempts after repeated failures.",
      tips: [
        "Wait a moment before retrying.",
        "Double-check the token or password before the next attempt.",
      ],
      raw,
    };
  }

  if (normalized.includes("device identity required")) {
    return {
      title: "This connection needs a trusted device identity",
      body: "The gateway only accepts this Control UI from HTTPS, localhost, or an explicitly allowed insecure context.",
      tips: [
        "Open the Control UI from the gateway host or localhost.",
        "Or allow insecure auth explicitly in the gateway config if that fits your setup.",
      ],
      raw,
    };
  }

  if (normalized.includes("origin not allowed")) {
    return {
      title: "This page is not allowed to connect to the gateway",
      body: "The gateway blocked the current browser origin before the session could start.",
      tips: [
        "Open Control UI from the gateway host.",
        "Or add this origin to `gateway.controlUi.allowedOrigins`.",
      ],
      raw,
    };
  }

  if (normalized.includes("pairing required")) {
    return {
      title: "Device pairing is required first",
      body: "The gateway is online, but this device must be approved before Control UI can connect.",
      tips: [
        "Run `openclaw devices list` to inspect pending requests.",
        "Approve the device with `openclaw devices approve <requestId>`.",
      ],
      raw,
    };
  }

  if (normalized.includes("gateway connect failed")) {
    return {
      title: "Could not reach the gateway",
      body: "The Control UI could not open a working connection to the gateway address you entered.",
      tips: [
        "Check whether the gateway process is running.",
        "Verify the URL, host, and port.",
      ],
      raw,
    };
  }

  return {
    title: "Connection failed",
    body: "The gateway did not accept the current connection attempt.",
    tips: ["Review the address and credentials, then try again."],
    raw,
  };
}

export function renderLoginGate(state: AppViewState) {
  const basePath = normalizeBasePath(state.basePath ?? "");
  const faviconSrc = agentLogoUrl(basePath);
  const errorState = state.lastError ? formatLoginError(state.lastError) : null;

  return html`
    <div class="login-gate">
      <div class="login-gate__card">
        <div class="login-gate__header">
          <img class="login-gate__logo" src=${faviconSrc} alt="OpenClaw" />
          <div class="login-gate__eyebrow">OPENCLAW CONTROL</div>
          <div class="login-gate__title">Connect this console to your gateway</div>
          <div class="login-gate__sub">
            Enter the gateway address and auth details to bring the Control UI online.
          </div>
        </div>
        <div class="login-gate__status-panel">
          <div class="login-gate__status-copy">
            <div class="login-gate__status-label">Current status</div>
            <div class="login-gate__status-value">Disconnected</div>
            <div class="login-gate__status-hint">
              Fill in the gateway address first, then add the token or password if your gateway requires them.
            </div>
          </div>
          <div class="login-gate__status-badge">Offline</div>
        </div>
        <div class="login-gate__quickstart">
          <div class="login-gate__quickstart-title">Quick connect</div>
          <ol class="login-gate__quickstart-list">
            <li>Start the gateway.</li>
            <li>Copy the dashboard URL or token from the gateway host.</li>
            <li>Paste the details here, then connect.</li>
          </ol>
        </div>
        <div class="login-gate__form">
          <label class="field">
            <span>${t("overview.access.wsUrl")}</span>
            <span class="login-gate__field-help">
              WebSocket address of the gateway, for example
              <code>ws://127.0.0.1:18789</code>.
            </span>
            <input
              .value=${state.settings.gatewayUrl}
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                state.applySettings({ ...state.settings, gatewayUrl: v });
              }}
              placeholder="ws://127.0.0.1:18789"
            />
          </label>
          <label class="field">
            <span>${t("overview.access.token")}</span>
            <span class="login-gate__field-help">
              Paste the gateway token from <code>openclaw dashboard --no-open</code> if token auth
              is enabled.
            </span>
            <div class="login-gate__secret-row">
              <input
                type=${state.loginShowGatewayToken ? "text" : "password"}
                autocomplete="off"
                spellcheck="false"
                .value=${state.settings.token}
                @input=${(e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  state.applySettings({ ...state.settings, token: v });
                }}
                placeholder="OPENCLAW_GATEWAY_TOKEN (${t("login.passwordPlaceholder")})"
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === "Enter") {
                    state.connect();
                  }
                }}
              />
              <button
                type="button"
                class="btn btn--icon ${state.loginShowGatewayToken ? "active" : ""}"
                title=${state.loginShowGatewayToken ? "Hide token" : "Show token"}
                aria-label="Toggle token visibility"
                aria-pressed=${state.loginShowGatewayToken}
                @click=${() => {
                  state.loginShowGatewayToken = !state.loginShowGatewayToken;
                }}
              >
                ${state.loginShowGatewayToken ? icons.eye : icons.eyeOff}
              </button>
            </div>
          </label>
          <label class="field">
            <span>${t("overview.access.password")}</span>
            <span class="login-gate__field-help">
              Use this only if your gateway also requires a shared or system password.
            </span>
            <div class="login-gate__secret-row">
              <input
                type=${state.loginShowGatewayPassword ? "text" : "password"}
                autocomplete="off"
                spellcheck="false"
                .value=${state.password}
                @input=${(e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  state.password = v;
                }}
                placeholder="${t("login.passwordPlaceholder")}"
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === "Enter") {
                    state.connect();
                  }
                }}
              />
              <button
                type="button"
                class="btn btn--icon ${state.loginShowGatewayPassword ? "active" : ""}"
                title=${state.loginShowGatewayPassword ? "Hide password" : "Show password"}
                aria-label="Toggle password visibility"
                aria-pressed=${state.loginShowGatewayPassword}
                @click=${() => {
                  state.loginShowGatewayPassword = !state.loginShowGatewayPassword;
                }}
              >
                ${state.loginShowGatewayPassword ? icons.eye : icons.eyeOff}
              </button>
            </div>
          </label>
          <button
            class="btn primary login-gate__connect"
            @click=${() => state.connect()}
          >
            Connect to gateway
          </button>
          <div class="login-gate__connect-note">
            Nothing here changes the gateway itself. This only connects the Control UI.
          </div>
        </div>
        ${
          errorState
            ? html`<div class="login-gate__error callout danger">
                <div class="login-gate__error-title">${errorState.title}</div>
                <div class="login-gate__error-body">${errorState.body}</div>
                <ul class="login-gate__error-tips">
                  ${errorState.tips.map((tip) => html`<li>${tip}</li>`)}
                </ul>
                <div class="login-gate__error-raw">Raw gateway message: ${errorState.raw}</div>
              </div>`
            : ""
        }
        <div class="login-gate__help">
          <div class="login-gate__help-title">Connection checklist</div>
          <ol class="login-gate__steps">
            <li>Start the gateway host.<code>openclaw gateway run</code></li>
            <li>Print the dashboard URL or token.<code>openclaw dashboard --no-open</code></li>
            <li>Paste the WebSocket URL here, then add token or password if needed.</li>
          </ol>
          <div class="login-gate__docs">
            <a
              class="session-link"
              href="https://docs.openclaw.ai/web/dashboard"
              target="_blank"
              rel="noreferrer"
            >${t("overview.connection.docsLink")}</a>
          </div>
        </div>
      </div>
    </div>
  `;
}
