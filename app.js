const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionEase = 'cubic-bezier(0.22, 1, 0.36, 1)';
const runningAnimations = new Set();
function animate(element, frames, options = {}) {
  if (reducedMotion.matches || !element.animate) return null;
  const animation = element.animate(frames, { duration: 550, easing: motionEase, ...options });
  runningAnimations.add(animation);
  const clean = () => runningAnimations.delete(animation);
  animation.addEventListener('finish', clean, { once: true });
  animation.addEventListener('cancel', clean, { once: true });
  return animation;
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) runningAnimations.forEach(animation => animation.finish());
});

const insights = [
  { title: 'A small screen. <br>A big opportunity.', copy: 'Mobile visitors reach checkout, but leave more often than desktop visitors. The shipping step is worth a closer look.', stat: '2.1×', evidence: 'higher checkout drop-off<br>on mobile devices' },
  { title: 'Your best introduction? <br>A useful story.', copy: 'Visitors arriving from the journal explore more product pages. Try giving your most helpful articles a clearer path to the products they feature.', stat: '38%', evidence: 'more product views<br>from journal visitors' },
  { title: 'The second visit <br>makes a difference.', copy: 'Returning visitors convert more often in this sample. Ask first-time visitors what information would help them feel ready to buy.', stat: '3.4×', evidence: 'higher conversion rate<br>among returning visitors' },
];
let activeInsight = 0;
document.querySelector('#next-insight').addEventListener('click', () => {
  activeInsight = (activeInsight + 1) % insights.length;
  const insight = insights[activeInsight];
  document.querySelector('#insight-title').innerHTML = insight.title;
  document.querySelector('#insight-copy').textContent = insight.copy;
  document.querySelector('#insight-stat').textContent = insight.stat;
  document.querySelector('#insight-evidence').innerHTML = insight.evidence;
  document.querySelector('#insight-number').textContent = `0${activeInsight + 1} / 03`;
  document.querySelectorAll('#insight-title, #insight-copy, .evidence').forEach((element, index) => {
    element.getAnimations().forEach(animation => animation.cancel());
    animate(element, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { delay: index * 35, fill: 'backwards', duration: 420 });
  });
});
document.querySelector('#period').addEventListener('change', (event) => {
  const month = event.target.value === 'month';
  const values = month
    ? ['48,219', '14.2%', '3.61%', '3m 02s', '48,219', '28,931', '4,342', '1,741']
    : ['12,846', '18.6%', '3.24%', '2m 48s', '12,846', '7,194', '1,038', '416'];
  ['visitors', 'visitor-change', 'conversion', 'duration', 'funnel-start', 'funnel-product', 'funnel-checkout', 'funnel-purchase'].forEach((id, index) => {
    const element = document.getElementById(id);
    element.textContent = values[index];
    element.getAnimations().forEach(animation => animation.cancel());
    animate(element, [{ opacity: .25, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 450 });
  });
  document.querySelectorAll('.bar i').forEach((bar, index) => bar.style.width = `${(month ? [100, 60, 9, 3.61] : [100, 56, 8.08, 3.24])[index]}%`);
});
document.querySelector('#ask-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#question');
  const question = input.value.trim();
  if (!question) return;
  let reply;
  if (/mobile|checkout|drop|leav|shipping/i.test(question)) reply = 'In this sample, mobile checkout drop-off is 2.1× higher than desktop. Review the shipping form on a small screen and ask users where they got stuck. A shorter form is one experiment to consider; the data alone doesn’t establish the cause.';
  else if (/source|traffic|journal|blog|article/i.test(question)) reply = 'In this sample, journal visitors view 38% more product pages. Try adding relevant product links to an article, then compare product visits and purchases before and after the change.';
  else if (/return|repeat|loyal/i.test(question)) reply = 'In this sample, returning visitors convert at 3.4× the rate of new visitors. This may reflect greater familiarity or different intent. Interview new visitors to learn what information they still need.';
  else reply = 'Start with the sample checkout journey: 1,038 visitors reach checkout and 416 purchase in the 7-day view. Explore device differences and ask visitors about friction before deciding what to change. Try asking about mobile checkout, journal traffic, or returning visitors.';
  const answer = document.querySelector('#answer');
  answer.textContent = `Demo response · ${reply} This preview uses preset answers, not connected AI.`;
  answer.hidden = false;
  answer.getAnimations().forEach(animation => animation.cancel());
  animate(answer, [{ opacity: 0, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }]);
});
document.querySelector('#year').textContent = new Date().getFullYear();

// Content stays visible if JavaScript or observers are unavailable.
const entranceElements = document.querySelectorAll('.header, .app-icon, .hero h1, .hero-copy, .hero-actions, .hero-note, .capability-strip');
entranceElements.forEach((element, index) => animate(element, [
  { opacity: 0, transform: `translateY(${index === 0 ? -8 : 18}px)` },
  { opacity: 1, transform: 'translateY(0)' },
], { delay: index * 75, duration: 900, fill: 'backwards' }));

if ('IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const index = element.matches('.features article') ? [...element.parentElement.children].indexOf(element) : 0;
      animate(element, [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 850, delay: index * 85, fill: 'backwards' });
      if (element.matches('.dashboard')) {
        element.querySelectorAll('.bar i').forEach((bar, i) => animate(bar, [
          { transform: 'scaleX(0)' }, { transform: 'scaleX(1)' },
        ], { duration: 1000, delay: 180 + i * 85, fill: 'backwards' }));
      }
      reveals.unobserve(element);
    });
  }, { threshold: .08 });
  document.querySelectorAll('.dashboard, .intro, .features article, .manifesto, .faq, footer').forEach(element => reveals.observe(element));
}

// Preserve native keyboard behavior while animating disclosure height.
document.querySelectorAll('.faq details').forEach(details => {
  const summary = details.querySelector('summary');
  let currentAnimation = null;
  let expanded = details.open;
  summary.addEventListener('click', event => {
    if (reducedMotion.matches || !details.animate) return;
    event.preventDefault();
    const start = details.getBoundingClientRect().height;
    if (!currentAnimation) expanded = details.open;
    expanded = !expanded;
    if (currentAnimation) {
      currentAnimation.onfinish = null;
      currentAnimation.cancel();
    }
    details.open = true;
    const end = expanded ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
    details.style.overflow = 'hidden';
    currentAnimation = animate(details, [{ height: `${start}px` }, { height: `${end}px` }], { duration: 320 });
    currentAnimation.onfinish = () => {
      details.open = expanded;
      details.style.overflow = '';
      currentAnimation = null;
    };
  });
});

// Shared pause state also controls the water renderer when WebGL is available.
const atmosphere = document.querySelector('.atmosphere');
const motionToggle = document.querySelector('#motion-toggle');
let backgroundPaused = false;
let backgroundVisible = true;
function syncBackgroundMotion() {
  atmosphere.classList.toggle('motion-paused', backgroundPaused || !backgroundVisible || document.hidden);
  motionToggle.hidden = reducedMotion.matches;
  motionToggle.setAttribute('aria-pressed', String(backgroundPaused));
  const label = backgroundPaused ? 'Resume background animation' : 'Pause background animation';
  motionToggle.setAttribute('aria-label', label);
  motionToggle.title = label;
  motionToggle.firstElementChild.textContent = backgroundPaused ? '▷' : 'Ⅱ';
}
motionToggle.addEventListener('click', () => {
  backgroundPaused = !backgroundPaused;
  syncBackgroundMotion();
});
document.addEventListener('visibilitychange', syncBackgroundMotion);
reducedMotion.addEventListener('change', syncBackgroundMotion);
if ('IntersectionObserver' in window) {
  const backgroundObserver = new IntersectionObserver(([entry]) => {
    backgroundVisible = entry.isIntersecting;
    syncBackgroundMotion();
  });
  backgroundObserver.observe(atmosphere);
}
syncBackgroundMotion();
