# Network egress

This fork is built so that a normal session talks to **your model provider and
nothing else**. No usage data, telemetry, crash reports, or attribution
identifiers are sent to opencode or any third party.

## Removed / disabled

| Behaviour | Host it contacted | Status |
| --- | --- | --- |
| Model catalog polling at startup and every 60 min | `models.opencode.ai` | Off by default. The catalog comes from the snapshot embedded at build time, the on-disk cache, or `OPENCODE_MODELS_PATH`. Set `OPENCODE_ENABLE_MODELS_FETCH=1` to opt in. |
| Update check on TUI startup | npm registry, `api.github.com`, `formulae.brew.sh`, `community.chocolatey.org`, `raw.githubusercontent.com` | Off by default. Set `OPENCODE_ENABLE_AUTOUPDATE=1` or `"autoupdate": true` / `"notify"` in config to opt in. `opencode upgrade` still works on demand. |
| Web UI proxy fallback | `app.opencode.ai` | Removed. Only the UI bundled into the binary is served; otherwise the server returns 404. |
| Session sharing (uploads full transcript, tool output and file diffs) | `opncd.ai`, `console.opencode.ai` | Hard-disabled. `/share` fails with a clear error instead of uploading. |
| Attribution headers on inference requests (`HTTP-Referer: https://opencode.ai/`, `X-Title: opencode`, `X-Source: opencode`, `X-BILLING-INVOKE-ORIGIN: OpenCode`, `X-Cerebras-3rd-Party-Integration: opencode`) | openrouter, llmgateway, nvidia, vercel, zenmux, kilo, cerebras | Removed. These told the gateway which tool the traffic came from; they are not needed for inference. |

## Still present, and why

These only fire when you explicitly ask for them:

- **Provider requests.** Inference, model listing and OAuth/device-code login go
  to whichever provider you configured. That is the point of the tool.
- **`opencode upgrade`.** Explicit command; contacts your install channel's
  release index.
- **`opencode models --refresh` and `opencode auth login`.** Explicitly refresh
  the model catalog from `models.opencode.ai` (or `OPENCODE_MODELS_URL`). Set
  `OPENCODE_DISABLE_MODELS_FETCH=1` to block even these.
- **`opencode github ...`.** The GitHub Action integration calls
  `api.opencode.ai/get_github_app_installation` and `api.github.com`.
- **LSP server downloads.** Fetched from the language server's own release host
  the first time you use one. Disable with `OPENCODE_DISABLE_LSP_DOWNLOAD=1`.
- **Provider SDK installs.** `@ai-sdk/*` packages are installed from your
  configured npm registry when a provider needs one.
- **Tree-sitter grammars.** The TUI downloads syntax-highlighting grammars and
  queries from `github.com` / `raw.githubusercontent.com` on first use
  (`packages/tui/src/parsers-config.ts`).
- **OpenTelemetry export.** Only active if *you* set
  `OTEL_EXPORTER_OTLP_ENDPOINT`, and only to the endpoint you name.
- **Remote config.** Only fetched for `.well-known/opencode` URLs you added
  yourself via `auth login`.
- **`User-Agent: opencode/<version>`** is still sent on GitLab Duo and
  Cloudflare provider requests, where the gateway expects a client identifier.
  Those go to your provider, not to opencode.

## Verifying

There is no analytics SDK in the tree — no PostHog, Sentry, Segment, Amplitude
or similar. To re-audit after a rebase:

```sh
rg -n 'opencode\.ai|opncd\.ai|posthog|sentry|segment|amplitude|mixpanel' \
  packages/core/src packages/opencode/src packages/cli/src packages/tui/src
```
