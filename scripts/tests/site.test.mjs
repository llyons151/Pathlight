import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSiteServer } from '../server.mjs';
import { submitAuth } from '../../site/auth-actions.js';
import { pages, document } from '../../site/pages.mjs';

const emptyConfig = {operatorName:'',jurisdiction:'',contactEmail:'',postalAddress:'',legalReviewed:false,policyVersion:'2026-09-07'};
test('legal drafts and missing contact remain explicit', () => {
  const routes = pages(emptyConfig);
  assert.match(routes.privacy.body,/Pre-launch draft/);
  assert.match(routes.contact.body,/not available yet/);
  assert.doesNotMatch(routes.contact.body,/<form/);
  assert.match(routes.signup.body,/name="terms" required/);
});
test('operator details are escaped and configured contact uses an email draft', () => {
  const config = {...emptyConfig,operatorName:'<script>alert(1)</script>',contactEmail:'support@example.com'};
  const page = document('contact',pages(config).contact,config);
  assert.ok(page.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(page.includes('mailto:support@example.com'));
  assert.ok(page.includes('You review and send it there'));
});
test('login requires provider success before redirecting', async () => {
  const failure = {code:'invalid_credentials'};
  await assert.rejects(submitAuth({auth:{signInWithPassword:async () => ({error:failure})}},'login',{email:'user@example.com',password:'wrong'},'https://example.com','v1'),error => error === failure);
  const result = await submitAuth({auth:{signInWithPassword:async values => {assert.equal(values.email,'user@example.com');return {error:null};}}},'login',{email:' user@example.com ',password:'test'},'https://example.com','v1');
  assert.equal(result.redirect,'/account/');
});
test('signup requires acceptance and sends policy metadata and fixed callback', async () => {
  let called = false;
  const client = {auth:{signUp:async values => {
    called = true;
    assert.equal(values.options.emailRedirectTo,'https://example.com/auth/callback/');
    assert.equal(values.options.data.terms_version,'v1');
    return {data:{session:null},error:null};
  }}};
  await assert.rejects(submitAuth(client,'signup',{email:'u@example.com'},'https://example.com','v1'));
  assert.equal(called,false);
  const result = await submitAuth(client,'signup',{email:'u@example.com',password:'long-test-password',terms:'on'},'https://example.com','v1');
  assert.equal(result.redirect,undefined);
  assert.match(result.message,/confirmation email/);
});
test('password reset cannot update a password without a server-verified user', async () => {
  let updated = false;
  const client = {auth:{getUser:async () => ({data:{user:null},error:null}),updateUser:async () => {updated = true;return {error:null};}}};
  await assert.rejects(submitAuth(client,'reset',{password:'long-test-password'},'https://example.com','v1'),/expired/);
  assert.equal(updated,false);
  client.auth.getUser = async () => ({data:{user:{id:'test'}},error:null});
  const result = await submitAuth(client,'reset',{password:'long-test-password'},'https://example.com','v1');
  assert.equal(updated,true);
  assert.equal(result.accountLink,true);
});
test('recovery gives a neutral response without disclosing account existence', async () => {
  const result = await submitAuth({auth:{resetPasswordForEmail:async (_,options) => {
    assert.equal(options.redirectTo,'https://example.com/reset-password/');return {error:null};
  }}},'forgot',{email:'unknown@example.com'},'https://example.com','v1');
  assert.match(result.message,/If an account exists/);
});
test('built routes and links work; sensitive source files cannot be served', async () => {
  const server = createSiteServer({root:'dist',generated:'dist'});
  await new Promise((resolve,reject) => {server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of ['/',...Object.keys(pages(emptyConfig)).filter(route => route !== '404').map(route => `/${route}/`)]) {
      const response = await fetch(origin + path);
      assert.equal(response.status,200,path);
      const html = await response.text();
      assert.match(response.headers.get('content-type'),/text\/html/);
      for (const [,link] of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
        const linked = await fetch(origin + link);
        assert.equal(linked.status,200,`${path} links to ${link}`);
      }
    }
    for (const path of ['/site.config.json','/.env','/.git/config','/site/client.js','/scripts/serve.mjs','/package.json','/%2e%2e%2fsite.config.json']) {
      assert.equal((await fetch(origin + path)).status,404,path);
    }
    const redirect = await fetch(origin + '/login',{redirect:'manual'});
    assert.equal(redirect.status,308);
    assert.equal(redirect.headers.get('location'),'/login/');
    assert.equal((await fetch(origin + '/login/',{method:'POST'})).status,405);
    assert.equal((await fetch(origin + '/login/')).headers.get('x-frame-options'),'DENY');
    for (const path of ['/missing-page','/account/no-such-page/','/404.html','/%ZZ']) {
      const missing = await fetch(origin + path);
      assert.equal(missing.status,404);
      assert.match(missing.headers.get('content-type'),/text\/html/);
      assert.match(await missing.text(),/This path ends here/);
    }
    const head = await fetch(origin + '/missing',{method:'HEAD'});
    assert.equal(head.status,404);
    assert.equal(await head.text(),'');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
