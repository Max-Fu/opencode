# Network egress audit harness

Tools for checking that a session talks to the configured model provider and
nothing else. Findings live in `NETWORK.md` at the repo root; this directory is
how to reproduce them.

Nothing here is imported by the product — these are standalone scripts.

## `fakellm.py` — stub model provider

An OpenAI-compatible server that needs no credentials, logs every request it
receives (method, path, headers, full body) as JSONL, and drives a complete
agent loop:

| Request | Response |
| --- | --- |
| has tools, no tool results yet | streams a tool call |
| carries a tool result | streams the final text |
| no tools (title generation) | streams text |

```sh
FAKE_LLM_PORT=8130 \
FAKE_LLM_LOG=/tmp/fakellm.jsonl \
FAKE_LLM_TOOL=read \
FAKE_LLM_TOOL_ARGS='{"filePath":"/tmp/proj/README.md"}' \
python3 script/audit/fakellm.py
```

Set `FAKE_LLM_TOOL=none` for a text-only reply.

Point the CLI at it with a config file:

```json
{
  "provider": {
    "fake": {
      "npm": "@ai-sdk/openai-compatible",
      "options": { "baseURL": "http://127.0.0.1:8130/v1", "apiKey": "test-key" },
      "models": { "fake-model": { "name": "Fake Model" } }
    }
  },
  "model": "fake/fake-model"
}
```

```sh
ALPHACODE_CONFIG=/tmp/fake.json alphacode run --model fake/fake-model "read README.md"
```

Then read `/tmp/fakellm.jsonl` to see exactly what left the machine — including
every header, the system prompt, and the tool schemas offered to the model.

**Streaming note:** the server terminates the SSE body by closing the
connection. Without that the client has neither `content-length` nor chunked
framing and waits forever. An earlier version of this stub omitted it, which
looked like a CLI hang and was not.

## `logproxy.py` — chaining logging proxy

Logs every `CONNECT` target, then forwards to the real proxy. Catches anything
that honours `HTTPS_PROXY`, including `git` subprocesses.

```sh
LOGPROXY_UPSTREAM="$HTTPS_PROXY" LOGPROXY_LOG=/tmp/proxy.log LOGPROXY_PORT=8902 \
  python3 script/audit/logproxy.py &
HTTPS_PROXY=http://127.0.0.1:8902 alphacode run "..."
```

## `netspy.ts` — in-process request tracer

Bun preload that wraps `globalThis.fetch` and `node:net`/`tls`/`http`/`https`,
logging each call with a stack trace. Shows *which code* made a request.

```sh
bun --preload script/audit/netspy.ts --conditions=browser packages/alphacode/src/index.ts models
```

Only works when running from source; a compiled binary cannot preload.

## `genwordmark.py` — regenerate the wordmark

The wordmark is a 4x7 pixel font on a 6px grid: 6px cells, glyphs 4 cells wide
at a 30px pitch, so `viewBox` width is `(n-1)*30 + 24`. Three layers — a shadow
across the whole word, then the ink split so the first word renders dimmer than
the second.

`GLYPH` holds one bitmap per letter (`X` ink, `+` shadow, `.` empty). o/p/e/c/d/n
were decoded from the original opencode wordmark; a/l/h were added to match the
terminal font in `packages/tui/src/logo.ts`.

```sh
python3 script/audit/genwordmark.py      # -> {"width":264,"weak":...,"left":...,"right":...}
```

Emit one path per layer, each a union of horizontally merged cell runs so
adjacent cells cannot seam. Thirteen places carry the wordmark — two source files
plus eleven standalone SVGs — and two of those SVGs also have a `clipPath` rect
whose width must be widened, or the last glyph is cropped.

To verify a change, decode the result back to ASCII and read it; do not trust
generated brand art you have not looked at.

## Socket-level ground truth

`netspy.ts` misses native fetchers and child processes, so pair it with strace:

```sh
strace -f -qq -e trace=connect -s 120 -o /tmp/t.strace alphacode run "..."
grep -aE 'connect\(.*AF_INET' /tmp/t.strace \
  | grep -oaE 'sin_port=htons\([0-9]+\), sin_addr=inet_addr\("[0-9.]+"\)' | sort | uniq -c
```

## Always run a positive control

A clean result only means something if the harness can see traffic at all. Prove
it by enabling one opt-in path and checking the request appears:

```sh
ALPHACODE_ENABLE_MODELS_FETCH=1 alphacode models   # expect models.dev
```

An earlier run of this audit reported a false negative because the command had
exited on a flag-ordering error before doing any work. The empty result looked
identical to success.

## Run in a clean project directory

Project config can legitimately cause network activity — a `references` entry
clones a git repository at session start, which is what
`.alphacode/alphacode.jsonc` in this repo does. Audit from an empty directory
unless you are deliberately testing that.
