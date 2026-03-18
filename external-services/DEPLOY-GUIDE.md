# Deploy Guide — Serviços Externos

## Arquitetura

```
┌─────────────────┐     ┌──────────────────────────┐     ┌──────────────────────┐
│  Lovable App    │────▶│  Edge Function            │────▶│  External Service    │
│  (Frontend)     │     │  import-youtube            │     │  youtube-ingestor    │
│                 │     │  export-clip               │     │  video-render        │
└─────────────────┘     └──────────────────────────┘     └──────────────────────┘
                                    │                              │
                                    ▼                              ▼
                        ┌──────────────────────┐      ┌──────────────────────┐
                        │  Supabase Database   │      │  Supabase Storage    │
                        └──────────────────────┘      └──────────────────────┘
```

---

## 1. Deploy youtube-ingestor-service

### Railway
1. No Railway, crie um **New Project → Deploy from GitHub Repo**
2. Configure o **Root Directory**: `external-services/youtube-ingestor-service`
3. Adicione as variáveis de ambiente:
   - `SUPABASE_URL` = `https://bgaqderjilehqcxezybu.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (copie da aba Cloud do Lovable)
4. O Railway detectará o Dockerfile automaticamente
5. Após o deploy, copie a URL gerada (ex: `https://youtube-ingestor-xxx.up.railway.app`)

### Render
1. Crie um **New Web Service → Connect Repo**
2. **Root Directory**: `external-services/youtube-ingestor-service`
3. **Environment**: Docker
4. Adicione as mesmas variáveis de ambiente
5. Copie a URL gerada

---

## 2. Deploy video-render-service

### Railway
1. Crie outro **New Project → Deploy from GitHub Repo**
2. **Root Directory**: `external-services/video-render-service`
3. Variáveis de ambiente:
   - `SUPABASE_URL` = `https://bgaqderjilehqcxezybu.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (mesma key)
4. Copie a URL (ex: `https://video-render-xxx.up.railway.app`)

### Render
- Mesmo processo, root dir = `external-services/video-render-service`

---

## 3. Configurar Secrets no Lovable

Após o deploy dos dois serviços, adicione estas secrets no projeto Lovable:

| Secret Name | Valor | Exemplo |
|---|---|---|
| `YOUTUBE_INGEST_ENDPOINT` | URL base do youtube-ingestor-service | `https://youtube-ingestor-xxx.up.railway.app` |
| `VIDEO_RENDER_ENDPOINT` | URL base do video-render-service | `https://video-render-xxx.up.railway.app` |

**⚠️ NÃO inclua `/ingest` ou `/render` no final da URL** — as edge functions já adicionam o path correto.

---

## 4. Variáveis de Ambiente nos Serviços Externos

Ambos os serviços precisam de:

| Variável | Onde encontrar |
|---|---|
| `SUPABASE_URL` | Lovable Cloud → Settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Lovable Cloud → Settings → Secrets |

---

## 5. Testar

### YouTube Ingest
```bash
curl -X POST https://YOUR-INGESTOR-URL/ingest \
  -H "Content-Type: application/json" \
  -d '{"source_url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","video_id":"test","user_id":"test"}'
```

### Video Render
```bash
curl -X POST https://YOUR-RENDER-URL/render \
  -H "Content-Type: application/json" \
  -d '{"source_url":"https://YOUR-SIGNED-URL","start_time":0,"end_time":10,"format":"9:16"}'
```

---

## Notas

- **Timeout**: O Railway/Render tem timeout padrão de ~30s para requests HTTP. Para vídeos longos, considere aumentar o timeout ou usar um modelo de processamento assíncrono com webhooks.
- **Memória**: Vídeos grandes podem consumir bastante memória. Recomendo pelo menos 512MB para o ingestor e 1GB para o render service.
- **Custo**: Railway cobra por uso. Render tem plano gratuito com limitações. Para produção, use planos pagos.
