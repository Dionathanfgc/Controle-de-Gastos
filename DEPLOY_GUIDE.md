# 🚀 Deploy no Google Cloud Run - Guia Completo

## ✅ Pré-requisitos

1. **Google Cloud SDK instalado**
   ```bash
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

2. **Docker instalado**
   ```bash
   # Linux
   sudo apt-get install docker.io
   
   # macOS
   brew install docker
   ```

3. **Autenticado no GCP**
   ```bash
   gcloud auth login
   gcloud auth configure-docker gcr.io
   ```

## 🔑 Configurar variáveis de ambiente

As variáveis de ambiente estão no arquivo `.env`. Verifique os valores:

```bash
cat .env | grep DB_
```

**Importante:** As credenciais de banco de dados já estão no `.env`. O script de deploy vai passá-las automaticamente para o Cloud Run.

## 🚀 Deploy automático (Recomendado)

### 1️⃣ Dar permissão ao script
```bash
chmod +x deploy.sh
```

### 2️⃣ Executar o deploy
```bash
./deploy.sh
```

Isso vai:
- ✅ Build da imagem Docker
- ✅ Push para Google Cloud Registry (GCR)
- ✅ Deploy no Cloud Run
- ✅ Configurar todas as variáveis de ambiente

## 🐚 Deploy manual (Passo a passo)

Se preferir fazer manualmente:

### 1️⃣ Build da imagem
```bash
PROJECT_ID=$(gcloud config get-value project)
docker build -t gcr.io/${PROJECT_ID}/checkgastos:latest .
```

### 2️⃣ Push para GCR
```bash
docker push gcr.io/${PROJECT_ID}/checkgastos:latest
```

### 3️⃣ Deploy no Cloud Run
```bash
gcloud run deploy checkgastos \
    --image gcr.io/${PROJECT_ID}/checkgastos:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars \
    "APP_ENV=production,\
    APP_DEBUG=false,\
    APP_URL=https://checkgastos-1083277186891.us-central1.run.app,\
    DB_CONNECTION=mysql,\
    DB_HOST=gateway01.us-east-1.prod.aws.tidbcloud.com,\
    DB_PORT=4000,\
    DB_USERNAME=4RqW2yYk6PUuKXn.root,\
    DB_PASSWORD=BbOGSmMwyj3UI3pt,\
    DB_DATABASE=test,\
    MYSQL_ATTR_SSL_CA=/etc/ssl/certs/ca-certificates.crt,\
    DB_SSL_VERIFY_SERVER_CERT=false"
```

## 📋 Verificar o Deploy

### Consultar status
```bash
gcloud run services describe checkgastos --region us-central1
```

### Ver logs em tempo real
```bash
gcloud run services logs read checkgastos --region us-central1 --limit 100 --follow
```

### Testar a aplicação
```bash
# Abrir no navegador
gcloud run services describe checkgastos --region us-central1 --format='value(status.url)'
```

## 🔧 Se tiver problemas

### Verificar logs detalhados
```bash
gcloud run services logs read checkgastos --region us-central1 --limit 200
```

### Redeployar a mesma imagem
```bash
gcloud run deploy checkgastos --region us-central1 --image gcr.io/$(gcloud config get-value project)/checkgastos:latest
```

### Limpar builds antigos (economizar espaço)
```bash
# Listar imagens
gcloud container images list

# Deletar específica
gcloud container images delete gcr.io/$(gcloud config get-value project)/checkgastos:OLD_VERSION --quiet
```

## 💡 Dicas Importantes

### ⚠️ Tela Preta no Cloud Run?

1. **Verificar erros de PHP/Laravel**
   ```bash
   gcloud run services logs read checkgastos --region us-central1 --limit 50
   ```

2. **Verificar conexão com banco de dados**
   - Certifique-se que o banco está acessível (firewall/rede)
   - Verifique `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`

3. **Limpar cache do Laravel**
   ```bash
   # Pode ser necessário às vezes:
   gcloud run deploy checkgastos \
       --region us-central1 \
       --image gcr.io/$(gcloud config get-value project)/checkgastos:latest \
       --no-traffic  # Deploy sem receber traffic
   ```

### 🔐 Segurança

- **NÃO** commitar `.env` no GitHub (está no `.gitignore`)
- **NÃO** deixar `APP_DEBUG=true` em produção
- A conexão com TiDB usa SSL (MYSQL_ATTR_SSL_CA)

### 📊 Monitoramento

```bash
# Ver uso de recursos
gcloud run services describe checkgastos --region us-central1

# Ver revisões
gcloud run revisions list --service=checkgastos --region us-central1
```

## 🆘 Suporte

Se tiver e problema:
1. Verificar logs: `gcloud run services logs read checkgastos --region us-central1`
2. Verificar conectividade com TiDB
3. Verificar se todas as variáveis de ambiente estão setadas
4. Tentar fazer rebuild: `./deploy.sh`

