<p align="center">
  <picture>
    <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
    <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
    <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="AlphaCode logo">
  </picture>
</p>
<p align="center">An AI coding agent for the terminal that talks to your model provider and nothing else.</p>
<p align="center">
  <a href="NETWORK.md">Network audit</a> ·
  <a href="#installation">Installation</a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

![AlphaCode Terminal UI](packages/web/src/assets/lander/screenshot.png)

---

### Installation

There is no published package, install script, Homebrew tap, or release binary
for this fork — **build it from source**. Any `npm i -g`, `curl | bash`, or
`brew install` line you find in an older copy of these docs refers to upstream
opencode, not to this project.

#### Prerequisites

- [Bun](https://bun.sh) **1.3.14 or newer** — the build script enforces this
- `git`

#### Clone and install

```bash
git clone https://github.com/Max-Fu/opencode.git alphacode
cd alphacode
bun install
```

#### Build a binary (recommended)

This is the path to use if you actually want to *use* the CLI, because the build
embeds a model catalog snapshot — without it the model list is empty (see the
note under "Run from source").

```bash
bun packages/alphacode/script/build.ts --single --skip-embed-web-ui --skip-install
./packages/alphacode/dist/alphacode-<platform>/bin/alphacode --version
```

- `--single` builds only for the current platform; omit it to cross-build every target.
- `--skip-embed-web-ui` skips bundling the browser UI, which needs the `packages/app`
  build to succeed. Without the UI embedded the server answers `GET /` with `404`;
  it will not fall back to a hosted UI.
- `--skip-install` skips downloading Bun binaries for other targets.
- Invoke the script **directly**, not via `bun run --cwd packages/alphacode build`:
  `bun run` re-executes the `bun` on your `PATH`, so an older copy there fails the
  1.3.14 version check even if you launched a newer one.

Put the resulting binary on your `PATH` and call it `alphacode`.

#### Run from source

For development. `bun run dev` is the CLI and passes arguments through:

```bash
bun run dev --version                        # -> "local"
bun run dev                                  # interactive TUI
bun run dev run "explain this repo"          # one-shot, non-interactive
bun run dev models                           # list available models
```

> [!IMPORTANT]
> The model catalog is embedded **at build time**, so a source run starts with an
> empty catalog and `models` prints nothing. Give it a catalog one of two ways:
>
> ```bash
> # a) point at a catalog file (works offline)
> curl -o /tmp/models.json https://models.dev/api.json
> ALPHACODE_MODELS_PATH=/tmp/models.json bun run dev models
>
> # b) let it fetch once and cache
> ALPHACODE_ENABLE_MODELS_FETCH=1 bun run dev models
> ```

#### Point it at a model

Credentials come from the environment or from `alphacode auth login`. Any
provider works; the quickest is an environment variable:

```bash
export OPENAI_API_KEY=sk-...
bun run dev run "say hi"                       # picks a default model
bun run dev run --model openai/gpt-4o-mini "say hi"
```

To use a local or self-hosted endpoint, declare a provider in
`~/.config/alphacode/alphacode.json`:

```json
{
  "provider": {
    "local": {
      "npm": "@ai-sdk/openai-compatible",
      "options": { "baseURL": "http://127.0.0.1:8080/v1", "apiKey": "unused" },
      "models": { "my-model": { "name": "My Model" } }
    }
  },
  "model": "local/my-model"
}
```

#### Privacy defaults

This fork removes the vendor telemetry, sharing, crash reporting and attribution
headers that upstream shipped — see [NETWORK.md](NETWORK.md) for the full audit
and how to reproduce it. A few things upstream did automatically are opt-in here:

| Variable | Effect |
| --- | --- |
| `ALPHACODE_ENABLE_MODELS_FETCH=1` | Fetch the model catalog from `models.dev` instead of using the embedded snapshot |
| `ALPHACODE_ENABLE_AUTOUPDATE=1` | Allow update checks against your install channel |
| `ALPHACODE_ENABLE_PLUGIN_DEP_INSTALL=1` | Install the plugin SDK into project plugin directories so editors resolve types |
| `ALPHACODE_ENABLE_EXA=1` / `ALPHACODE_ENABLE_PARALLEL=1` | Enable the `websearch` tool, which sends queries to Exa or Parallel |
| `ALPHACODE_SEND_SESSION_HEADERS=1` | Send session-correlation headers to your provider (some gateways use them for prompt-cache routing) |
| `ALPHACODE_SEND_CLIENT_UA=1` | Advertise the real client name and version in `User-Agent` |

Serving the API off `127.0.0.1` requires authentication, because the API exposes
sessions, file read/write and terminals:

```bash
ALPHACODE_SERVER_PASSWORD=... bun run dev serve --hostname 0.0.0.0
```

Without a password that bind is refused; `ALPHACODE_ALLOW_INSECURE_BIND=1`
overrides it on a trusted network.

#### Desktop app

The desktop app is not built or distributed by this fork. `packages/desktop`
still contains the Electron source if you want to build it yourself.

### Agents

AlphaCode includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

Agents are configured in `alphacode.json`; see the in-repo docs under
`packages/web/src/content/docs/`.

### Documentation

There is no docs site for this fork. The upstream documentation sources live in
this repository under `packages/web/src/content/docs/` and are the most complete
reference for configuration; note that any install, account, sharing or
telemetry instructions in them describe upstream opencode, not this fork — see
[NETWORK.md](NETWORK.md) for what changed.

### Contributing

If you're interested in contributing to AlphaCode, please read our [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

### Known gaps

- Two brand-asset zips and one base64 image fixture still contain the old name
  inside their bytes.
- `packages/desktop`, `packages/console`, `packages/stats` and `packages/web`
  are upstream's product surfaces. They are renamed but unmaintained here, and
  their configs still reference hosts that do not exist.

### Provenance

AlphaCode is a rename of [opencode](https://github.com/anomalyco/opencode) with
its vendor telemetry, session sharing, crash reporting and attribution headers
removed. [NETWORK.md](NETWORK.md) records exactly what was taken out, what
remains, and how the result was verified against a live provider.
