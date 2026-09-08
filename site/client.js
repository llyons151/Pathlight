import { createClient } from '@supabase/supabase-js';
import { submitAuth } from './auth-actions.js';
const config = __PUBLIC_CONFIG__;
const route = location.pathname.replace(/^\/+|\/+$/g, '');
document.querySelectorAll('.legal-nav a').forEach(link => {
  if (link.pathname.replace(/^\/+|\/+$/g, '') === route) link.setAttribute('aria-current', 'page');
});
document.querySelectorAll('.show-password').forEach(button => button.addEventListener('click', () => {
  const input = button.previousElementSibling;
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  button.textContent = show ? 'Hide' : 'Show';
  button.setAttribute('aria-pressed', String(show));
  button.setAttribute('aria-label', `${show ? 'Hide' : 'Show'} ${input.name === 'confirm-password' ? 'confirmation password' : 'password'}`);
}));
const contactForm = document.querySelector('#contact-form');
contactForm?.addEventListener('submit', event => {
  event.preventDefault();
  if (!contactForm.reportValidity() || !config.contactEmail) return;
  const values = new FormData(contactForm);
  const message = String(values.get('message')).trim();
  if (!message) return;
  location.href = `mailto:${config.contactEmail}?subject=${encodeURIComponent(`Pathlight — ${values.get('topic')}`)}&body=${encodeURIComponent(message)}`;
  document.querySelector('#contact-status').textContent = 'Your email app should open with a draft. Review it and press Send there, or use the email address above.';
});
const form = document.querySelector('#auth-form');
const stateElement = document.querySelector('#form-status, #callback-status, #account-status');
function status(message, state = '') {
  if (!stateElement) return;
  stateElement.textContent = message;
  stateElement.dataset.state = state;
}
function errorMessage(error) {
  if (['invalid_credentials', 'invalid_grant'].includes(error.code)) return 'The email or password is incorrect. Please try again.';
  if (error.code === 'email_not_confirmed') return 'Please confirm your email before logging in. Check your inbox and spam folder.';
  if (error.status === 429 || /rate_limit/.test(error.code || '')) return 'Too many attempts. Please wait a few minutes and try again.';
  if (['weak_password','same_password'].includes(error.code)) return 'Choose a stronger password that is different from your current one.';
  if (error.code === 'user_already_exists') return 'Unable to create this account. Try logging in or resetting your password.';
  if (['signup_disabled','email_provider_disabled'].includes(error.code)) return 'Account registration is currently unavailable. Please try again later.';
  if (error.message === 'Accept the terms before creating an account.' || error.message?.startsWith('Your reset link')) return error.message;
  return 'We couldn’t complete that request. Check your connection and try again, or contact us for help.';
}
async function initializeAuth() {
  if (!stateElement) return;
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    status('Account access is not available yet. Please check back soon.', 'error');
    return;
  }
  let storage;
  try {
    storage = window.sessionStorage;
    storage.setItem('pathlight-storage-check', '1');
    storage.removeItem('pathlight-storage-check');
  } catch {
    status('Allow session storage in your browser to use your account.', 'error');
    return;
  }
  const client = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
  });
  const fragment = new URLSearchParams(location.hash.slice(1));
  const linkError = fragment.has('error') || new URLSearchParams(location.search).has('error');
  // Let the SDK consume email link tokens before removing them from the address bar.
  const { error: sessionError } = await client.auth.getSession();
  if (location.hash || location.search) history.replaceState(null, '', location.pathname);
  if (linkError || (sessionError && ['auth/callback', 'reset-password'].includes(route))) {
    status('This link is invalid or has expired. Request a fresh link and try again.', 'error');
    return;
  }
  client.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT' && ['account', 'reset-password'].includes(route)) {
      document.querySelector('#account-content')?.setAttribute('hidden', '');
      location.replace('/login/');
    }
  });
  if (['account', 'reset-password', 'auth/callback'].includes(route)) {
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) {
      if (route === 'account') location.replace('/login/');
      else status('This link is invalid or has expired. Request a fresh link and try again.', 'error');
      return;
    }
    if (route === 'auth/callback') { location.replace('/account/'); return; }
    if (route === 'account') {
      status('Welcome to your account.');
      document.querySelector('#account-email').textContent = user.email;
      document.querySelector('#account-content').hidden = false;
      document.querySelector('#sign-out').addEventListener('click', async event => {
        event.target.disabled = true;
        try {
          const { error } = await client.auth.signOut({ scope: 'local' });
          if (error) throw error;
          location.replace('/login/');
        } catch (error) { status(errorMessage(error), 'error'); event.target.disabled = false; }
      });
      return;
    }
  }
  if (!form) return;
  if (route === 'signup' && !config.registrationReady) {
    status('New account registration is not open yet. Please check back soon.', 'error');
    return;
  }
  status('');
  const button = form.querySelector('[type=submit]');
  button.disabled = false;
  const confirmation = form.querySelector('[name=confirm-password]');
  const password = form.querySelector('[name=password]');
  const validatePassword = () => confirmation?.setCustomValidity(confirmation.value === password.value ? '' : 'Passwords must match.');
  confirmation?.addEventListener('input', validatePassword);
  password?.addEventListener('input', validatePassword);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    validatePassword();
    if (!form.reportValidity() || button.disabled) return;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status('Please wait…');
    try {
      const result = await submitAuth(client, form.dataset.mode, Object.fromEntries(new FormData(form)), location.origin, config.policyVersion);
      if (result.redirect) { location.assign(result.redirect); return; }
      status(result.message, 'success');
      form.reset();
      if (result.accountLink) {
        const link = document.createElement('a');
        link.href = '/account/'; link.textContent = ' Go to your account →';
        stateElement.append(link);
      }
    } catch (error) { status(errorMessage(error), 'error'); }
    finally { button.disabled = false; form.removeAttribute('aria-busy'); }
  });
}
initializeAuth().catch(() => status('Account access is temporarily unavailable. Please refresh and try again.', 'error'));
