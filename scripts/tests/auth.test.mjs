import test from 'node:test';
import assert from 'node:assert/strict';
import { submitAuth, signInWithGoogle } from '../../site/auth-actions.js';

test('confirmed signup redirects and records consent time', async () => {
  const start = Date.now();
  const result = await submitAuth(
    {
      auth: {
        signUp: async ({ options }) => {
          assert.ok(Date.parse(options.data.terms_accepted_at) >= start);
          return { data: { session: { user: { id: 'test' } } }, error: null };
        },
      },
    },
    'signup',
    { terms: 'on' },
    'https://example.com',
    'v1',
  );
  assert.equal(result.redirect, '/dashboard/');
});

for (const [mode, method, values] of [
  ['signup', 'signUp', { terms: 'on' }],
  ['forgot', 'resetPasswordForEmail', {}],
  ['reset', 'updateUser', { password: 'new-passphrase' }],
]) {
  test(`${mode} propagates provider failure without reporting success`, async () => {
    const failure = new Error('Provider unavailable');
    const auth = {
      getUser: async () => ({ data: { user: { id: 'test' } }, error: null }),
      [method]: async () => ({ error: failure }),
    };
    await assert.rejects(
      submitAuth({ auth }, mode, values, 'https://example.com', 'v1'),
      (error) => error === failure,
    );
  });
}

test('failed user verification prevents password updates even with cached user data', async () => {
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: { id: 'stale' } },
        error: new Error('Expired'),
      }),
      updateUser: () => assert.fail('Must not update'),
    },
  };
  await assert.rejects(
    submitAuth(client, 'reset', {}, 'https://example.com', 'v1'),
    /expired/,
  );
});

test('unknown auth modes are rejected', async () => {
  await assert.rejects(
    submitAuth({}, 'unknown', {}, 'https://example.com', 'v1'),
    /Unknown account action/,
  );
});

test('Google OAuth returns to the account verification callback', async () => {
  let requested;
  await signInWithGoogle(
    {
      auth: {
        signInWithOAuth: async (options) => {
          requested = options;
          return { error: null };
        },
      },
    },
    'https://example.com',
  );
  assert.deepEqual(requested, {
    provider: 'google',
    options: { redirectTo: 'https://example.com/auth/callback/' },
  });
});

test('Google provider failures propagate to the form', async () => {
  const failure = new Error('Provider disabled');
  await assert.rejects(
    signInWithGoogle(
      {
        auth: {
          signInWithOAuth: async () => ({ error: failure }),
        },
      },
      'https://example.com',
    ),
    (error) => error === failure,
  );
});
