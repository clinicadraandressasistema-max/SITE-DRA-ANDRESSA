const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const PUBLISH = process.argv.includes('--publish');
const stamp = new Date().toISOString().replace(/[:.]/g,'-');
const BACKUP = path.join(ROOT, `.backup-v47-0-${stamp}`);
const changed = new Set();
let dbApplied = false;

function abs(rel){ return path.join(ROOT, rel); }
function exists(rel){ return fs.existsSync(abs(rel)); }
function read(rel){ return fs.readFileSync(abs(rel),'utf8').replace(/\r\n/g,'\n'); }

function backup(rel){
  if(!exists(rel)) return;
  const dst = path.join(BACKUP, rel);
  fs.mkdirSync(path.dirname(dst), {recursive:true});
  fs.copyFileSync(abs(rel), dst);
}

function write(rel, content){
  if(exists(rel)) backup(rel);
  fs.mkdirSync(path.dirname(abs(rel)), {recursive:true});
  fs.writeFileSync(abs(rel), content.replace(/\r?\n/g,'\n'), 'utf8');
  changed.add(rel);
  console.log('OK   ', rel);
}

function patch(rel, fn){
  if(!exists(rel)) throw new Error('Arquivo não encontrado: ' + rel);
  backup(rel);
  const before = read(rel);
  const after = fn(before);
  if(after === before){
    console.log('SEM ALTERAÇÃO', rel);
    return;
  }
  fs.writeFileSync(abs(rel), after, 'utf8');
  changed.add(rel);
  console.log('PATCH', rel);
}

function rollback(){
  for(const rel of changed){
    const src = path.join(BACKUP, rel);
    const dst = abs(rel);
    if(fs.existsSync(src)){
      fs.mkdirSync(path.dirname(dst), {recursive:true});
      fs.copyFileSync(src, dst);
    }else if(fs.existsSync(dst)){
      fs.rmSync(dst,{force:true});
    }
  }
}

function run(cmd,args,label){
  console.log('\n=== ' + label + ' ===');
  const r = spawnSync(cmd,args,{
    cwd:ROOT,
    stdio:'inherit',
    shell:process.platform==='win32',
    windowsHide:true
  });
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error(label + ' falhou com código ' + r.status);
}

function publishCloudflare(){
  const wranglerPath = abs('wrangler.jsonc');
  if(!fs.existsSync(wranglerPath)){
    throw new Error('wrangler.jsonc não encontrado.');
  }
  const wrangler = fs.readFileSync(wranglerPath,'utf8');
  const nameMatch = wrangler.match(/"name"\s*:\s*"([^"]+)"/);
  const projectName = nameMatch ? nameMatch[1] : '';

  if(/pages_build_output_dir/.test(wrangler)){
    if(!projectName) throw new Error('Nome do projeto Cloudflare Pages não encontrado.');
    run('npx',['wrangler','pages','deploy','dist','--project-name',projectName],'PUBLICAÇÃO CLOUDFLARE PAGES');
  }else{
    run('npx',['wrangler','deploy'],'PUBLICAÇÃO CLOUDFLARE');
  }
}

try{
  console.log('\n======================================================================');
  console.log(' DALLARMI V47.0 | PERFIL DE ASSINATURA DOS MÉDICOS');
  console.log('======================================================================');

  if(!exists('package.json')){
    throw new Error('Execute este arquivo em C:\\Projetos\\SISTEMA-DRA-ANDRESSA');
  }

  const pkg = JSON.parse(read('package.json'));
  if(pkg.name !== 'sistema-dra-andressa'){
    throw new Error('Projeto incorreto. package.json esperado: sistema-dra-andressa');
  }

  if(!exists('src/pages/MedicalTeamV38.tsx')){
    throw new Error('MedicalTeamV38.tsx não encontrado.');
  }

  if(!exists('src/components/DocumentControlV45.tsx')){
    throw new Error('DocumentControlV45.tsx não encontrado.');
  }

  fs.mkdirSync(BACKUP,{recursive:true});
  console.log('Backup:',BACKUP);
  console.log(PUBLISH?'MODO: APLICAR E PUBLICAR':'MODO: SOMENTE BUILD');

  write(
    'supabase/migrations/20261001230000_doctor_signature_profile_v47.sql',
String.raw`begin;

alter table public.doctor_icp_profiles_v45
  add column if not exists certificate_type text;

update public.doctor_icp_profiles_v45
   set certificate_type='none'
 where certificate_type is null;

alter table public.doctor_icp_profiles_v45
  alter column certificate_type set default 'none';

alter table public.doctor_icp_profiles_v45
  alter column certificate_type set not null;

do $$
begin
  if not exists(
    select 1
      from pg_constraint
     where conname='doctor_icp_profiles_v45_certificate_type_chk'
  ) then
    alter table public.doctor_icp_profiles_v45
      add constraint doctor_icp_profiles_v45_certificate_type_chk
      check(certificate_type in('none','a1','a3','cloud'));
  end if;
end
$$;

create or replace function public.v47_save_doctor_signature_profile(
  p_doctor uuid,
  p_certificate_type text,
  p_provider text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_type text := lower(trim(coalesce(p_certificate_type,'none')));
  v_provider text := nullif(trim(coalesce(p_provider,'')),'');
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not coalesce(public.v38_is_manager(),false) then
    raise exception 'Somente administrador pode configurar assinatura digital do profissional.';
  end if;

  if not exists(
    select 1 from public.doctor_profiles_v38
     where id=p_doctor
  ) then
    raise exception 'Profissional não encontrado.';
  end if;

  if v_type not in('none','a1','a3','cloud') then
    raise exception 'Tipo de certificado inválido.';
  end if;

  if v_type='none' then
    v_status := 'not_configured';
    v_provider := null;
  else
    v_status := 'pending';
  end if;

  insert into public.doctor_icp_profiles_v45(
    doctor_profile_id,
    provider,
    certificate_type,
    certificate_status,
    active,
    updated_at
  )
  values(
    p_doctor,
    v_provider,
    v_type,
    v_status,
    v_type<>'none',
    now()
  )
  on conflict(doctor_profile_id)
  do update set
    provider=excluded.provider,
    certificate_type=excluded.certificate_type,
    certificate_status=excluded.certificate_status,
    active=excluded.active,
    updated_at=now();

  return jsonb_build_object(
    'ok',true,
    'doctor_profile_id',p_doctor,
    'certificate_type',v_type,
    'provider',v_provider,
    'configured',v_type<>'none',
    'certificate_status',v_status
  );
end
$$;

revoke all on function public.v47_save_doctor_signature_profile(uuid,text,text) from public;
grant execute on function public.v47_save_doctor_signature_profile(uuid,text,text) to authenticated;

create or replace function public.v47_get_doctor_signature_capability(p_doctor uuid)
returns jsonb
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select jsonb_build_object(
    'configured',
      coalesce(i.certificate_type,'none') <> 'none'
      and coalesce(i.active,false),
    'certificate_type',coalesce(i.certificate_type,'none'),
    'provider',i.provider,
    'certificate_status',coalesce(i.certificate_status,'not_configured'),
    'remote_candidate',
      coalesce(i.certificate_type,'none')='cloud'
      and nullif(trim(coalesce(i.provider,'')),'') is not null
  )
  from (select 1) x
  left join public.doctor_icp_profiles_v45 i
    on i.doctor_profile_id=p_doctor
  limit 1
$$;

revoke all on function public.v47_get_doctor_signature_capability(uuid) from public;
grant execute on function public.v47_get_doctor_signature_capability(uuid) to authenticated;

commit;
`);

  write(
    'src/components/DoctorSignatureSettingsV47.tsx',
String.raw`import{useEffect,useState}from'react'
import{Save,ShieldCheck}from'lucide-react'
import{supabase}from'../lib/supabase'

type Props={doctor:any}
type CertType='none'|'a1'|'a3'|'cloud'

const labels:Record<CertType,string>={
  none:'Não possui / assinatura manual',
  a1:'ICP-Brasil A1',
  a3:'ICP-Brasil A3 / token ou cartão',
  cloud:'ICP-Brasil em nuvem'
}

export default function DoctorSignatureSettingsV47({doctor}:Props){
  const[type,setType]=useState<CertType>('none')
  const[provider,setProvider]=useState('')
  const[loading,setLoading]=useState(true)
  const[saving,setSaving]=useState(false)
  const[message,setMessage]=useState('')

  async function load(){
    if(!doctor?.id)return
    setLoading(true)
    setMessage('')
    const{data,error}=await supabase.rpc('v47_get_doctor_signature_capability',{
      p_doctor:doctor.id
    })
    setLoading(false)
    if(error){
      setMessage(error.message)
      return
    }
    setType((data?.certificate_type||'none') as CertType)
    setProvider(data?.provider||'')
  }

  useEffect(()=>{void load()},[doctor?.id])

  async function save(){
    if(!doctor?.id)return
    setSaving(true)
    setMessage('')
    const{data,error}=await supabase.rpc('v47_save_doctor_signature_profile',{
      p_doctor:doctor.id,
      p_certificate_type:type,
      p_provider:type==='none'?null:(provider.trim()||null)
    })
    setSaving(false)
    if(error||!data?.ok){
      setMessage(error?.message||data?.error||'Não foi possível salvar.')
      return
    }
    setMessage(
      type==='none'
        ?'Assinatura manual mantida como opção disponível.'
        :'Configuração do certificado registrada. Nenhuma senha, PIN ou chave privada foi salva.'
    )
    await load()
  }

  const configured=type!=='none'
  const statusText=
    !configured
      ?'Não configurado'
      :provider.trim()
        ?'Certificado cadastrado · integração do provedor a validar'
        :'Certificado cadastrado · informe o provedor'

  return(
    <details style={{
      marginTop:12,
      border:'1px solid #eadfe1',
      borderRadius:12,
      padding:'10px 12px',
      background:'#fff'
    }}>
      <summary style={{
        cursor:'pointer',
        display:'flex',
        alignItems:'center',
        gap:8,
        fontWeight:700
      }}>
        <ShieldCheck size={15}/>
        Assinatura digital
        <span style={{
          marginLeft:'auto',
          fontSize:11,
          fontWeight:700,
          padding:'4px 8px',
          borderRadius:999,
          background:configured?'#ecf9f0':'#f4f1f2',
          color:configured?'#147a3d':'#765d63'
        }}>
          {loading?'Carregando...':statusText}
        </span>
      </summary>

      <div style={{display:'grid',gap:10,marginTop:12}}>
        <label style={{display:'grid',gap:5,fontSize:12,fontWeight:700}}>
          Tipo de assinatura do profissional
          <select
            value={type}
            disabled={saving}
            onChange={e=>setType(e.target.value as CertType)}
          >
            {Object.entries(labels).map(([value,label])=>
              <option key={value} value={value}>{label}</option>
            )}
          </select>
        </label>

        {type!=='none'&&
          <label style={{display:'grid',gap:5,fontSize:12,fontWeight:700}}>
            Provedor / empresa do certificado
            <input
              value={provider}
              disabled={saving}
              onChange={e=>setProvider(e.target.value)}
              placeholder="Ex.: Certisign, Soluti, Safeweb, Valid..."
            />
          </label>
        }

        <div style={{fontSize:11,color:'#75666a',lineHeight:1.45}}>
          O sistema guarda somente o tipo e o nome do provedor.
          Não informe senha, PIN, arquivo PFX/P12 ou chave privada.
        </div>

        {type==='a1'&&
          <div style={{fontSize:11,color:'#75666a'}}>
            A1: o certificado costuma ficar instalado/importado em um computador.
            A assinatura integrada exigirá um conector compatível com o provedor.
          </div>
        }

        {type==='a3'&&
          <div style={{fontSize:11,color:'#75666a'}}>
            A3: token/cartão exige dispositivo, driver e autorização do titular.
          </div>
        }

        {type==='cloud'&&
          <div style={{fontSize:11,color:'#75666a'}}>
            Nuvem: é o formato mais adequado ao fluxo web de redirecionamento para o PSC.
          </div>
        }

        <button
          type="button"
          className="btn small primary"
          disabled={saving||loading}
          onClick={()=>void save()}
        >
          <Save size={13}/>
          {saving?'Salvando...':'Salvar configuração'}
        </button>

        {message&&
          <div style={{fontSize:11,color:'#7d1320'}}>{message}</div>
        }
      </div>
    </details>
  )
}
`);

  patch('src/pages/MedicalTeamV38.tsx', text=>{
    if(!text.includes("DoctorSignatureSettingsV47")){
      const lines=text.split('\n');
      let lastImport=-1;
      for(let i=0;i<lines.length;i++){
        if(lines[i].startsWith('import ')) lastImport=i;
      }
      lines.splice(lastImport+1,0,"import DoctorSignatureSettingsV47 from '../components/DoctorSignatureSettingsV47'");
      text=lines.join('\n');
    }

    if(text.includes('<DoctorSignatureSettingsV47 doctor={d}/>')){
      return text;
    }

    const anchor='>Liberar acesso</button>';
    const pos=text.indexOf(anchor);

    if(pos<0){
      throw new Error('Não encontrei o botão "Liberar acesso" em MedicalTeamV38.tsx. Nada será publicado.');
    }

    const insertAt=pos+anchor.length;
    return text.slice(0,insertAt)+'<DoctorSignatureSettingsV47 doctor={d}/>'+text.slice(insertAt);
  });

  patch('src/components/DocumentControlV45.tsx', text=>{
    if(text.includes('V470_SIGNATURE_CAPABILITY')){
      return text;
    }

    const re=/async function icp\(\)\{[\s\S]*?(?=if\(!id\)return null;)/;
    const match=text.match(re);

    if(!match){
      throw new Error('Função icp() não encontrada em DocumentControlV45.tsx. Nada será publicado.');
    }

    const replacement=String.raw`async function icp(){/* V470_SIGNATURE_CAPABILITY */
  if(!row)return
  setWorking(true)
  setError('')

  const{data:cap,error:capError}=await supabase.rpc(
    'v47_get_doctor_signature_capability',
    {p_doctor:row.doctor_profile_id}
  )

  if(capError){
    setError(capError.message)
    setWorking(false)
    return
  }

  if(!cap?.configured){
    setError(
      'Este médico ainda não possui certificado ICP-Brasil configurado no corpo clínico. '+
      'Use Assinatura manual ou configure o certificado em Equipe médica.'
    )
    setWorking(false)
    return
  }

  if(cap?.certificate_type==='a1'){
    setError(
      'Certificado A1 cadastrado. Para assinatura automática pelo navegador ainda é necessário '+
      'o conector/API do provedor informado. A assinatura manual continua disponível.'
    )
    setWorking(false)
    return
  }

  if(cap?.certificate_type==='a3'){
    setError(
      'Certificado A3/token cadastrado. Para assinatura automática é necessário o token/cartão, '+
      'driver e integração compatível com o provedor. A assinatura manual continua disponível.'
    )
    setWorking(false)
    return
  }

  if(cap?.certificate_type==='cloud'&&!cap?.provider){
    setError(
      'Certificado em nuvem informado, mas o provedor ainda não foi cadastrado no perfil do médico.'
    )
    setWorking(false)
    return
  }

  const{data,error:e}=await supabase.functions.invoke(
    'icp-signature-start-v45',
    {body:{control_id:row.id}}
  )

  if(e||data?.error){
    let msg=data?.error||''

    try{
      const response=(e as any)?.context
      if(response?.clone){
        const body=await response.clone().json()
        msg=body?.error||msg
      }
    }catch{}

    if(!msg)msg=e?.message||'Falha ao iniciar a assinatura ICP-Brasil.'

    if(msg.includes('Integração ICP-Brasil ainda não configurada')||
       msg.includes('Credenciais do PSC incompletas')){
      msg=
        'O certificado do médico está cadastrado, mas a clínica ainda não conectou as credenciais/API '+
        'do provedor ICP-Brasil ('+(cap?.provider||'PSC')+').'
    }

    setError(msg)
    setWorking(false)
    return
  }

  if(data?.mock){
    if(confirm(
      'AMBIENTE DE TESTE — NÃO É ASSINATURA ICP-BRASIL.\nSimular retorno?'
    )){
      await supabase.functions.invoke(
        'icp-signature-mock-complete-v45',
        {body:{control_id:row.id}}
      )
    }
    setWorking(false)
    await load()
    return
  }

  if(data?.authorization_url){
    location.href=data.authorization_url
    return
  }

  setError('O provedor não devolveu uma URL de autorização.')
  setWorking(false)
}
`;

    return text.replace(re,replacement);
  });

  run(process.platform==='win32'?'npm.cmd':'npm',['run','build'],'BUILD DE SEGURANÇA');

  console.log('\n✓ BUILD APROVADO');

  if(!PUBLISH){
    console.log('\nNada foi aplicado no banco e nada foi publicado.');
    console.log('Para publicar:');
    console.log('node .\\CONFIGURAR_ASSINATURA_MEDICOS_V47_0.cjs --publish');
    process.exit(0);
  }

  run('npx',['supabase','db','push','--include-all'],'SUPABASE DB PUSH');
  dbApplied=true;

  run(process.platform==='win32'?'npm.cmd':'npm',['run','build'],'BUILD FINAL');

  publishCloudflare();

  console.log('\n======================================================================');
  console.log(' V47.0 PUBLICADA COM SUCESSO');
  console.log('======================================================================');
  console.log('✓ Cada médico agora possui configuração própria de assinatura');
  console.log('✓ Opções: Manual / A1 / A3 / ICP em nuvem');
  console.log('✓ Provedor pode ser informado por profissional');
  console.log('✓ Senha, PIN e chave privada NÃO são armazenados');
  console.log('✓ Documentos verificam a configuração antes de chamar ICP-Brasil');
  console.log('✓ Mensagem genérica non-2xx é substituída por orientação quando possível');
  console.log('✓ Assinatura manual permanece disponível');
  console.log('');
  console.log('IMPORTANTE: assinatura ICP real ainda depende da API/credenciais do PSC.');
  console.log('Backup:',BACKUP);

}catch(err){
  console.error('\nERRO:',err?.message||err);

  if(!dbApplied){
    console.error('Restaurando alterações locais...');
    try{
      rollback();
      console.error('Arquivos locais restaurados.');
    }catch(e){
      console.error('Falha no rollback:',e?.message||e);
    }
    console.error('NADA FOI PUBLICADO.');
  }else{
    console.error('A migration já foi aplicada. Os arquivos locais foram mantidos para evitar divergência.');
  }

  process.exit(1);
}
