#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { image: { type: "string", default: "chess-tabiya-server:dev" } } });
const name = `tabiya-engine-memory-${randomUUID()}`;
const script = `
import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
const children=[];
function sample(label){return {label,current:Number(readFileSync('/sys/fs/cgroup/memory.current','utf8')),peak:Number(readFileSync('/sys/fs/cgroup/memory.peak','utf8')),processes:children.map(c=>({pid:c.pid,status:readFileSync('/proc/'+c.pid+'/status','utf8').split('\\n').filter(l=>/^VmRSS:|^RssAnon:|^RssFile:/.test(l))}))};}
async function start(){const c=spawn('/usr/games/stockfish',[],{stdio:['pipe','pipe','pipe']});children.push(c);const lines=createInterface({input:c.stdout}); await new Promise((done,reject)=>{const t=setTimeout(()=>reject(new Error('real UCI readiness timed out')),20000); c.once('error',reject); c.once('exit',code=>reject(new Error('engine exited '+code)));lines.on('line',l=>{if(l==='uciok')c.stdin.write('setoption name Threads value 1\\nsetoption name Hash value 16\\nisready\\n');if(l==='readyok'){clearTimeout(t);done();}});c.stdin.write('uci\\n');});}
const rows=[sample('node-only')];
try{await start();rows.push(sample('one-stockfish-ready'));await start();rows.push(sample('two-stockfish-ready'));console.log(JSON.stringify(rows));}finally{await Promise.all(children.map(c=>new Promise(done=>{c.once('exit',done);c.stdin.write('quit\\n');})));}
`;
try {
  const result = spawnSync("docker", ["run", "--rm", "--name", name, "--network", "none", "--memory", "2g", "--memory-swap", "2g", "--entrypoint", "node", values.image, "--input-type=module", "-e", script], { encoding: "utf8", timeout: 90_000 });
  if (result.status !== 0) throw new Error(result.error?.message ?? result.stderr);
  const measurements = JSON.parse(result.stdout);
  mkdirSync(".cache/deploy", { recursive: true });
  writeFileSync(".cache/deploy/engine-memory-diagnostic.json", JSON.stringify({ scope: "diagnosis, not a release envelope", image: values.image, measurements }, null, 2) + "\n");
  console.log(JSON.stringify(measurements, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { spawnSync("docker", ["rm", "--force", name], { stdio: "ignore" }); }
