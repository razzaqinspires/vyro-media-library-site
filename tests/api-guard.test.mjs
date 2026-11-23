import test from "node:test";
import assert from "node:assert/strict";
import { demoIdentity, guardDemo } from "../server/api-guard.js";

const demoA = "VYRO-DEMO-0123456789AB";
const demoB = "VYRO-DEMO-ABCDEF012345";

function makeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
    json(value) { this.body = value; return this; },
  };
}

test("demoIdentity accepts one well-formed demo ID", () => {
  assert.equal(demoIdentity({ headers: { "x-vyro-demo-id": demoA }, body: {}, query: {} }), demoA);
});

test("demoIdentity rejects mismatched identity sources", () => {
  assert.equal(demoIdentity({ headers: { "x-vyro-demo-id": demoA }, body: { demo_id: demoB }, query: {} }), null);
});

test("demoIdentity rejects missing and malformed IDs", () => {
  assert.equal(demoIdentity({ headers: {}, body: {}, query: {} }), null);
  assert.equal(demoIdentity({ headers: { "x-vyro-demo-id": "../../etc/passwd" }, body: {}, query: {} }), null);
});

test("guardDemo applies no-store and rate-limits by client IP + route, not caller-chosen demo ID", () => {
  const route = `/test-rate-${Date.now()}-${Math.random()}`;
  const reqA = { method: "POST", url: route, headers: { "x-real-ip": "192.0.2.44", "x-vyro-demo-id": demoA }, body: {} };
  const reqB = { method: "POST", url: route, headers: { "x-real-ip": "192.0.2.44", "x-vyro-demo-id": demoB }, body: {} };
  const first = makeResponse();
  assert.equal(guardDemo(reqA, first, { limit: 1, windowMs: 60_000 }), demoA);
  assert.equal(first.headers["cache-control"], "private, no-store, max-age=0");
  const second = makeResponse();
  assert.equal(guardDemo(reqB, second, { limit: 1, windowMs: 60_000 }), null);
  assert.equal(second.statusCode, 429);
});
