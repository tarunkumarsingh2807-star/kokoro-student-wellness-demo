import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataDir = join(root, 'data');
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(join(dataDir, 'kokoro-demo.sqlite'));
db.exec(`PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS clients (
 id INTEGER PRIMARY KEY, display_name TEXT NOT NULL, cohort TEXT NOT NULL,
 last_checkin TEXT NOT NULL, mood INTEGER NOT NULL CHECK(mood BETWEEN 1 AND 5),
 status TEXT NOT NULL, support_note TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS checkins (
 id INTEGER PRIMARY KEY, client_id INTEGER NOT NULL REFERENCES clients(id),
 mood INTEGER NOT NULL CHECK(mood BETWEEN 1 AND 5), note TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL
);`);
const count = db.prepare('SELECT COUNT(*) AS n FROM clients').get().n;
if (!count) {
  const add = db.prepare('INSERT INTO clients(display_name,cohort,last_checkin,mood,status,support_note,updated_at) VALUES(?,?,?,?,?,?,?)');
  const today = new Date().toISOString().slice(0,10);
  [['Aarav S.','Year 1',today,4,'Doing well','Prefers weekly check-ins'],['Mira R.','Year 2',today,3,'Check in soon','Asked for workload planning support'],['Dev K.','Year 3','2026-11-08',2,'Follow-up suggested','Requested a counsellor contact'],['Leela P.','Year 1','2026-11-09',5,'Doing well','No follow-up requested'],['Sam N.','Year 2','2026-11-07',3,'Check in soon','Try a smaller study goal']].forEach(row=>add.run(...row,new Date().toISOString()));
  const checkin = db.prepare('INSERT INTO checkins(client_id,mood,note,created_at) VALUES(?,?,?,?)');
  for (let id=1; id<=5; id++) for (let day=6; day>=0; day--) checkin.run(id, Math.max(1,Math.min(5,((id*3+day*2)%5)+1)), '', new Date(Date.now()-day*86400000).toISOString());
}
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const json = (res, code, data) => { res.writeHead(code, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'}); res.end(JSON.stringify(data)); };
const readBody = req => new Promise((resolve,reject)=>{ let raw=''; req.on('data',chunk=>raw+=chunk); req.on('end',()=>{try{resolve(JSON.parse(raw||'{}'))}catch{reject(new Error('Invalid JSON'))}}); req.on('error',reject); });
function responseFor(text) {
 const q=text.toLowerCase().replace(/[’]/g,"'").trim();
 const pick = items => items[Math.floor(Math.random()*items.length)];
 const has = pattern => pattern.test(q);
 if (/suicid|kill myself|self[- ]harm|hurt myself|don't want to live|end my life|want to die/.test(q)) return 'I’m really sorry this feels urgent. KOKORO can’t provide crisis care. Please contact your local emergency service now, or tell a trusted person nearby that you need immediate support. If you can, stay with someone while you get help.';
 if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(q)) return pick(['Hi! I’m here with you. What would you like help with today?','Hello. We can talk something through, make a small plan, or try a quick reset. What would be useful?','Hey, welcome back. What’s on your mind?']);
 if (/who are you|what are you|what can you do|how can you help/.test(q)) return 'I’m KOKORO, a wellbeing reflection demo. I can explain Kaizen-style small steps, help break down a task, suggest a short grounding pause, or help you reflect. I’m not a therapist or a medical service. What would you like to work on?';
 if (/what is kaizen|explain kaizen|define kaizen|meaning of kaizen/.test(q)) return pick(['Kaizen is a Japanese approach to continuous improvement through small, steady changes. Instead of waiting for a perfect plan, choose one manageable action, try it, and learn from the result. What is one area you’d like to improve?','Kaizen means making ongoing improvements by taking small steps and reflecting on what works. For example, review one page today, then adjust tomorrow based on how it went.']);
 if (/what is ikigai|explain ikigai|meaning of ikigai/.test(q)) return 'Ikigai is a Japanese idea often translated as a reason for being or a source of meaning in everyday life. You can reflect on what you enjoy, what matters to you, and how you want to contribute; it doesn’t need to be one grand life purpose. What gives you a little meaning this week?';
 if (/what is shinrin|forest bathing/.test(q)) return 'Shinrin-yoku, often called forest bathing, means spending attentive, unhurried time among trees or in nature. It is a mindful activity, not a medical treatment. If it feels safe, take a short walk and notice a few sounds, colors, or textures around you.';
 if (/what is kokoro|meaning of kokoro/.test(q)) return 'Kokoro is a Japanese word whose meaning can include heart, mind, or spirit, depending on context. In this project, KOKORO is the name of a student wellbeing and reflection demo.';
 if (/overwhelm|too much|can't cope|cannot cope|pressure|stressed|stress/.test(q)) return pick(['That sounds like a lot. A Kaizen approach is to write down what is pressing on you, circle just one item, and choose a two-minute starting action. What feels most urgent?','When everything feels urgent, try separating “must do today” from “can wait.” Pick one small step from the first list, then pause and reassess.','Let’s shrink the next step: take a comfortable breath, name the main thing on your mind, and decide what would count as a little progress in five minutes.']);
 if (/focus|concentrat|distract|procrastinat|can't start|cannot start/.test(q)) return pick(['Make starting easier: put your phone out of reach, open only the material you need, and work for five minutes. After that, decide whether to continue.','Try a short focus cycle: write one clear task, set a 10-minute timer, and note distractions to return to later. Which task will you start with?','For procrastination, make the first action almost too small to avoid—open the file, write a title, or read one paragraph.']);
 if (/study|exam|assignment|homework|project|workload|plan my|help me plan|schedule/.test(q)) return pick(['Here’s a simple plan: list the tasks, mark the one with the nearest deadline, then break it into steps that take 10–20 minutes. Start with the first step and include a short break. What deadline are you working toward?','For an assignment, try: 1) write the question in your own words, 2) create three headings, 3) add one note under the first heading. Which part can you do now?','Use a small improvement loop: plan one study block, do it, then reflect on what helped you focus. Keep the next block short enough to repeat.']);
 if (/sleep|tired|exhaust|rest|break/.test(q)) return pick(['A short pause may help: step away from the screen, stretch gently if comfortable, and drink some water. If tiredness keeps affecting you, consider talking with a trusted adult or health professional.','Rest supports steady progress. Could you take a brief break and choose one task that can wait until later?','Try a one-minute reset: relax your shoulders, breathe at a comfortable pace, and notice one sound around you.']);
 if (/anxious|anxiety|panic|nervous|worried|worry/.test(q)) return pick(['That sounds uncomfortable. Try grounding in the present: name five things you see, four things you feel, and three sounds you hear. If this is intense or keeps happening, reach out to a trusted person or qualified professional.','Let’s take one moment at a time. Put both feet somewhere comfortable and describe what is happening around you right now. You don’t have to solve everything immediately.','I can help with a small next step, but I can’t assess or diagnose anxiety. Would it help to talk through what triggered this or identify someone you trust to contact?']);
 if (/goal|habit|consistent|improve|routine|motivat/.test(q)) return pick(['Use a Kaizen loop: choose one tiny change, try it today, then reflect on what made it easier or harder. Make the step small enough to repeat tomorrow.','Attach a new habit to something you already do—for example, after breakfast, review one note. Start with a version that takes under five minutes.','Motivation can come and go, so reduce friction: prepare what you need, set a very small target, and count showing up as progress. What habit are you building?']);
 if (/sad|lonely|down|upset|unhappy|feel(ing)? (bad|low|empty)/.test(q)) return pick(['I’m sorry you’re feeling this way. You don’t need to fix it all at once. Would you like to tell me what has been weighing on you, or think of one person you could reach out to?','Thanks for telling me. It can help to name what you’re feeling and what you need right now—company, rest, practical help, or a chance to talk.','You deserve support. If you feel able, send someone you trust a simple message such as “I’m having a hard day—could we talk?”']);
 if (/how are you|how do you feel/.test(q)) return 'Thanks for asking. I don’t have feelings, but I’m ready to listen and help you think through a small next step. How are you doing today?';
 if (/thank(s| you)|appreciate/.test(q)) return pick(['You’re welcome. What’s one small thing you want to carry forward from this conversation?','I’m glad you reached out. Take it one step at a time.','You’re welcome. I’m here if you want to make a plan or reflect further.']);
 if (q.endsWith('?')) return pick([`I can help think this through. Based on what you asked, a useful Kaizen starting point is to choose one small action, try it, and notice what changes. Could you share a little more context so I can make the suggestion specific?`,`A good answer depends on your situation. We can break the question into a small next step: what outcome are you hoping for, and what have you tried so far?`,`I may not know every topic, but I can help you explore it. Tell me what matters most in this question, and we’ll work through one manageable step together.`]);
 return pick(['Thanks for sharing that. What part would you like help with—understanding it, making a plan, or choosing one small next step?','Let’s use a Kaizen reflection: what happened, what did you learn, and what is one small adjustment you might try next time?','I’m listening. Could you tell me a little more about what you need, and I’ll try to give a focused suggestion?']);
}
const server = createServer(async (req,res)=>{
 const url = new URL(req.url, 'http://localhost');
 try {
  if (url.pathname === '/api/health') return json(res,200,{ok:true,database:'SQLite',mode:'fictional demo records'});
  if (url.pathname === '/api/summary' && req.method==='GET') return json(res,200,{
   clients:db.prepare('SELECT COUNT(*) n FROM clients').get().n,
   checkins:db.prepare('SELECT COUNT(*) n FROM checkins').get().n,
   averageMood:Number(db.prepare('SELECT AVG(mood) n FROM checkins').get().n.toFixed(1)),
   followups:db.prepare("SELECT COUNT(*) n FROM clients WHERE status <> 'Doing well'").get().n,
   weekly:db.prepare('SELECT date(created_at) day, ROUND(AVG(mood),1) mood FROM checkins WHERE created_at >= datetime(\'now\',\'-6 days\') GROUP BY date(created_at) ORDER BY day').all()
  });
  if (url.pathname === '/api/clients' && req.method==='GET') return json(res,200,db.prepare('SELECT id,display_name,cohort,last_checkin,mood,status,support_note,updated_at FROM clients ORDER BY id').all());
  const clientMatch=url.pathname.match(/^\/api\/clients\/(\d+)$/);
  if (clientMatch && req.method==='PATCH') {
   const body=await readBody(req); const status=String(body.status||'').slice(0,40); const note=String(body.support_note||'').slice(0,240);
   if(!['Doing well','Check in soon','Follow-up suggested'].includes(status)) return json(res,400,{error:'Choose a listed follow-up status.'});
   const result=db.prepare('UPDATE clients SET status=?,support_note=?,updated_at=? WHERE id=?').run(status,note,new Date().toISOString(),Number(clientMatch[1]));
   if(!result.changes) return json(res,404,{error:'Client not found.'});
   return json(res,200,{ok:true});
  }
  if(url.pathname==='/api/chat' && req.method==='POST') { const body=await readBody(req); const question=String(body.message||'').trim().slice(0,1200); if(!question) return json(res,400,{error:'Enter a question.'}); return json(res,200,{reply:responseFor(question),mode:'Kaizen demo assistant'}); }
  if(url.pathname.startsWith('/api/')) return json(res,404,{error:'Not found'});
  const requested=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
  const file=normalize(join(root,requested)); if(!file.startsWith(root) || !existsSync(file)) return json(res,404,{error:'Not found'});
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'}); createReadStream(file).pipe(res);
 } catch(error) { json(res,400,{error:error.message||'Request failed'}); }
});
const port=Number(process.env.PORT||4173);
server.listen(port,'127.0.0.1',()=>console.log(`KOKORO demo ready at http://127.0.0.1:${port}`));
