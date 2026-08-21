# Site Dra. Andressa Dallarmi

Frontend premium em React + TypeScript + Vite, preparado para GitHub + Cloudflare Workers Static Assets e integração com o autoagendamento via Supabase Edge Function.

## Estrutura

- `/` Home
- `/sobre` Dra. Andressa
- `/servicos` serviços e procedimentos
- `/galeria` fotos, resultados e vídeos
- `/agendamento` autoagendamento / consulta de agendamento
- botão flutuante de WhatsApp em todo o site
- navegação responsiva e experiência mobile

## Onde editar conteúdo

- `src/data/site.ts`: nome, textos institucionais, Instagram e WhatsApp
- `src/data/services.ts`: serviços e descrições
- `src/data/media.ts`: fotos, YouTube e Drive público
- `public/media/images/`: fotos locais
- `public/media/videos/`: vídeos locais
- `public/brand/logo.png`: logo

## Integração do autoagendamento

Crie `.env.local` a partir de `.env.example` e configure:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_PUBLIC_BOOKING_FUNCTION=public-booking
VITE_WHATSAPP_NUMBER=5541999999999
VITE_INSTAGRAM_URL=https://instagram.com/...
```

O adapter fica em `src/services/bookingApi.ts`. Ele usa uma Edge Function pública e mantém dados clínicos/financeiros fora do frontend.

> Importante: antes da publicação oficial, valide o contrato exato da Edge Function `public-booking`. Caso a função existente use nomes de ações diferentes, basta adaptar este único arquivo.

## Rodar

```bash
npm install
npm run dev -- --host 0.0.0.0
```

## Verificar build

```bash
npm run build
```

## Publicar no GitHub

```bash
git add -A
git commit -m "feat: novo site Dra Andressa Dallarmi"
git push origin main
```

## Cloudflare

Build command:

```bash
npm run build
```

Deploy command:

```bash
npx wrangler deploy
```

Root directory:

```text
/
```

Cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` também em **Build Variables and Secrets** do Cloudflare.

## Conteúdo inicial

Os textos médicos deste pacote são rascunhos de apresentação e devem ser revisados pela clínica antes da publicação oficial. Fotos de pacientes e antes/depois devem ser inseridas apenas com autorização apropriada.
