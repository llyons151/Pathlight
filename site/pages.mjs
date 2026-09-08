export const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ],
  );
export const legalLinks =
  '<a href="/terms/">Terms</a><a href="/privacy/">Privacy</a><a href="/cookies/">Cookies</a><a href="/acceptable-use/">Acceptable use</a><a href="/contact/">Contact</a>';
const brand =
  '<a class="brand" href="/" aria-label="Pathlight home"><span class="brand-icon" aria-hidden="true">↗</span>pathlight</a>';
const emailField =
  '<label for="email">Email address</label><input id="email" name="email" type="email" autocomplete="email" placeholder="you@company.com" maxlength="254" required>';
const passwordField = (fresh = false, confirm = false) =>
  `<label for="${confirm ? 'confirm-password' : 'password'}">${confirm ? 'Confirm password' : fresh ? 'New password' : 'Password'}</label><div class="password-field"><input id="${confirm ? 'confirm-password' : 'password'}" name="${confirm ? 'confirm-password' : 'password'}" type="password" autocomplete="${fresh ? 'new-password' : 'current-password'}" ${fresh ? 'minlength="12"' : ''} maxlength="128" required><button type="button" class="show-password" aria-label="Show ${confirm ? 'confirmation password' : 'password'}" aria-pressed="false">Show</button></div>`;
const submit = (text) =>
  `<button class="button dark form-submit" type="submit" disabled>${text}<span aria-hidden="true">↗</span></button>`;
const status =
  '<p id="form-status" class="form-status" role="status" aria-live="polite">Connecting securely…</p><noscript><p class="notice">Enable JavaScript to use account forms.</p></noscript>';
function form(mode, fields, button) {
  return `<form id="auth-form" data-mode="${mode}">${fields}${submit(button)}${['login', 'signup'].includes(mode) ? '<button class="button form-submit" id="google-sign-in" type="button" disabled>Continue with Google</button>' : ''}${status}</form>`;
}
function auth(title, intro, fields, after = '') {
  return `<section class="auth-layout"><div class="auth-story"><span class="page-eyebrow">A CLEARER PATH FORWARD</span><h2>A little context.<br>A whole new<br><em>perspective.</em></h2><p>Understand the people behind the patterns.<br>Make your next move with more clarity.</p><div class="story-orbit" aria-hidden="true"><span>↗</span><i></i><b></b></div><small>Thoughtful analytics. Human perspective.</small></div><div class="auth-card"><a class="back-link" href="/">← Back to Pathlight</a><h1>${title}</h1><p class="page-intro">${intro}</p>${fields}${after}</div></section>`;
}
export function pages(config) {
  const contact = config.contactEmail
    ? `<a href="mailto:${escape(config.contactEmail)}">${escape(config.contactEmail)}</a>`
    : '<a href="/contact/">the contact page</a>';
  const operator = config.operatorName
    ? escape(config.operatorName)
    : 'the Pathlight operator (identity to be confirmed before launch)';
  const notice =
    config.legalReviewed &&
    config.operatorName &&
    config.jurisdiction &&
    config.contactEmail &&
    config.postalAddress
      ? ''
      : '<aside class="notice"><strong>Pre-launch draft.</strong> Operator details and jurisdiction-specific provisions are being finalized. These documents are not yet the final terms for a public account service.</aside>';
  const legal = (title, lead, sections) =>
    `<section class="legal-layout"><aside class="legal-nav"><span class="page-eyebrow">THE DETAILS, MADE CLEAR</span>${legalLinks}</aside><article class="legal-document"><span class="page-eyebrow">PATHLIGHT / LEGAL</span><h1>${title}</h1><p class="page-intro">${lead}</p><p class="policy-date">Version ${escape(config.policyVersion)}</p>${notice}${sections.map(([heading, text], i) => `<section id="section-${i + 1}"><h2>${i + 1}. ${heading}</h2>${text}</section>`).join('')}<p class="legal-contact">Questions about this document? Contact ${contact}.</p></article></section>`;
  return {
    404: {
      title: 'Page not found',
      body: '<section class="not-found-layout"><div class="lost-orbit" aria-hidden="true"><span>404</span><i></i></div><span class="page-eyebrow">A SMALL DETOUR</span><h1>This path ends here.</h1><p class="page-intro">The page you’re looking for may have moved,<br>or the address might not be quite right.</p><div class="not-found-actions"><a class="button dark" href="/">Back to Pathlight <span aria-hidden="true">↗</span></a><a href="/contact/">Need a hand? Contact us</a></div></section>',
    },
    login: {
      title: 'Log in',
      body: auth(
        'Welcome back.',
        'A clearer picture starts here.',
        form(
          'login',
          emailField +
            passwordField() +
            '<a class="forgot-link" href="/forgot-password/">Forgot your password?</a>',
          'Log in',
        ),
        '<p class="form-switch">New to Pathlight? <a href="/signup/">Create an account</a></p>',
      ),
    },
    signup: {
      title: 'Create an account',
      body: auth(
        'Find your path.',
        'Create your Pathlight account.',
        form(
          'signup',
          emailField +
            passwordField(true) +
            '<p class="field-hint">Use at least 12 characters. A unique passphrase works well.</p>' +
            passwordField(true, true) +
            '<label class="checkbox-label"><input type="checkbox" name="terms" required><span>I am at least 18 and agree to the <a href="/terms/">Terms of Service</a> and <a href="/acceptable-use/">Acceptable Use Policy</a>. I have read the <a href="/privacy/">Privacy Notice</a>.</span></label>',
          'Create account',
        ),
        '<p class="form-switch">Already have an account? <a href="/login/">Log in</a></p>',
      ),
    },
    'forgot-password': {
      title: 'Reset your password',
      body: auth(
        'Let’s get you back.',
        'Enter your email and we’ll send instructions to reset your password.',
        form('forgot', emailField, 'Send reset link'),
        '<p class="form-switch"><a href="/login/">Back to login</a></p>',
      ),
    },
    'reset-password': {
      title: 'Choose a new password',
      body: auth(
        'A fresh start.',
        'Choose a new, unique password for your account.',
        form(
          'reset',
          passwordField(true) +
            '<p class="field-hint">Use at least 12 characters.</p>' +
            passwordField(true, true),
          'Update password',
        ),
        '<p class="form-switch"><a href="/forgot-password/">Request a new reset link</a></p>',
      ),
    },
    'auth/callback': {
      title: 'Complete sign-in',
      body: auth(
        'One moment.',
        'We’re completing your sign-in.',
        '<p id="callback-status" class="form-status" role="status">Verifying your session…</p><noscript>Enable JavaScript to confirm your email.</noscript><p class="form-switch"><a href="/login/">Back to login</a></p>',
      ),
    },
    dashboard: {
      title: 'Dashboard',
      body: `<section class="dashboard-layout"><p id="account-status" class="page-intro" role="status">Checking your session…</p><div id="account-content" hidden><div class="dashboard-heading"><div><span class="page-eyebrow">YOUR WORKSPACE</span><h1>A little more clarity.</h1><p class="page-intro">Welcome to your Pathlight dashboard.</p></div><div class="dashboard-user"><span id="account-email"></span><button id="sign-out" class="button dark" type="button">Log out</button></div></div><nav class="dashboard-nav" aria-label="Workspace"><a href="/dashboard/" aria-current="page">Overview</a><a href="/account/">Account settings ↗</a></nav><div class="dashboard-metrics"><article><span>Visitors</span><strong>—</strong><small>Waiting for website data</small></article><article><span>Page views</span><strong>—</strong><small>Waiting for website data</small></article><article><span>Conversions</span><strong>—</strong><small>Waiting for website data</small></article></div><div class="dashboard-grid"><article class="dashboard-welcome"><span class="page-eyebrow">ROOM TO GROW</span><div class="dashboard-symbol" aria-hidden="true">↗</div><h2>Your next chapter<br>starts with context.</h2><p>Your account is ready. Website connections and live analytics are still in development. Until then, explore what Pathlight can help you understand.</p><a class="button dark" href="/#demo">Explore sample analytics ↗</a></article><div class="dashboard-side"><article class="account-panel"><span class="page-eyebrow">GET YOUR BEARINGS</span><h2>Make yourself at home.</h2><p>Manage your account details and password in one place.</p><a href="/account/">Account settings ↗</a></article><article class="account-panel"><span class="page-eyebrow">LET’S TALK</span><h2>A question or an idea?</h2><p>Tell us what you’d like to understand about your audience.</p><a href="/contact/">Contact Pathlight ↗</a></article></div></div></div><noscript>Enable JavaScript to access your dashboard.</noscript></section>`,
    },
    account: {
      title: 'Your account',
      body: `<section class="account-layout"><span class="page-eyebrow">YOUR PATHLIGHT ACCOUNT</span><h1>A clearer path starts here.</h1><p id="account-status" class="page-intro" role="status">Checking your session…</p><div id="account-content" hidden><div class="account-panel"><h2>Account details</h2><p class="field-hint">Signed in as</p><p id="account-email"></p><a href="/forgot-password/">Reset your password ↗</a><button id="sign-out" class="button dark" type="button">Log out</button></div><div class="account-panel"><span class="page-eyebrow">PRODUCT PREVIEW</span><h2>Your next good decision.</h2><p>Website connections and live analytics are still in development. Explore the sample dashboard to see what’s coming.</p><a class="button dark" href="/dashboard/">Open dashboard ↗</a></div><p>For account deletion or a copy of your information, contact ${contact}. Please use the email associated with your account.</p></div><noscript>Enable JavaScript to access your account.</noscript></section>`,
    },
    contact: {
      title: 'Contact',
      body: `<section class="contact-layout"><div><span class="page-eyebrow">LET’S TALK</span><h1>Good questions.<br>Real conversations.</h1><p class="page-intro">A product question, a privacy request, or something we could do better? We’re listening.</p><div class="contact-topics"><h2>Product & support</h2><p>Questions about Pathlight or trouble with your account.</p><h2>Privacy & your data</h2><p>Request access, correction, or deletion of your account information.</p><h2>Security</h2><p>Report a suspected vulnerability privately. Please don’t include passwords, tokens, or other people’s data.</p></div></div><div class="contact-card"><h2>Start a conversation.</h2>${config.contactEmail ? `<p>Email us at ${contact}, or prepare an email below.</p><form id="contact-form"><label for="topic">What’s on your mind?</label><select id="topic" name="topic"><option>Product question</option><option>Account support</option><option>Privacy request</option><option>Security report</option><option>Something else</option></select><label for="message">Your message</label><textarea id="message" name="message" rows="7" maxlength="4000" required placeholder="Tell us a little more…"></textarea><button class="button dark form-submit" type="submit">Open email app <span aria-hidden="true">↗</span></button><p class="field-hint">This opens a draft in your email app. You review and send it there. Nothing is submitted by this form.</p><p id="contact-status" role="status"></p></form>` : '<p class="notice">Our public contact address is being set up. Contact requests are not available yet.</p>'}<p class="field-hint">See how we handle correspondence in our <a href="/privacy/">Privacy Notice</a>.</p>${config.operatorName ? `<div class="operator-details"><strong>${operator}</strong>${config.postalAddress ? `<p>${escape(config.postalAddress)}</p>` : ''}${config.jurisdiction ? `<p>${escape(config.jurisdiction)}</p>` : ''}</div>` : ''}</div></section>`,
    },
    terms: {
      title: 'Terms of Service',
      body: legal('Terms of Service', 'The ground rules for using Pathlight.', [
        [
          'About these terms',
          `<p>These terms describe your use of Pathlight, operated by ${operator}. ${config.jurisdiction ? `The operator is based in ${escape(config.jurisdiction)}.` : 'The operator’s location will be provided before public account registration opens.'} If you do not agree, do not create an account or use the account service. You must be at least 18 and authorized to accept these terms on behalf of any organization you represent.</p>`,
        ],
        [
          'The current service',
          '<p>Pathlight is a product preview for AI-assisted website analytics. The public demonstration uses illustrative data and preset answers. It does not connect to your website or provide live analytics or connected AI. Account availability does not promise a launch date, feature set, or future access.</p>',
        ],
        [
          'Your account',
          '<p>Provide an email address you control, protect your credentials, and tell us if you suspect unauthorized access. You are responsible for activity you authorize through your account. Do not share another person’s credentials or impersonate someone else.</p>',
        ],
        [
          'Appropriate use',
          '<p>Follow our <a href="/acceptable-use/">Acceptable Use Policy</a>. Do not misuse the service, interfere with its security, or use it unlawfully. You retain rights to content you submit and authorize us to use that content only as needed to provide the service and respond to you.</p>',
        ],
        [
          'Analytics and AI limitations',
          '<p>Behavioral patterns and AI-generated explanations, if offered, may be incomplete or incorrect and do not prove a person’s intent. Validate important conclusions independently. Do not rely on the preview for medical, legal, financial, employment, or other consequential decisions about people.</p>',
        ],
        [
          'Ownership',
          '<p>The Pathlight name, interface, and original site materials belong to their respective owners. You may use the service for its intended purpose. These terms do not transfer intellectual property ownership or override licenses applicable to third-party materials.</p>',
        ],
        [
          'Fees and future features',
          '<p>The current preview does not take payments or start a paid subscription. Any future paid offering will disclose prices, renewal terms, cancellation, and applicable refund rights before purchase. These terms do not authorize future charges.</p>',
        ],
        [
          'Availability, suspension, and leaving',
          `<p>We may update or discontinue preview features. We may restrict access when reasonably necessary to address abuse, security risks, or legal obligations. Where practical, we will explain the restriction and provide a way to contact us. You can stop using Pathlight at any time and request account deletion through ${contact}. Information needed for legal or security purposes may need to be retained.</p>`,
        ],
        [
          'Disclaimers and responsibility',
          '<p>The preview is provided on an “as available” basis. We do not promise uninterrupted access, error-free operation, or specific outcomes. To the extent permitted by applicable law, we exclude implied warranties. Nothing in these terms excludes mandatory consumer rights or liability that cannot legally be excluded, including liability for fraud or other conduct protected by applicable law.</p>',
        ],
        [
          'Disputes and changes',
          `<p>Please contact ${contact} first so we can try to resolve an issue. Mandatory protections and court rights available under applicable law remain in place; these draft terms do not impose arbitration or a class-action waiver. We will update the version date when these terms change and provide appropriate notice of material changes before they apply.</p>`,
        ],
      ]),
    },
    privacy: {
      title: 'Privacy Notice',
      body: legal(
        'Privacy Notice',
        'What information is involved, why it is used, and your choices.',
        [
          [
            'Who is responsible',
            `<p>${operator} is responsible for the personal information handled through this site and its account service. ${config.postalAddress ? `Postal address: ${escape(config.postalAddress)}.` : 'A postal contact will be provided before public account registration opens.'} Contact ${contact} with privacy questions.</p>`,
          ],
          [
            'Information involved',
            '<p>Browsing the landing page does not send the sample analytics questions to a backend or AI provider. The preview’s visitor stories are fictional. Hosting infrastructure may receive technical request information such as IP address, browser details, requested URLs, and timestamps.</p><p>When account authentication is enabled, Supabase receives your email address, password (for email/password accounts), authentication requests, and related technical information to operate signup, login, verification, and recovery. If you continue with Google, Google authenticates you and shares your basic profile and email address with Supabase. Pathlight does not receive your Google password. Email signup includes the policy version and acceptance time in account metadata. If you email us, your email provider and ours process the correspondence, address, and any information you choose to include.</p>',
          ],
          [
            'Why information is used',
            '<p>Account information is used to create and maintain your account, authenticate you, send service emails, prevent abuse, and respond to requests. Correspondence is used to answer your message. Technical information supports site delivery, troubleshooting, and security. We do not use the current preview to track your website’s visitors or send questions to an AI service.</p><p>Where a legal basis is required, account operations rely on performing the requested service, proportionate security and support processing may rely on legitimate interests, and legally required records rely on legal obligations. Any future optional processing that requires consent will be presented separately.</p>',
          ],
          [
            'Service providers and disclosures',
            '<p>Supabase provides account authentication when configured. Site hosting and email providers may process technical requests and messages as part of delivering their services. The site requests DM Sans from Google Fonts, which receives the network information needed to serve the font. We may disclose information when legally required or when reasonably necessary to protect rights and security. The current implementation includes no advertising or marketing trackers.</p>',
          ],
          [
            'Storage in your browser',
            '<p>The landing page does not set analytics or advertising cookies. Account pages use browser session storage for authentication state; it is normally cleared when the tab or window closes. Authentication state is used to maintain the requested login and process confirmation or recovery links. See the <a href="/cookies/">Cookies & Browser Storage Notice</a>.</p>',
          ],
          [
            'Retention and deletion',
            '<p>Account information is retained while the account is active and until a deletion request is processed, subject to legal and security needs. Correspondence is kept as needed to resolve the request and meet applicable obligations. Backup and security-log retention depends on the configured providers. Exact provider retention settings and deletion procedures must be confirmed before public launch.</p>',
          ],
          [
            'International processing',
            '<p>Authentication, hosting, font, and email services may process information outside your country. The operator must confirm provider locations, applicable contracts, and safeguards for regulated international transfers before public account registration opens.</p>',
          ],
          [
            'Your choices and rights',
            `<p>Depending on applicable law, you may have rights to access, correct, delete, restrict, or receive a copy of your information, object to certain processing, or withdraw consent without affecting earlier lawful processing. Send requests to ${contact}. We may ask for proportionate verification before acting. You may also have the right to complain to your local data protection authority. We do not sell personal information through the current preview.</p>`,
          ],
          [
            'Children and updates',
            '<p>The account service is intended for adults aged 18 and over. If you believe a child has provided account information, contact us so we can investigate and address it. This notice will be updated when data practices change, with appropriate notice for material changes.</p>',
          ],
        ],
      ),
    },
    cookies: {
      title: 'Cookies & Browser Storage',
      body: legal(
        'Cookies & browser storage.',
        'A clear view of what this site stores in your browser.',
        [
          [
            'The public preview',
            '<p>The landing page does not set analytics or advertising cookies or persist the questions you type into the sample demo. The globe and background animations run in your browser. Your browser may cache site files and fonts as part of normal browsing.</p>',
          ],
          [
            'Account sessions',
            '<p>When authentication is configured, Supabase uses session storage under a project-specific authentication key to hold access and refresh tokens. This lets you use the account service without signing in for each action. Temporary authentication flow information may also be stored under related keys. These values are not advertising identifiers and are normally removed when the tab or window closes. Logging out removes the local account session.</p>',
          ],
          [
            'External requests',
            '<p>The site loads a font from Google Fonts. Account requests go to the configured Supabase project. These services receive request information even where a cookie is not used; see our <a href="/privacy/">Privacy Notice</a>.</p>',
          ],
          [
            'Your controls',
            '<p>You can clear or block site storage in browser settings. Blocking session storage may prevent login, verification, and recovery from working. No optional tracking is enabled by this implementation. If optional analytics or advertising is introduced, this notice and any required consent controls must be updated before that processing begins.</p>',
          ],
        ],
      ),
    },
    'acceptable-use': {
      title: 'Acceptable Use Policy',
      body: legal(
        'Acceptable use.',
        'Keep Pathlight useful, respectful, and safe for everyone.',
        [
          [
            'Use the service lawfully',
            '<p>Use Pathlight only for authorized activities. Do not violate laws, third-party rights, privacy, or contractual obligations. Do not impersonate others, defraud people, or send unlawful, abusive, or malicious content.</p>',
          ],
          [
            'Respect security and availability',
            '<p>Do not attempt unauthorized access, steal credentials, distribute malware, bypass access controls or rate limits, or disrupt service. Security research must avoid accessing other people’s information and avoid destructive tests. Report suspected vulnerabilities privately through the <a href="/contact/">contact page</a>.</p>',
          ],
          [
            'Respect the people behind the data',
            '<p>Do not submit passwords, payment card details, sensitive personal information, or information you are not authorized to share. If website analytics features are introduced, you must have authority to connect the website and provide notices and consent where required. Do not use analytics to discriminate unlawfully or secretly monitor individuals.</p>',
          ],
          [
            'Enforcement',
            '<p>We may investigate suspected misuse and restrict access proportionately to protect users and the service. Serious or repeated violations may lead to account termination. Contact us if you believe an action was taken in error.</p>',
          ],
        ],
      ),
    },
  };
}
export function document(route, page) {
  const authPage = [
    'login',
    'signup',
    'forgot-password',
    'reset-password',
    'auth/callback',
    'account',
    'dashboard',
    '404',
  ].includes(route);
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#d6dce8"><meta name="description" content="${escape(page.title)} — Pathlight"><meta name="referrer" content="no-referrer">${authPage ? '<meta name="robots" content="noindex,nofollow">' : ''}<title>${escape(page.title)} — Pathlight</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23d6ddff'/%3E%3Cpath d='M18 46L46 18M20 18h26v26' fill='none' stroke='%23344469' stroke-width='5'/%3E%3C/svg%3E"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/pages.css"></head><body class="inner-page"><a class="skip-link" href="#main-content">Skip to content</a><header class="page-header">${brand}<nav aria-label="Main navigation"><a href="/#features">Product</a><a href="/contact/">Contact</a><a class="button dark" href="${['dashboard', 'account'].includes(route) ? '/dashboard/' : '/login/'}">${['dashboard', 'account'].includes(route) ? 'Dashboard' : 'Log in'} <span aria-hidden="true">↗</span></a></nav></header><main id="main-content">${page.body}</main><footer class="page-footer"><div>${brand}<span>A clearer path forward.</span></div><nav aria-label="Legal and contact">${legalLinks}</nav><small>© ${new Date().getFullYear()} Pathlight</small></footer><script type="module" src="/assets/pages.js"></script></body></html>`;
}
