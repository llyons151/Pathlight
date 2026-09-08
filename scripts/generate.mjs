import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { pages, document } from '../site/pages.mjs';
export async function generate(output) {
  const config = JSON.parse(await readFile(new URL('../site.config.json', import.meta.url), 'utf8'));
  if (config.contactEmail && !/^[A-Za-z0-9.!#$%&'*+\/= ?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(config.contactEmail)) throw new Error('Set a valid public contactEmail in site.config.json.');
  if (config.contactEmail && /[\s?&#]/.test(config.contactEmail)) throw new Error('Use a plain contact email address without URL parameters.');
  if (Boolean(config.supabaseUrl) !== Boolean(config.supabasePublishableKey)) throw new Error('Set both Supabase public configuration values, or leave both blank.');
  if (config.supabaseUrl && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.supabaseUrl)) throw new Error('Use your HTTPS Supabase project URL.');
  if (config.supabasePublishableKey && !config.supabasePublishableKey.startsWith('sb_publishable_')) throw new Error('Only a Supabase publishable key is supported. Never place a secret or service role key here.');
  config.registrationReady = Boolean(config.legalReviewed && config.operatorName && config.jurisdiction && config.contactEmail && config.postalAddress);
  await mkdir(output, {recursive:true});
  for (const [route,page] of Object.entries(pages(config))) {
    await mkdir(`${output}/${route}`, {recursive:true});
    await writeFile(`${output}/${route}/index.html`, document(route,page,config));
    if (route === '404') await writeFile(`${output}/404.html`, document(route,page,config));
  }
  await build({entryPoints:['site/client.js'],bundle:true,format:'esm',target:['es2020'],outfile:`${output}/assets/pages.js`,minify:true,define:{__PUBLIC_CONFIG__:JSON.stringify({supabaseUrl:config.supabaseUrl,supabasePublishableKey:config.supabasePublishableKey,contactEmail:config.contactEmail,policyVersion:config.policyVersion,registrationReady:config.registrationReady})}});
}
