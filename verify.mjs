import fs from 'node:fs';
import {verifyPacket} from './lib.mjs';
const [file,trust]=process.argv.slice(2);
if(!file){console.error('Usage: node verify.mjs claim-packet.json [trusted-public-key.pem]');process.exit(2)}
try{if(fs.statSync(file).size>2*1024*1024)throw Error('Packet exceeds 2 MB');const p=JSON.parse(fs.readFileSync(file,'utf8'));const result=verifyPacket(p,trust?fs.readFileSync(trust,'utf8'):undefined);console.log(JSON.stringify(result,null,2));process.exitCode=result.overall==='Fail'?1:result.overall==='Unknown'?2:0;}catch(e){console.error(e.message);process.exitCode=1}
