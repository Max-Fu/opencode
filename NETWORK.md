# Network egress

AlphaCode is a rebranded fork of opencode, stripped of everything that phoned
home. A normal session talks to **your model provider and nothing else**. No
usage data, telemetry, crash reports, or attribution identifiers are sent to
this project's maintainers or to any third party.

Host names below are the **upstream opencode endpoints** that were removed. They
are listed as-is so the audit stays checkable against upstream history — the
fork does not operate replacements for any of them.

## Removed / disabled

| Behaviour | Host it contacted upstream | Status |
| --- | --- | --- |
| Model catalog polling at startup and every 60 min | `models.opencode.ai` | Off by default, and the vendor mirror is gone: the default source is now the upstream open catalog at `models.dev`. The catalog normally comes from the snapshot embedded at build time, the on-disk cache, or `ALPHACODE_MODELS_PATH`. Set `ALPHACODE_ENABLE_MODELS_FETCH=1` to opt into fetching. |
| Update check on TUI startup | npm registry, `api.github.com`, `formulae.brew.sh`, `community.chocolatey.org`, `raw.githubusercontent.com` | Off by default. Set `ALPHACODE_ENABLE_AUTOUPDATE=1`, or `"autoupdate": true` / `"notify"` in config, to opt in. `alphacode upgrade` still works on demand. |
| Web UI proxy fallback | `app.opencode.ai` | Removed. Only the UI bundled into the binary is served; otherwise the server returns 404. |
| Session sharing (uploads full transcript, tool output and file diffs) | `opncd.ai`, `console.opencode.ai` | Hard-disabled. `/share` fails with a clear error instead of uploading. |
| Sentry crash reporting + error-report button | `sentry.io` | Removed from the web app and the desktop app, along with the `@sentry/*` dependencies. |
| Desktop auto-update poll (every 10 min) | electron-updater release feed | Off unless `ALPHACODE_ENABLE_AUTOUPDATE=1`. |
| Attribution headers on inference requests (`HTTP-Referer: https://opencode.ai/`, `X-Title: opencode`, `X-Source: opencode`, `X-BILLING-INVOKE-ORIGIN: OpenCode`, `X-Cerebras-3rd-Party-Integration: opencode`) | openrouter, llmgateway, nvidia, vercel, zenmux, kilo, cerebras | Removed. These told the gateway which tool the traffic came from; they are not needed for inference. |

## Still present, and why

These only fire when you explicitly ask for them:

- **Provider requests.** Inference, model listing and OAuth/device-code login go
  to whichever provider you configured. That is the point of the tool.
- **`alphacode upgrade`.** Explicit command; contacts your install channel's
  release index.
- **`alphacode models --refresh` and `alphacode auth login`.** Explicitly refresh
  the model catalog from `models.dev` (or `ALPHACODE_MODELS_URL`). Set
  `ALPHACODE_DISABLE_MODELS_FETCH=1` to block even these.
- **`alphacode github ...`.** The GitHub Action integration still points at the
  upstream-shaped `api.alphacode.ai/get_github_app_installation` endpoint plus
  `api.github.com`. That host does not exist yet — see "Rebrand notes".
- **LSP server downloads.** Fetched from the language server's own release host
  the first time you use one. Disable with `ALPHACODE_DISABLE_LSP_DOWNLOAD=1`.
- **Provider SDK installs.** `@ai-sdk/*` packages are installed from your
  configured npm registry when a provider needs one.
- **Tree-sitter grammars.** The TUI downloads syntax-highlighting grammars and
  queries from `github.com` / `raw.githubusercontent.com` on first use
  (`packages/tui/src/parsers-config.ts`).
- **OpenTelemetry export.** Only active if *you* set
  `OTEL_EXPORTER_OTLP_ENDPOINT`, and only to the endpoint you name.
- **Remote config.** Only fetched for `.well-known/alphacode` URLs you added
  yourself via `auth login`.
- **`User-Agent: alphacode/<version>`** is still sent on GitLab Duo and
  Cloudflare provider requests, where the gateway expects a client identifier.
  Those go to your provider, not to this project.

## Rebrand notes

The `opencode` → `alphacode` rename rewrote brand strings wholesale, including
URLs. Hosts such as `alphacode.ai`, `api.alphacode.ai`, `console.alphacode.ai`
and the `anomalyco/alphacode` repository **do not exist**. Nothing on the default
path resolves them, because every code path that used to reach a vendor host is
disabled above. They need real values before publishing, distribution or the
GitHub Action can work.

One name is deliberately left un-renamed: `@opencode-ai/client` as consumed by
`packages/app` and `packages/session-ui`. Those pin a vendored tarball
(`packages/app/vendor/opencode-ai-client-1.17.13-v2.tgz`) whose internal package
name and `OpenCode*` exports cannot be changed without rebuilding an artifact
this repo does not own. The equivalent workspace package (`packages/client`,
consumed by `packages/sdk-next`) *is* renamed to `@alphacode-ai/client` with
`AlphaCode*` exports.

## Verifying

There is no analytics or crash-reporting SDK left in the tree — no PostHog,
Sentry, Segment, Amplitude or similar. To re-audit after a rebase:

```sh
rg -ni 'opencode|opncd\.ai|posthog|sentry|segment|amplitude|mixpanel' packages/*/src
```

Everything that survives that grep should be the vendored `@opencode-ai/client`
specifier described above.
