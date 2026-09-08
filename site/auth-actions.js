export async function submitAuth(client, mode, values, origin, policyVersion) {
  const email = String(values.email || '').trim();
  const password = String(values.password || '');
  if (mode === 'login') {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { redirect: '/account/' };
  }
  if (mode === 'signup') {
    if (!values.terms) throw new Error('Accept the terms before creating an account.');
    const { data, error } = await client.auth.signUp({ email, password, options: {
      emailRedirectTo: `${origin}/auth/callback/`,
      data: { terms_version: policyVersion, terms_accepted_at: new Date().toISOString() },
    } });
    if (error) throw error;
    return data.session ? { redirect: '/account/' } : { message: 'Check your inbox for an account confirmation email. If you already have an account, log in or reset your password.' };
  }
  if (mode === 'forgot') {
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password/` });
    if (error) throw error;
    return { message: 'If an account exists for this email, you’ll receive a password reset link. Check your inbox and spam folder.' };
  }
  if (mode === 'reset') {
    const { data: { user }, error: sessionError } = await client.auth.getUser();
    if (sessionError || !user) throw new Error('Your reset link has expired. Request a new link to continue.');
    const { error } = await client.auth.updateUser({ password });
    if (error) throw error;
    return { message: 'Your password has been updated. You can now return to your account.', accountLink: true };
  }
  throw new Error('Unknown account action.');
}
