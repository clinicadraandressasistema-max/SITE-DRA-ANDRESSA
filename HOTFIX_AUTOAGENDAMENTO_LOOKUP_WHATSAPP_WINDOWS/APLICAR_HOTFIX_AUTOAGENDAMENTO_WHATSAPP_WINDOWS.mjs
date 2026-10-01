import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SITE = "C:\\Projetos\\SITE-DRA-ANDRESSA";
const SISTEMA = "C:\\Projetos\\SISTEMA-DRA-ANDRESSA";
const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

function fail(msg){ console.error("\nERRO:", msg); process.exit(1); }
function ok(msg){ console.log("OK -", msg); }
function run(cmd,args,cwd){
  console.log("\n>",cmd,...args);
  const r=spawnSync(cmd,args,{cwd,stdio:"inherit",shell:false});
  if(r.status!==0) fail(`${cmd} falhou com código ${r.status}`);
}
function copy(src,dst){ fs.mkdirSync(path.dirname(dst),{recursive:true}); fs.copyFileSync(src,dst); }

const required=[
  path.join(SITE,"package.json"),
  path.join(SITE,"src","pages","Booking.tsx"),
  path.join(SISTEMA,"supabase","functions","public-booking","index.ts"),
];
for(const p of required) if(!fs.existsSync(p)) fail(`arquivo obrigatório não encontrado: ${p}`);

const backup=path.join("C:\\Projetos",`BACKUP_HOTFIX_AUTOAGENDAMENTO_${stamp}`);
copy(path.join(SITE,"src","pages","Booking.tsx"),path.join(backup,"site","src","pages","Booking.tsx"));
const waComp=path.join(SITE,"src","components","WhatsAppButton.tsx");
if(fs.existsSync(waComp)) copy(waComp,path.join(backup,"site","src","components","WhatsAppButton.tsx"));
copy(path.join(SISTEMA,"supabase","functions","public-booking","index.ts"),path.join(backup,"sistema","supabase","functions","public-booking","index.ts"));
console.log("Backup:",backup);

function walk(dir,out=[]){
  if(!fs.existsSync(dir)) return out;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()){
      if(!["node_modules","dist",".git",".wrangler"].includes(e.name)) walk(p,out);
    }else if(/\.(tsx?|jsx?|json|txt|md)$/i.test(e.name)||e.name.startsWith(".env")) out.push(p);
  }
  return out;
}
const scan=[
  path.join(SITE,".env.local"),
  path.join(SITE,".env"),
  path.join(SITE,"src","data","site.ts"),
  path.join(SITE,"src","components","WhatsAppButton.tsx"),
  path.join(SITE,"src","pages","Booking.tsx"),
  ...walk(path.join(SITE,"src"))
].filter((v,i,a)=>a.indexOf(v)===i&&fs.existsSync(v));

let whatsapp="";
for(const file of scan){
  let t=""; try{t=fs.readFileSync(file,"utf8")}catch{continue}
  const regs=[
    /wa\.me\/(\d{10,15})/i,
    /api\.whatsapp\.com\/send\?phone=(\d{10,15})/i,
    /VITE_WHATSAPP_(?:NUMBER|PHONE)\s*=\s*["']?(\d{10,15})/i,
    /whatsapp[^0-9\r\n]{0,80}(\+?55[\s().-]*\d{2}[\s().-]*\d{4,5}[\s.-]*\d{4})/i,
  ];
  for(const rr of regs){
    const m=t.match(rr);
    if(m){
      let d=m[1].replace(/\D/g,"");
      if(d.length>=10&&d.length<=15){ whatsapp=d.startsWith("55")?d:`55${d}`; break; }
    }
  }
  if(whatsapp) break;
}
if(!whatsapp){
  console.error("\nNÃO ENCONTREI O NÚMERO DE WHATSAPP JÁ CONFIGURADO NO SITE.");
  console.error("Adicione VITE_WHATSAPP_NUMBER=55DDDNÚMERO no .env.local e rode novamente.");
  process.exit(2);
}
ok(`WhatsApp localizado: final ${whatsapp.slice(-4)}`);

// Botão flutuante: link externo absoluto, nunca rota interna.
const comp=`import { MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '${whatsapp}'
const WHATSAPP_URL = \`https://wa.me/\${WHATSAPP_NUMBER}?text=\${encodeURIComponent(
  'Olá! Vim pelo site da Dra. Andressa e gostaria de falar com a equipe.',
)}\`

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Clínica Dra. Andressa no WhatsApp"
      onClick={(event) => event.stopPropagation()}
      style={{
        position:'fixed',right:22,bottom:22,zIndex:9999,display:'flex',
        alignItems:'center',gap:14,minWidth:310,maxWidth:'calc(100vw - 32px)',
        padding:'15px 22px 15px 15px',borderRadius:999,
        background:'rgba(255,255,255,.97)',color:'#71122A',
        border:'1px solid rgba(113,18,42,.16)',
        boxShadow:'0 18px 55px rgba(36,8,15,.18)',textDecoration:'none',
        backdropFilter:'blur(12px)'
      }}
    >
      <span style={{width:50,height:50,borderRadius:'50%',display:'grid',placeItems:'center',flex:'0 0 auto',background:'#71122A',color:'#fff'}}>
        <MessageCircle size={24}/>
      </span>
      <span style={{display:'grid',lineHeight:1.1}}>
        <strong style={{fontSize:18}}>Chame a gente agora!</strong>
        <span style={{marginTop:5,fontSize:14,fontWeight:700,color:'#5f5558'}}>Atendimento rápido no WhatsApp</span>
      </span>
    </a>
  )
}
`;
fs.mkdirSync(path.dirname(waComp),{recursive:true});
fs.writeFileSync(waComp,comp,"utf8");
ok("botão flutuante do WhatsApp corrigido");

// Corrige whatsappHelp() preservando o restante da tela.
let booking=fs.readFileSync(path.join(SITE,"src","pages","Booking.tsx"),"utf8");
const helpBody=`{
  return \`https://wa.me/${whatsapp}?text=\${encodeURIComponent(
    'Olá! Estou no site da Dra. Andressa e preciso de ajuda para localizar ou conferir meu agendamento.',
  )}\`
}`;

function replaceFunctionBody(src,name,body){
  const regs=[
    new RegExp(`function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`),
    new RegExp(`const\\s+${name}\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{`)
  ];
  let m=null; for(const rr of regs){m=rr.exec(src); if(m)break}
  if(!m) return [src,false];
  const open=m.index+m[0].lastIndexOf("{");
  let depth=0,quote=null,esc=false;
  for(let i=open;i<src.length;i++){
    const ch=src[i];
    if(quote){
      if(esc)esc=false; else if(ch==="\\")esc=true; else if(ch===quote)quote=null;
      continue;
    }
    if(ch==="'"||ch==='"'||ch==="`"){quote=ch;continue}
    if(ch==="{")depth++;
    if(ch==="}"&&--depth===0) return [src.slice(0,open)+body+src.slice(i+1),true];
  }
  return [src,false];
}
let changed=false;
[booking,changed]=replaceFunctionBody(booking,"whatsappHelp",helpBody);
if(!changed){
  const old="href={whatsappHelp()}";
  if(booking.includes(old)){
    const c=`const SUPPORT_WHATSAPP_URL = \`https://wa.me/${whatsapp}?text=\${encodeURIComponent('Olá! Estou no site da Dra. Andressa e preciso de ajuda com meu agendamento.')}\`\n\n`;
    if(!booking.includes("SUPPORT_WHATSAPP_URL")){
      const marker="type AnyRecord = Record<string, unknown>";
      booking=booking.includes(marker)?booking.replace(marker,c+marker):c+booking;
    }
    booking=booking.replaceAll(old,"href={SUPPORT_WHATSAPP_URL}");
    changed=true;
  }
}
if(changed){fs.writeFileSync(path.join(SITE,"src","pages","Booking.tsx"),booking,"utf8");ok("botão de ajuda do autoagendamento corrigido")}
else console.warn("AVISO - não localizei whatsappHelp()/href esperado; botão flutuante foi corrigido.");

// Backend: adiciona consulta por CPF+telefone ou protocolo+telefone.
const pbFile=path.join(SISTEMA,"supabase","functions","public-booking","index.ts");
let pb=fs.readFileSync(pbFile,"utf8");
if(!pb.includes("HOTFIX_LOOKUP_BOOKING_V1")){
  const marker=/^([ \t]*)return\s+json\(\{\s*error:\s*['"]Ação inválida\.['"]\s*\},\s*400\s*\)/m;
  const m=marker.exec(pb);
  if(!m) fail("não encontrei o retorno Ação inválida em public-booking/index.ts");
  const I=m[1]||"    ";
  const B=`
${I}// HOTFIX_LOOKUP_BOOKING_V1
${I}if (['manage_booking','lookup','lookup_booking','find_booking'].includes(action)) {
${I}  const digits = (value: unknown) => String(value ?? '').replace(/\\D/g, '')
${I}  const phone = digits(body.phone)
${I}  const cpf = digits(body.cpf)
${I}  const protocol = String(body.protocol || body.reference || '').trim()
${I}  if (phone.length < 8 || (!cpf && !protocol)) return json({ error:'Informe o telefone e também o CPF ou protocolo.' },400)

${I}  let patient:any = null
${I}  let patientId = ''
${I}  if (cpf) {
${I}    const { data:candidates,error:pe } = await admin.from('patients').select('id,full_name,cpf,phone,whatsapp').limit(2000)
${I}    if (pe) throw pe
${I}    patient = (candidates ?? []).find((p:any) => {
${I}      const phones=[digits(p.phone),digits(p.whatsapp)].filter(Boolean)
${I}      return digits(p.cpf)===cpf && phones.includes(phone)
${I}    }) ?? null
${I}    if (!patient) return json({ error:'Não encontrei um agendamento com esses dados.' },404)
${I}    patientId=String(patient.id)
${I}  }

${I}  let q=admin.from('appointments')
${I}    .select('id,patient_id,provider_id,service_id,location_id,public_reference,status,start_at,end_at,appointment_type,source')
${I}    .order('start_at',{ascending:false}).limit(100)
${I}  if (patientId) q=q.eq('patient_id',patientId)
${I}  if (protocol) q=q.eq('public_reference',protocol)
${I}  const {data:rowsData,error:ae}=await q
${I}  if (ae) throw ae
${I}  const rows=rowsData ?? []
${I}  let appointment:any=null
${I}  if(protocol) appointment=rows[0] ?? null
${I}  else {
${I}    const active=rows.filter((a:any)=>String(a.status)!=='cancelado')
${I}    const future=active.filter((a:any)=>new Date(a.start_at).getTime()>=Date.now())
${I}      .sort((a:any,b:any)=>new Date(a.start_at).getTime()-new Date(b.start_at).getTime())
${I}    appointment=future[0] ?? active[0] ?? null
${I}  }
${I}  if(!appointment) return json({ error:'Não encontrei um agendamento com esses dados.' },404)

${I}  if(!patient){
${I}    const {data:p,error:ppe}=await admin.from('patients').select('id,full_name,cpf,phone,whatsapp').eq('id',appointment.patient_id).maybeSingle()
${I}    if(ppe) throw ppe
${I}    if(!p) return json({ error:'Não encontrei um agendamento com esses dados.' },404)
${I}    const phones=[digits(p.phone),digits(p.whatsapp)].filter(Boolean)
${I}    if(!phones.includes(phone) || (cpf && digits(p.cpf)!==cpf)) return json({ error:'Não encontrei um agendamento com esses dados.' },404)
${I}    patient=p
${I}  }

${I}  async function one(table:string,id:unknown){
${I}    if(!id) return null
${I}    const {data,error}=await admin.from(table).select('*').eq('id',String(id)).maybeSingle()
${I}    if(error) throw error
${I}    return data as any
${I}  }
${I}  const [service,provider,location,settingsRes]=await Promise.all([
${I}    one('services',appointment.service_id),
${I}    one('profiles',appointment.provider_id),
${I}    one('clinic_locations',appointment.location_id),
${I}    admin.from('public_booking_settings').select('*').eq('settings_key','main').maybeSingle()
${I}  ])
${I}  if(settingsRes.error) throw settingsRes.error
${I}  const rawToken=makeToken()
${I}  const tokenHash=await sha256(rawToken)
${I}  const days=Math.max(1,Number((settingsRes.data as any)?.token_valid_days || 30))
${I}  const expiresAt=new Date(Date.now()+days*86400000).toISOString()
${I}  const {error:te}=await admin.from('public_booking_tokens').upsert({
${I}    appointment_id:appointment.id,token_hash:tokenHash,expires_at:expiresAt,revoked_at:null,last_used_at:new Date().toISOString()
${I}  },{onConflict:'appointment_id'})
${I}  if(te) throw te

${I}  const serviceName=(service as any)?.public_name || (service as any)?.display_name || (service as any)?.name || 'Atendimento'
${I}  const providerName=(provider as any)?.full_name || (provider as any)?.name || 'Profissional'
${I}  const locationName=(location as any)?.public_name || (location as any)?.display_name || (location as any)?.name || (location as any)?.address || 'Clínica Dra. Andressa'
${I}  const receipt={
${I}    id:appointment.id,reference:appointment.public_reference || appointment.id,protocol:appointment.public_reference || appointment.id,
${I}    status:appointment.status,start_at:appointment.start_at,end_at:appointment.end_at,appointment_type:appointment.appointment_type,source:appointment.source,
${I}    patient_id:appointment.patient_id,patient_name:patient?.full_name || 'Paciente',full_name:patient?.full_name || 'Paciente',
${I}    service_id:appointment.service_id,provider_id:appointment.provider_id,location_id:appointment.location_id,
${I}    service:serviceName,service_name:serviceName,provider:providerName,provider_name:providerName,location:locationName,location_name:locationName,
${I}    confirmation_message:'Agendamento localizado com segurança.'
${I}  }
${I}  return json({ok:true,receipt,booking:receipt,appointment:receipt,bookings:[receipt],data:receipt,token:rawToken,management_token:rawToken})
${I}}

`;
  pb=pb.slice(0,m.index)+B+pb.slice(m.index);
  fs.writeFileSync(pbFile,pb,"utf8");
  ok("consulta de agendamento adicionada ao public-booking");
}else ok("consulta de agendamento já estava instalada");

const npm=process.platform==="win32"?"npm.cmd":"npm";
const npx=process.platform==="win32"?"npx.cmd":"npx";
run(npm,["run","build"],SITE);
ok("build do site");
run(npx,["supabase","functions","deploy","public-booking","--no-verify-jwt"],SISTEMA);
ok("Edge Function public-booking publicada");

const pkg=JSON.parse(fs.readFileSync(path.join(SITE,"package.json"),"utf8"));
if(pkg.scripts?.deploy){run(npm,["run","deploy"],SITE);ok("site publicado")}
else console.warn("AVISO - package.json sem script deploy; publique com o comando Cloudflare que você já usa.");

console.log("\n============================================================");
console.log("HOTFIX CONCLUÍDO");
console.log("Teste com Ctrl+F5:");
console.log("- Já tenho agendamento -> CPF + telefone");
console.log("- botão flutuante do WhatsApp");
console.log("- Não encontrei / preciso de ajuda");
console.log("Backup:",backup);
console.log("============================================================");
