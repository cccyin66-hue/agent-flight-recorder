import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {keypair,fresh,advance,packet} from './lib.mjs';
const dataDir=process.env.DATA_DIR||'data';
const production=process.env.NODE_ENV==='production';
fs.mkdirSync(dataDir,{recursive:true});const db=new DatabaseSync(path.join(dataDir,'blackbox.db'));
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS kv (id TEXT PRIMARY KEY, value TEXT NOT NULL)');
const get=id=>{const r=db.prepare('SELECT value FROM kv WHERE id=?').get(id);return r?JSON.parse(r.value):null};
const put=(id,v)=>db.prepare('INSERT OR REPLACE INTO kv VALUES (?,?)').run(id,JSON.stringify(v));
const keys=get('keys')||keypair();put('keys',keys);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
 if(url.pathname==='/healthz'){res.setHeader('Content-Type','application/json');return res.end('{"status":"ok"}')}
 if(req.method==='POST'&&req.headers.origin){const origin=new URL(req.headers.origin);const matches=process.env.PUBLIC_ORIGIN?origin.origin===process.env.PUBLIC_ORIGIN:origin.host===req.headers.host&&['http:','https:'].includes(origin.protocol);if(!matches)throw Error('Origin rejected')}
 if(url.pathname.startsWith('/api/')){
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  let sid=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('bb_session='))?.slice(11);
  if(!sid||!/^\w{64}$/.test(sid)||!get('session:'+sid)){sid=randomBytes(32).toString('hex');put('session:'+sid,fresh());res.setHeader('Set-Cookie',`bb_session=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${production?'; Secure':''}`)}
  const sessionKey='session:'+sid;
  if(req.method==='GET'&&url.pathname==='/api/state')return res.end(JSON.stringify(get(sessionKey)));
  if(req.method==='GET'&&url.pathname==='/api/packet'){res.setHeader('Content-Disposition','attachment; filename="claim-packet.json"');return res.end(JSON.stringify(packet(get(sessionKey),keys),null,2))}
  if(req.method!=='POST')throw Error('Unknown API');let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>10000)throw Error('Request too large')}
  const body=JSON.parse(raw||'{}');let s=get(sessionKey);
  if(url.pathname==='/api/reset'){if(!['attack','normal','authorized'].includes(body.scenario))throw Error('Unknown scenario');s=fresh(body.scenario)}
  else if(url.pathname==='/api/action')s=advance(s,body.action,body,keys);else throw Error('Unknown API');
  put(sessionKey,s);return res.end(JSON.stringify(s));
 }
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
 const file=url.pathname==='/verifier'?'/verifier.html':url.pathname==='/'?'/index.html':url.pathname;
 const target=path.resolve('public','.'+decodeURIComponent(file));
 if(!target.startsWith(path.resolve('public')+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);return res.end('Not found')}
 res.setHeader('Content-Type',mime[path.extname(target)]||'application/octet-stream');if(req.method==='HEAD')return res.end();res.end(fs.readFileSync(target));
}catch(e){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.message}))}});
server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('BLACK BOX running on port '+(process.env.PORT||3000)));
function stop(){server.close(()=>{db.close();process.exit(0)})}process.on('SIGTERM',stop);process.on('SIGINT',stop);
