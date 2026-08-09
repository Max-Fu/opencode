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
| Web search tool sending the model's queries to third-party search backends | `mcp.exa.ai`, `search.parallel.ai` | Opt-in only now. See "Web search" below — this was the largest content leak. |
| GitHub comment social card embedding the base64 session title in an image URL | `social-cards.sst.dev` | Removed from the GitHub Action, the `github` CLI handler, and the enterprise share page's `og:image`/`twitter:image`. |
| System prompts instructing the model to WebFetch the vendor docs site whenever asked about the tool | `opencode.ai/docs` | Instruction removed from the anthropic, default and meta prompts. |
| Background npm install of the plugin SDK on every start, carrying the exact running version | `registry.npmjs.org` | Opt-in via `ALPHACODE_ENABLE_PLUGIN_DEP_INSTALL`. The call is skipped entirely, not just given an empty package list, because arborist still rebuilds the tree from disk otherwise. |
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

## Web search

This deserves its own note, because it was the one path that shipped **user
content** off-box by default rather than just metadata.

The `websearch` tool does not run at the model provider. It calls Exa or
Parallel directly, so the query text — which in an agentic session routinely
contains code identifiers, error strings, dependency names and task
descriptions — went to a third party. Parallel additionally received the
session ID and the model name.

Upstream gated it inconsistently:

- The v1 path enabled the tool whenever the vendor gateway was the selected
  provider, even though the queries went to Exa/Parallel rather than to the
  gateway.
- The v2 path in `packages/core` registered the tool unconditionally and picked
  the backend with `hash(sessionID) % 2` — a silent A/B split between two
  companies, with no opt-in anywhere and no API key, so queries rode on the
  vendor's shared quota.

Now, in both paths, the tool is only registered and only offered to the model
when the user explicitly opts in via `ALPHACODE_ENABLE_EXA`,
`ALPHACODE_ENABLE_PARALLEL`, or `ALPHACODE_WEBSEARCH_PROVIDER`. No backend is
ever chosen on the user's behalf.

## Checked and found clean

- **MCP.** No bundled or default remote MCP servers; every server is
  user-configured.
- **Workspace / control-plane sync.** `/sync/history`, `/vcs/apply`,
  `/sync/replay` and `/sync/steal` only reach a URL if a plugin registers a
  remote workspace adapter. The one built-in adapter (`worktree`) resolves to a
  local directory, and the whole feature sits behind
  `ALPHACODE_EXPERIMENTAL_WORKSPACES`.
- **Skill discovery.** Downloads skills from an index URL, but only from URLs
  the user puts in `skills.urls`. No default source.
- **`@alphacode-ai/http-recorder`.** Records HTTP traffic to cassettes, but it
  is a devDependency and is never imported from `src`.
- **Electron.** `crashReporter.start({ uploadToServer: false })`; `netLog`
  writes to a local file only.
- **OAuth callback pages.** Post to `window.location.origin`, i.e. the
  loopback listener, not to a vendor.
- **Provider auth plugins** (Azure, Cloudflare, DigitalOcean, Snowflake, xAI,
  Copilot, Codex, Modal, GitLab, Poe). Each only contacts its own provider, and
  only during an explicit login.

## Verified by running it

The static audit above was checked against the running CLI. Method: a `--preload`
shim wrapping `globalThis.fetch` and `node:net`/`tls`/`http`/`https` to log every
request with a stack trace, plus `strace -f -e trace=connect` to catch anything
that skips those (native fetchers, child processes), with `HOME` pointed at a
throwaway directory so no cached catalog or credential could mask a request.

| Run | App-level HTTP | External sockets |
| --- | --- | --- |
| `alphacode models`, defaults (from source) | none | none |
| `alphacode run "say hi"`, defaults (from source) | none | none |
| `alphacode models`, defaults (**compiled binary**) | n/a | none |
| `alphacode models` with `ALPHACODE_ENABLE_MODELS_FETCH=1` | `https://models.dev/api.json` | as expected |

The compiled binary was produced with
`bun packages/alphacode/script/build.ts --single --skip-embed-web-ui --skip-install`
and listed 147 models from the catalog snapshot embedded at build time while
opening zero sockets, which is the point of embedding it.

The third row is the control: it proves the instrumentation actually observes
requests, so the empty first two rows mean silence rather than a blind spot.
An earlier version of this test reported a false negative because the command
had exited with a usage error before doing any work — always confirm the
positive control fires before trusting a clean run.

Two findings came out of running it rather than reading it: the per-start npm
request for the plugin SDK, and three third-party npm packages the rename had
broken.

## Inbound

Egress is only half of it, so the compiled binary's listener was probed too.

Defaults are safe: `hostname` is `127.0.0.1`, `mdns` is off, and the process
opens no UDP socket (mDNS would be 5353). `GET /` returns
`404 {"error":"Web UI is not bundled in this build and remote UI proxying is
disabled"}` rather than proxying to a vendor host, confirming that change end to
end in a real build.

The gap was authentication. `ServerAuth.required()` is true only when
`ALPHACODE_SERVER_PASSWORD` happens to be set, so auth is opt-in rather than
required. Probing an unauthenticated loopback server returned `200` for
`/session`, `/config` and `/project/current`. That is fine on loopback, but
`--hostname 0.0.0.0` — or `--mdns`, which flips the hostname to `0.0.0.0` *and*
advertises the service on the LAN — turned it into an unauthenticated endpoint
exposing sessions, file read/write and PTY. Upstream only printed a warning.

`assertNetworkBindIsAuthenticated()` in `packages/alphacode/src/server/server.ts`
now refuses a non-loopback bind unless a password is set, with
`ALPHACODE_ALLOW_INSECURE_BIND=1` as a deliberate escape hatch. Verified against
the built binary:

| Bind | Password | Result |
| --- | --- | --- |
| `127.0.0.1` | none | starts (unchanged) |
| `0.0.0.0` | none | refused with an explanatory error |
| `0.0.0.0` | set | starts; `401` unauthenticated, `200` authenticated |

Covered by `packages/alphacode/test/server/insecure-bind.test.ts` (5 tests).

## End-to-end test against a fake model server

Credentials are not needed to prove "it talks to the model and nothing else". A
stub OpenAI-compatible server (`scratchpad/fakellm.py`) logs every request it
receives - method, path, headers, full body - and returns a fixed reply. The
compiled binary was pointed at it with a config-file provider
(`@ai-sdk/openai-compatible`, `baseURL: http://127.0.0.1:<port>/v1`) and run with
`alphacode run "say hi"` under `strace -f -e trace=connect`.

Every header the CLI sends to the model endpoint:

```
accept, accept-encoding, connection, content-type, content-length, host
authorization: Bearer <your api key>
user-agent: http-client ai-sdk/provider-utils/4.0.23 runtime/bun/1.3.14
```

Absent: `x-session-id`, `x-session-affinity`, `x-parent-session-id`,
`http-referer`, `x-title`, `x-source`, and the `x-alphacode-*` set.

Tools offered to the model: `bash`, `edit`, `glob`, `grep`, `read`, `skill`,
`task`, `todowrite`, `webfetch`, `write`. Note `websearch` is **not** there,
confirming the gating above from the model's own point of view.

The request body carries `messages` (a ~19KB system prompt plus your message),
`tools`, `model`, `max_tokens`, `stream`. The system prompt includes the working
directory, platform, and the names/paths/descriptions of discovered skills -
context the agent needs, and it goes to the model only.

### Two things this test found

**Session-correlation headers.** Every non-vendor provider was receiving
`X-Session-Id`, `x-session-affinity` and `x-parent-session-id`, letting any
provider group all requests in a session and link subagent trees. Some gateways
use the affinity hint to route to a warm prompt cache, so it is now behind
`ALPHACODE_SEND_SESSION_HEADERS` (off) rather than deleted.

**Client User-Agent.** Requests advertised `alphacode/<exact version>`. A neutral
`http-client` is sent instead; `ALPHACODE_SEND_CLIENT_UA=1` restores the real one.

### Socket-level result

A full session opened exactly two kinds of TCP connection: the fake model
endpoint, and `github.com` via the proxy. The latter is a `git clone --depth 100`
of `https://github.com/Effect-TS/effect-smol`, triggered by the `references`
block in this repository's own `.alphacode/alphacode.jsonc`. It is a download
driven by project config, not a default of the tool and not an upload - the only
thing disclosed is that someone cloned a public repo. A project without a
`references` entry makes no such request. Worth knowing that the feature exists:
a config entry can cause an automatic clone at session start.

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

Three published npm packages keep the old name because they are third-party and
not ours to rename: `opencode-gitlab-auth`, `opencode-poe-auth` and
`@gitlab/opencode-gitlab-auth`. They are bundled default auth plugins.

## Verifying

There is no analytics or crash-reporting SDK left in the tree — no PostHog,
Sentry, Segment, Amplitude or similar. To re-audit after a rebase:

```sh
rg -ni 'opencode|opncd\.ai|posthog|sentry|segment|amplitude|mixpanel' packages/*/src
```

Everything that survives that grep should be the vendored `@opencode-ai/client`
specifier described above.
