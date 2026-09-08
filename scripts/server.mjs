import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const assets = new Set(['index.html','styles.css','pages.css','app.js','water.js','globe.js','globe-land.js']);
const routes = new Set(['login','signup','forgot-password','reset-password','auth/callback','account','terms','privacy','cookies','acceptable-use','contact']);
export function createSiteServer({root = '.', generated = '.generated'} = {}) {
  return http.createServer(async (req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Cache-Control','no-store');
    const notFound = async () => {
      const body = await readFile(resolve(generated,'404.html')).catch(() => 'Page not found');
      res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'});
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405,{Allow:'GET, HEAD'}); res.end('Method not allowed'); return; }
    try {
      const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const clean = pathname.replace(/^\//,'').replace(/\/$/,'');
      let file;
      if (routes.has(clean)) {
        if (!pathname.endsWith('/')) { res.writeHead(308,{Location:`/${clean}/${new URL(req.url,'http://localhost').search}`}); res.end(); return; }
        file = resolve(generated,clean,'index.html');
      } else if (clean === 'assets/pages.js') file = resolve(generated,clean);
      else if (assets.has(clean || 'index.html')) file = resolve(root,clean || 'index.html');
      else { await notFound(); return; }
      const content = await readFile(file);
      res.writeHead(200, {'Content-Type': ({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'})[extname(file)] || 'application/octet-stream'});
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch { await notFound(); }
  });
}
