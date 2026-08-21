#!/usr/bin/env python3
"""Fake OpenAI-compatible LLM server for offline end-to-end testing.

Logs every request (method, path, headers, full body) to a JSONL file, and drives
a full agent loop without any credentials:

  request 1 (has tools, no tool results) -> streams a tool call
  request 2 (carries the tool result)    -> streams a final text reply
  requests with no tools (title gen etc) -> streams a text reply

Env:
  FAKE_LLM_PORT        listen port (default 8123)
  FAKE_LLM_LOG         JSONL request log (default /tmp/fakellm.jsonl)
  FAKE_LLM_REPLY       final assistant text
  FAKE_LLM_TOOL        tool to call, or "none" to disable the tool round trip
  FAKE_LLM_TOOL_ARGS   JSON arguments for that tool
  FAKE_LLM_FAIL_TIMES  fail the first N *agent* requests before answering (default 0);
                       requests carrying no tools (title generation) are never
                       failed, so the budget lands on the turn under test
  FAKE_LLM_FAIL_STATUS status to fail with (default 429)
  FAKE_LLM_RETRY_AFTER value for the retry-after header on those failures
"""
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("FAKE_LLM_PORT", "8123"))
LOG = os.environ.get("FAKE_LLM_LOG", "/tmp/fakellm.jsonl")
REPLY = os.environ.get("FAKE_LLM_REPLY", "Done. The file was read.")
TOOL = os.environ.get("FAKE_LLM_TOOL", "read")
TOOL_ARGS = os.environ.get("FAKE_LLM_TOOL_ARGS", json.dumps({"filePath": "/etc/hostname"}))
FAIL_TIMES = int(os.environ.get("FAKE_LLM_FAIL_TIMES", "0"))
FAIL_STATUS = int(os.environ.get("FAKE_LLM_FAIL_STATUS", "429"))
RETRY_AFTER = os.environ.get("FAKE_LLM_RETRY_AFTER", "")

# Fault injection is deliberately deterministic: a real provider's 429s cannot be
# summoned on demand, so retry/backoff is exercised here instead.
_failures_left = {"n": FAIL_TIMES}

open(LOG, "w").close()


def record(entry):
    with open(LOG, "a") as fh:
        fh.write(json.dumps(entry) + "\n")
        fh.flush()


def plan(body):
    """Decide what this request should get back."""
    if not isinstance(body, dict):
        return ("text", REPLY)
    messages = body.get("messages") or []
    tools = [t.get("function", {}).get("name") for t in (body.get("tools") or [])]
    # A tool result already came back, so finish with prose.
    if any(m.get("role") == "tool" for m in messages):
        return ("text", REPLY)
    # Title generation and similar helper calls ship no tools.
    if not tools or TOOL == "none" or TOOL not in tools:
        return ("text", REPLY)
    return ("tool", TOOL)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *_args):
        pass  # the JSONL log is the record

    def _read_body(self):
        length = int(self.headers.get("content-length") or 0)
        raw = self.rfile.read(length) if length else b""
        try:
            return json.loads(raw.decode("utf-8")) if raw else None
        except Exception:
            return raw.decode("utf-8", "replace")

    def _capture(self, body):
        record(
            {
                "time": time.time(),
                "method": self.command,
                "path": self.path,
                "headers": {k.lower(): v for k, v in self.headers.items()},
                "body": body,
            }
        )

    def _send_json(self, code, payload):
        data = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        self._capture(None)
        if self.path.rstrip("/").endswith("/models"):
            return self._send_json(
                200, {"object": "list", "data": [{"id": "fake-model", "object": "model", "owned_by": "fake"}]}
            )
        return self._send_json(404, {"error": "not found"})

    def do_POST(self):
        body = self._read_body()
        self._capture(body)

        carries_tools = bool(isinstance(body, dict) and (body.get("tools") or []))
        if _failures_left["n"] > 0 and carries_tools:
            _failures_left["n"] -= 1
            payload = json.dumps(
                {"error": {"message": "rate limited by the fake provider", "type": "rate_limit_error"}}
            ).encode()
            self.send_response(FAIL_STATUS)
            self.send_header("content-type", "application/json")
            if RETRY_AFTER:
                self.send_header("retry-after", RETRY_AFTER)
            self.send_header("content-length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        action = plan(body)
        stream = bool(isinstance(body, dict) and body.get("stream"))
        want_usage = bool(
            isinstance(body, dict) and (body.get("stream_options") or {}).get("include_usage")
        )
        if stream:
            return self._stream(action, want_usage)
        return self._blocking(action)

    # --- non-streaming -----------------------------------------------------
    def _blocking(self, action):
        created = int(time.time())
        if action[0] == "tool":
            message = {
                "role": "assistant",
                "content": None,
                "tool_calls": [
                    {
                        "id": "call_fake_1",
                        "type": "function",
                        "function": {"name": action[1], "arguments": TOOL_ARGS},
                    }
                ],
            }
            finish = "tool_calls"
        else:
            message = {"role": "assistant", "content": action[1]}
            finish = "stop"
        return self._send_json(
            200,
            {
                "id": "chatcmpl-fake",
                "object": "chat.completion",
                "created": created,
                "model": "fake-model",
                "choices": [{"index": 0, "message": message, "finish_reason": finish}],
                "usage": {"prompt_tokens": 11, "completion_tokens": 7, "total_tokens": 18},
            },
        )

    # --- streaming ---------------------------------------------------------
    def _stream(self, action, want_usage):
        created = int(time.time())
        # Terminate the body by closing the connection. Without this the client
        # has neither a content-length nor chunked framing and waits forever -
        # which is exactly why the earlier stub made `run` hang until timeout.
        self.send_response(200)
        self.send_header("content-type", "text/event-stream")
        self.send_header("cache-control", "no-cache")
        self.send_header("connection", "close")
        self.end_headers()
        self.close_connection = True

        def emit(payload):
            self.wfile.write(f"data: {json.dumps(payload)}\n\n".encode())
            self.wfile.flush()

        def chunk(delta, finish=None):
            emit(
                {
                    "id": "chatcmpl-fake",
                    "object": "chat.completion.chunk",
                    "created": created,
                    "model": "fake-model",
                    "choices": [{"index": 0, "delta": delta, "finish_reason": finish}],
                }
            )

        if action[0] == "tool":
            name = action[1]
            chunk(
                {
                    "role": "assistant",
                    "content": None,
                    "tool_calls": [
                        {
                            "index": 0,
                            "id": "call_fake_1",
                            "type": "function",
                            "function": {"name": name, "arguments": ""},
                        }
                    ],
                }
            )
            # Split the arguments across deltas the way a real provider does.
            mid = max(1, len(TOOL_ARGS) // 2)
            for part in (TOOL_ARGS[:mid], TOOL_ARGS[mid:]):
                chunk({"tool_calls": [{"index": 0, "function": {"arguments": part}}]})
            chunk({}, "tool_calls")
        else:
            text = action[1]
            chunk({"role": "assistant", "content": ""})
            for i in range(0, len(text), 16):
                chunk({"content": text[i : i + 16]})
            chunk({}, "stop")

        if want_usage:
            emit(
                {
                    "id": "chatcmpl-fake",
                    "object": "chat.completion.chunk",
                    "created": created,
                    "model": "fake-model",
                    "choices": [],
                    "usage": {"prompt_tokens": 11, "completion_tokens": 7, "total_tokens": 18},
                }
            )
        self.wfile.write(b"data: [DONE]\n\n")
        self.wfile.flush()


if __name__ == "__main__":
    srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(
        f"fake llm on http://127.0.0.1:{PORT}/v1  log={LOG}  tool={TOOL} "
        f"fail_times={FAIL_TIMES} fail_status={FAIL_STATUS} retry_after={RETRY_AFTER or '-'}",
        flush=True,
    )
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)
