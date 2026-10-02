/**
 * cloudflare-os-lab — public explainer + isolated-state gadget
 * Canonical: https://os.rclabs.in
 */
const CORS={"access-control-allow-origin":"*","access-control-allow-methods":"GET, POST, OPTIONS","access-control-allow-headers":"content-type"};
const json=(d,s=200)=>new Response(JSON.stringify(d,null,2),{status:s,headers:{"content-type":"application/json;charset=utf-8",...CORS}});
const roomId=r=>{const s=String(r||"").trim().toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,32);return s||null};
const win=b=>{for(const [a,c,d] of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]])if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a];return b.every(Boolean)?"draw":null};

export class GadgetRoom{
  constructor(state,env){this.state=state;this.env=env;}
  async ensure(){
    let g=await this.state.storage.get("game");
    if(!g){g={board:Array(9).fill(null),turn:"X",winner:null,moves:0,updated_at:new Date().toISOString()};await this.state.storage.put("game",g);}
    return g;
  }
  async fetch(req){
    if(req.method==="OPTIONS")return new Response(null,{headers:CORS});
    if(req.method==="GET"){const g=await this.ensure();return json({ok:true,...g});}
    if(req.method!=="POST")return json({error:"GET or POST only"},405);
    let body={};try{body=await req.json();}catch{return json({error:"Invalid JSON"},400);}
    const action=body.action||"move";
    let g=await this.ensure();
    if(action==="reset"){
      g={board:Array(9).fill(null),turn:"X",winner:null,moves:0,updated_at:new Date().toISOString()};
      await this.state.storage.put("game",g);return json({ok:true,action:"reset",...g});
    }
    if(action==="move"){
      const cell=Number(body.cell);
      if(!Number.isInteger(cell)||cell<0||cell>8)return json({error:"cell must be 0..8"},400);
      if(g.winner)return json({error:"game over",...g},409);
      if(g.board[cell])return json({error:"cell taken",...g},409);
      g.board[cell]=g.turn;g.moves++;g.winner=win(g.board);if(!g.winner)g.turn=g.turn==="X"?"O":"X";
      g.updated_at=new Date().toISOString();await this.state.storage.put("game",g);
      return json({ok:true,action:"move",cell,...g});
    }
    return json({error:'action must be "move" or "reset"'},400);
  }
}

function stub(env,id){return env.GADGET.get(env.GADGET.idFromName(id));}

const HTML=`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cloudflare OS Lab — os.rclabs.in</title>
<style>
:root{--bg:#0b0d10;--p:#14181f;--p2:#1a2029;--bd:#2a3340;--t:#e8edf4;--m:#9aa7b8;--a:#f6821f;--b:#3b82f6;--ok:#34d399;--f:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--t);font:16px/1.5 var(--f)}
a{color:var(--b);text-decoration:none}a:hover{text-decoration:underline}
.w{max-width:980px;margin:0 auto;padding:2rem 1.25rem 4rem}
.ey{display:inline-block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--a);border:1px solid #5a3a16;background:#1a1208;padding:.25rem .55rem;border-radius:999px;margin-bottom:.75rem}
h1{font-size:clamp(1.55rem,3vw,2.05rem);line-height:1.2;margin:0 0 .75rem;font-weight:650}
.lede{color:var(--m);max-width:46rem;margin:0;font-size:1.05rem}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin:2rem 0}
@media(max-width:800px){.cards{grid-template-columns:1fr}}
.card{background:var(--p);border:1px solid var(--bd);border-radius:12px;padding:1.1rem}
.card h2{font-size:.95rem;margin:0 0 .4rem}.card p{margin:0;color:var(--m);font-size:.92rem}
.card code{font-family:var(--mono);font-size:.85em;color:#cbd5e1}
.g{background:var(--p);border:1px solid var(--bd);border-radius:12px;padding:1.25rem;margin:1.5rem 0}
.g h2{margin:0 0 .35rem;font-size:1.15rem}.hint{color:var(--m);font-size:.92rem;margin:0 0 1rem}
.rooms{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
@media(max-width:700px){.rooms{grid-template-columns:1fr}}
.room{background:var(--p2);border:1px solid var(--bd);border-radius:10px;padding:1rem}
.rh{display:flex;justify-content:space-between;gap:.5rem;margin-bottom:.75rem;flex-wrap:wrap;align-items:center}
.rid{font-family:var(--mono);font-size:.85rem;background:#0f1318;border:1px solid var(--bd);padding:.2rem .5rem;border-radius:6px;color:#cbd5e1}
.st{font-size:.85rem;color:var(--m)}.st.win{color:var(--ok)}
.board{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:210px;margin:0 auto .85rem}
.cell{aspect-ratio:1;border:1px solid var(--bd);background:#0f1318;color:var(--t);font-size:1.4rem;font-weight:650;border-radius:8px;cursor:pointer}
.cell:hover:not(:disabled){border-color:var(--a)}.cell:disabled{cursor:default}.cell.x{color:#60a5fa}.cell.o{color:#fbbf24}
.row{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center}
.btn{font:inherit;font-size:.85rem;border-radius:8px;border:1px solid var(--bd);background:#0f1318;color:var(--t);padding:.4rem .7rem;cursor:pointer}
.btn:hover{border-color:#4b5a6d}.btn.p{background:#1e2a1a;border-color:#3d5a2e;color:#b7f0a1}.btn.d{background:#2a1515;border-color:#5a2a2a;color:#fca5a5}
.gate{margin-top:1.25rem;padding-top:1rem;border-top:1px dashed var(--bd)}
.gate h3{margin:0 0 .4rem;font-size:.95rem}
.sim{display:flex;gap:.75rem;flex-wrap:wrap;align-items:flex-start;margin-top:.75rem}
.chip{font-family:var(--mono);font-size:.78rem;padding:.35rem .55rem;border-radius:6px;border:1px solid var(--bd);background:#0f1318;color:var(--m)}
.chip.on{border-color:#2f6b45;color:var(--ok);background:#0f1a14}
.note{margin:1.25rem 0;padding:.9rem 1rem;border-radius:12px;border:1px solid #3a3420;background:#16140c;color:#d6c98a;font-size:.92rem}
footer{margin-top:2rem;padding-top:1.25rem;border-top:1px solid var(--bd);color:var(--m);font-size:.9rem}
footer ul{list-style:none;padding:0;margin:.5rem 0 0;display:flex;flex-wrap:wrap;gap:.75rem 1.25rem}
.lat{font-family:var(--mono);font-size:.78rem;color:#7dd3fc}
.api{margin-top:1rem;background:#0f1318;border:1px solid var(--bd);border-radius:8px;padding:.75rem .9rem;font-family:var(--mono);font-size:.78rem;color:#cbd5e1;overflow-x:auto}
</style></head><body><div class="w">
<header>
<div class="ey">Public lab · rclabs.in</div>
<h1>Cloudflare OS, in practice</h1>
<p class="lede">Cloudflare OS is an agent workspace on Workers — sessions, files, gadgets, and blueprints — where each workspace is a Durable Object and gadgets run in isolated Dynamic Worker Facets. This public lab explains that model with a working isolated-state gadget. It is not a full company OS deploy.</p>
</header>
<div class="cards">
<article class="card"><h2>Workspace = Durable Object</h2><p>One DO instance holds session state for a workspace. Here each <code>room id</code> maps to its own DO via <code>idFromName</code> — durable, single-threaded coordination.</p></article>
<article class="card"><h2>Gadgets = isolated facets</h2><p>In the real OS, gadgets run in Dynamic Worker Facets (separate isolates). This lab approximates that with per-room DO state: mutating room A never touches room B.</p></article>
<article class="card"><h2>Gatekeepers = capabilities</h2><p>Access is capability-based, not ambient MCP. Gatekeepers introduce resources and can require human-in-the-loop for writes. The simulator below shows grant/deny outcomes only — no live credentials.</p></article>
</div>
<section class="g" aria-labelledby="gt">
<h2 id="gt">Playable gadget: isolated tic-tac-toe rooms</h2>
<p class="hint">Two room IDs, two Durable Object instances. Moves in one panel leave the other unchanged — that is the isolation claim.</p>
<div class="rooms">
<div class="room"><div class="rh"><span class="rid" id="idA">…</span><span class="st" id="stA">loading</span></div><div class="board" id="bdA"></div><div class="row"><button class="btn p" type="button" id="rfA">Refresh</button><button class="btn d" type="button" id="rsA">Reset</button><span class="lat" id="latA"></span></div></div>
<div class="room"><div class="rh"><span class="rid" id="idB">…</span><span class="st" id="stB">loading</span></div><div class="board" id="bdB"></div><div class="row"><button class="btn p" type="button" id="rfB">Refresh</button><button class="btn d" type="button" id="rsB">Reset</button><span class="lat" id="latB"></span></div></div>
</div>
<div class="gate">
<h3>Gatekeeper simulator (local only)</h3>
<p class="hint" style="margin:0">Outcome is simulated in-page — nothing leaves the browser. Start with no ambient access; grant a narrow capability with an explicit outcome.</p>
<div class="sim"><button class="btn" type="button" id="gk">Request write: room notes</button><span class="chip" id="gkC">capability: none</span><span class="chip" id="gkO">outcome: —</span></div>
</div>
<div class="api">POST /api/room → {"room":"optional-id"}<br>GET /api/room/:id<br>POST /api/room/:id → {"action":"move","cell":0..8} | {"action":"reset"}</div>
</section>
<div class="note"><strong>Honest scope:</strong> a full company Cloudflare OS deploy is separate — typically Cloudflare Access–gated, with AI Gateway for models. This hostname is a public explainer lab only. Site Ops binds <code>os.rclabs.in</code>; this Worker does not self-attach custom domains.</div>
<footer>
<div>Built for Chandrasekar · canonical <a href="https://os.rclabs.in">https://os.rclabs.in</a></div>
<ul>
<li><a href="https://os.cloudflare.app/">os.cloudflare.app</a></li>
<li><a href="https://github.com/cloudflare/cloudflare-os">github.com/cloudflare/cloudflare-os</a></li>
<li><a href="https://clef-kv.rclabs.in">clef-kv.rclabs.in</a></li>
<li><a href="https://clef-precheck.rclabs.in">clef-precheck.rclabs.in</a></li>
</ul>
</footer>
</div>
<script>
(function(){
const R={a:{id:null,S:"A"},b:{id:null,S:"B"}};
const rid=()=>"r-"+Math.random().toString(36).slice(2,10);
async function api(p,o){const t0=performance.now();const r=await fetch(p,o);const ms=Math.round(performance.now()-t0);return{res:r,data:await r.json(),ms};}
function paint(slot,g){
  const S=R[slot].S,bd=document.getElementById("bd"+S);bd.innerHTML="";
  (g.board||[]).forEach((v,i)=>{const b=document.createElement("button");b.type="button";b.className="cell"+(v==="X"?" x":v==="O"?" o":"");b.textContent=v||"";b.disabled=!!(v||g.winner);b.onclick=()=>move(slot,i);bd.appendChild(b);});
  const st=document.getElementById("st"+S);
  if(g.winner==="draw"){st.textContent="draw";st.className="st win";}
  else if(g.winner){st.textContent=g.winner+" wins";st.className="st win";}
  else{st.textContent="turn "+(g.turn||"?")+" · "+(g.moves||0)+" moves";st.className="st";}
}
async function load(slot){const id=R[slot].id;document.getElementById("id"+R[slot].S).textContent=id;const{data,ms,res}=await api("/api/room/"+encodeURIComponent(id));document.getElementById("lat"+R[slot].S).textContent=ms+" ms";if(!res.ok){document.getElementById("st"+R[slot].S).textContent=data.error||"error";return;}paint(slot,data);}
async function move(slot,cell){const id=R[slot].id;const{data,ms,res}=await api("/api/room/"+encodeURIComponent(id),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"move",cell})});document.getElementById("lat"+R[slot].S).textContent=ms+" ms";if(!res.ok&&!data.board){document.getElementById("st"+R[slot].S).textContent=data.error||"error";return;}paint(slot,data);}
async function reset(slot){const id=R[slot].id;const{data,ms}=await api("/api/room/"+encodeURIComponent(id),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"reset"})});document.getElementById("lat"+R[slot].S).textContent=ms+" ms";paint(slot,data);}
document.getElementById("rfA").onclick=()=>load("a");document.getElementById("rsA").onclick=()=>reset("a");
document.getElementById("rfB").onclick=()=>load("b");document.getElementById("rsB").onclick=()=>reset("b");
document.getElementById("gk").onclick=()=>{const ok=Math.random()>0.35;const c=document.getElementById("gkC"),o=document.getElementById("gkO");if(ok){c.textContent="capability: notes.write (scoped)";c.className="chip on";o.textContent="outcome: human approved · simulated write ok";o.className="chip on";}else{c.textContent="capability: none";c.className="chip";o.textContent="outcome: denied · no ambient access";o.className="chip";}};
(async()=>{
  const a=await api("/api/room",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({room:rid()})});
  const b=await api("/api/room",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({room:rid()})});
  R.a.id=a.data.room||a.data.room_id;R.b.id=b.data.room||b.data.room_id;
  document.getElementById("latA").textContent=a.ms+" ms create";document.getElementById("latB").textContent=b.ms+" ms create";
  paint("a",a.data);paint("b",b.data);
  document.getElementById("idA").textContent=R.a.id;document.getElementById("idB").textContent=R.b.id;
})();
})();
</script></body></html>`;

export default{async fetch(req,env){
  const url=new URL(req.url);const path=url.pathname.replace(/\/+$/,"")||"/";
  if(req.method==="OPTIONS")return new Response(null,{headers:CORS});
  if(path==="/api/health")return json({ok:true,worker:"cloudflare-os-lab",canonical:"https://os.rclabs.in",note:"Public lab. Full Cloudflare OS deploy is separate (Access + AI Gateway)."});
  const m=path.match(/^\/api\/room\/([a-z0-9_-]{1,32})$/i);
  if(m){
    const id=roomId(m[1]);if(!id)return json({error:"invalid room id"},400);
    const s=stub(env,id);
    return s.fetch(new Request("https://do/i?room="+id,{method:req.method,headers:req.headers,body:req.method==="POST"?await req.arrayBuffer():undefined}));
  }
  if(path==="/api/room"&&req.method==="POST"){
    let body={};try{body=await req.json();}catch{}
    const id=roomId(body.room)||("r-"+crypto.randomUUID().replace(/-/g,"").slice(0,10));
    const res=await stub(env,id).fetch(new Request("https://do/i?room="+id));
    const g=await res.json();
    return json({ok:true,room:id,created:true,...g,room_id:id});
  }
  if(path==="/api"||path==="/api/")return json({worker:"cloudflare-os-lab",canonical:"https://os.rclabs.in",endpoints:{"GET /":"HTML lab UI","GET /api/health":"liveness","POST /api/room":'{"room":"optional-id"}',"GET /api/room/:id":"state","POST /api/room/:id":'{"action":"move|reset"}'},proves:["Workspace-shaped DO holds gadget state","Room IDs isolated (separate DO instances)","Public lab — no Cloudflare Access"]});
  if(path!=="/"&&path!=="/index.html")return json({error:"not found",try:["/","/api","/api/health","/api/room/:id"]},404);
  return new Response(HTML,{headers:{"content-type":"text/html;charset=utf-8","cache-control":"public, max-age=60",...CORS}});
}};
