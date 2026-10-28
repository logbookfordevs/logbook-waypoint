import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import test from 'node:test';

import { Command } from 'commander';

import { createAgentClient, readJsonInput, registerAgentCommands } from '../lib/cli-agent.js';
import { LocalAnnotationsServer } from '../lib/server.js';

const id = 'waypoint_1750000000000_abc123xyz';

async function runCli(argv, { client, readInput } = {}) {
  const calls = [];
  const output = [];
  const errors = [];
  const program = new Command().exitOverride();
  registerAgentCommands(program, {
    client: client ?? { call: async (operation, args) => { calls.push({ operation, args }); return { status: 'success', data: {} }; } },
    writeOutput: text => output.push(text),
    writeError: text => errors.push(text),
    readInput,
  });
  const previousExitCode = process.exitCode;
  try {
    await program.parseAsync(argv, { from: 'user' });
    return { calls, output, errors, exitCode: process.exitCode };
  } finally {
    process.exitCode = previousExitCode;
  }
}

test('resolve builds a Design Action Resolution Record only from both --summary and --verify', async () => {
  const resolved = await runCli([
    'resolve', id, '--owner', 'claude-7f3a', '--summary', "Fixed the user's heading",
    '--verify', 'pnpm test', '--verify', 'Reviewed at 390px',
  ]);
  assert.deepEqual(resolved.calls, [{
    operation: 'resolve_annotation',
    args: {
      id,
      owner: 'claude-7f3a',
      resolution_record: { summary: "Fixed the user's heading", verification: ['pnpm test', 'Reviewed at 390px'] },
    },
  }]);

  const ordinary = await runCli(['resolve', id, '--owner', 'claude-7f3a']);
  assert.deepEqual(ordinary.calls[0].args, { id, owner: 'claude-7f3a' });

  const incomplete = await runCli(['resolve', id, '--owner', 'claude-7f3a', '--summary', 'No checks']);
  assert.deepEqual(incomplete.calls, []);
  assert.equal(incomplete.exitCode, 1);
  assert.match(incomplete.errors[0], /--summary and at least one --verify/);
});

test('release maps --reason and --note to a Work Notice', async () => {
  const { calls } = await runCli([
    'release', id, '--owner', 'claude-7f3a', '--reason', 'workflow_unavailable', '--note', 'Install Impeccable first.',
  ]);
  assert.deepEqual(calls[0], {
    operation: 'release_annotation',
    args: { id, owner: 'claude-7f3a', reason: { code: 'workflow_unavailable', summary: 'Install Impeccable first.' } },
  });
});

test('destructive commands require explicit confirmation', async () => {
  const refused = await runCli(['delete', id]);
  assert.deepEqual(refused.calls, []);
  assert.match(refused.errors[0], /--yes/);

  const preview = await runCli(['delete-project', 'http://localhost:3000/*']);
  assert.deepEqual(preview.calls[0].args, { url_pattern: 'http://localhost:3000/*', confirm: false });

  const confirmed = await runCli(['delete-project', 'http://localhost:3000/*', '--yes']);
  assert.equal(confirmed.calls[0].args.confirm, true);
});

test('read requires a URL or --id', async () => {
  const missing = await runCli(['read']);
  assert.deepEqual(missing.calls, []);
  assert.match(missing.errors[0], /URL or --id/);

  const { calls } = await runCli(['read', 'http://localhost:3000/*', '--status', 'all', '--limit', '10']);
  assert.deepEqual(calls[0], { operation: 'read_annotations', args: { url: 'http://localhost:3000/*', status: 'all', limit: 10 } });
});

test('variant JSON input accepts a bare array or a variants object from stdin or a file', async () => {
  const variants = [{ key: 'a', name: 'Calm', implementation: { css: ".a::after { content: \"it's $5\" }" } }];
  const stdin = await readJsonInput('-', { stdin: Readable.from([JSON.stringify({ variants })]) });
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-cli-input-'));
  try {
    const file = path.join(directory, 'variants.json');
    await writeFile(file, JSON.stringify(variants));
    const fromFile = await readJsonInput(file);

    for (const input of [stdin, fromFile]) {
      const { calls } = await runCli(['variants', 'request', id, '--input', '-'], { readInput: async () => input });
      assert.deepEqual(calls[0], { operation: 'request_variants', args: { id, variants } });
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }

  await assert.rejects(readJsonInput('-', { stdin: Readable.from(['{ not json']) }), /not valid JSON/);
  const wrongShape = await runCli(['variants', 'replace', id, '--input', '-'], { readInput: async () => ({ key: 'a' }) });
  assert.match(wrongShape.errors[0], /"variants" array/);
});

test('agent commands drive the local server and print its untrusted payload', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-cli-e2e-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  await writeFile(annotationsFile, JSON.stringify([{
    id, url: 'http://localhost:3000/app', comment: 'Tighten spacing', status: 'pending',
  }]));
  const server = new LocalAnnotationsServer({ annotationsFile, attachmentRoot: path.join(directory, 'attachments') });
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const client = createAgentClient({ serverUrl: `http://127.0.0.1:${listener.address().port}` });

  try {
    const read = await runCli(['read', 'http://localhost:3000/'], { client });
    const readPayload = JSON.parse(read.output[0]);
    assert.equal(readPayload.data_trust, 'untrusted');
    assert.deepEqual(readPayload.data.annotations.map(annotation => annotation.id), [id]);

    await runCli(['claim', id, '--owner', 'agent-one'], { client });
    const conflict = await runCli(['claim', id, '--owner', 'agent-two'], { client });
    assert.equal(conflict.exitCode, 1);
    assert.equal(JSON.parse(conflict.output[0]).status, 'error');
    assert.match(conflict.errors[0], /claimed by another owner/);

    const resolved = await runCli(['resolve', id, '--owner', 'agent-one'], { client });
    assert.equal(JSON.parse(resolved.output[0]).data.annotation.status, 'resolved');
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('an unreachable server explains how to start it', async () => {
  const client = createAgentClient({ serverUrl: 'http://127.0.0.1:9', fetchImpl: async () => { throw new TypeError('fetch failed'); } });
  const { errors, exitCode } = await runCli(['read', 'http://localhost:3000/'], { client });
  assert.equal(exitCode, 1);
  assert.match(errors[0], /waypoint start/);
});
