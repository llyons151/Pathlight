import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generate } from '../generate.mjs';

const config = {
  operatorName: '',
  jurisdiction: '',
  contactEmail: '',
  postalAddress: '',
  legalReviewed: false,
  policyVersion: 'test-v1',
  supabaseUrl: '',
  supabasePublishableKey: '',
};

test('invalid configuration fails before producing files', async () => {
  const output = await mkdtemp(join(tmpdir(), 'pathlight-invalid-'));
  try {
    for (const override of [
      { contactEmail: 'invalid' },
      { contactEmail: 'support@example.com?subject=injected' },
      { supabaseUrl: 'https://example.supabase.co' },
      { supabasePublishableKey: 'sb_publishable_test' },
      {
        supabaseUrl: 'http://example.supabase.co',
        supabasePublishableKey: 'sb_publishable_test',
      },
      {
        supabaseUrl: 'https://example.supabase.co',
        supabasePublishableKey: 'sb_secret_private',
      },
    ]) {
      await assert.rejects(generate(output, { ...config, ...override }));
      assert.deepEqual(await readdir(output), []);
    }
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test('configured build escapes content and excludes private configuration', async () => {
  const output = await mkdtemp(join(tmpdir(), 'pathlight-build-'));
  try {
    await generate(output, {
      ...config,
      operatorName: '<script>alert(1)</script>',
      contactEmail: 'support@example.com',
      privateToken: 'PRIVATE_SENTINEL_MUST_NOT_SHIP',
    });
    const html = await readFile(join(output, 'contact/index.html'), 'utf8');
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /<script>alert/);
    const bundle = await readFile(join(output, 'assets/pages.js'), 'utf8');
    assert.doesNotMatch(
      bundle,
      /PRIVATE_SENTINEL_MUST_NOT_SHIP|__PUBLIC_CONFIG__/,
    );
    assert.match(bundle, /support@example.com/);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

test('production output contains only intended public files and stays within size budgets', async () => {
  const files = await readdir('dist', { recursive: true });
  const allowed =
    /^(index\.html|404\.html|(?:styles|pages)\.css|(?:app|water|globe|globe-land)\.js|assets\/pages\.js|(?:404|login|signup|forgot-password|reset-password|auth\/callback|account|dashboard|terms|privacy|cookies|acceptable-use|contact)\/index\.html)$/;
  let total = 0;
  for (const file of files) {
    const info = await stat(join('dist', file));
    if (!info.isFile()) continue;
    assert.match(
      file.replaceAll('\\', '/'),
      allowed,
      `Unexpected public file: ${file}`,
    );
    total += info.size;
    if (file.endsWith('.js'))
      assert.ok(
        info.size < 500 * 1024,
        `${file} exceeds the 500 KiB JavaScript budget`,
      );
  }
  assert.ok(total < 1024 * 1024, 'Static site exceeds the 1 MiB total budget');
});
