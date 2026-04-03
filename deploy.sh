#!/bin/bash

# Script de Deploy para Google Cloud Run
# Uso: ./deploy.sh

set -e

echo "========================================="
echo "Deploy para Google Cloud Run"
echo "========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir com cor
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI não está instalado"
    echo "Instale com: curl https://sdk.cloud.google.com | bash"
    exit 1
fi

# Obter projeto ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    print_error "Projeto GCP não configurado"
    echo "Execute: gcloud config set project SEU_PROJECT_ID"
    exit 1
fi

print_success "Projeto GCP: $PROJECT_ID"

# Variáveis de ambiente do .env
export $(cat .env | grep -v '#' | xargs)

# Versão do build
VERSION=$(date +%s)
IMAGE_NAME="gcr.io/${PROJECT_ID}/checkgastos:${VERSION}"

echo ""
print_info "Buildando imagem Docker..."
print_info "Imagem: $IMAGE_NAME"

# Build da imagem
if docker build -t "${IMAGE_NAME}" .; then
    print_success "Build concluído"
else
    print_error "Falha no build"
    exit 1
fi

echo ""
print_info "Fazendo push para Google Cloud Registry..."

# Push para GCR
if docker push "${IMAGE_NAME}"; then
    print_success "Push concluído"
else
    print_error "Falha no push"
    exit 1
fi

echo ""
print_info "Fazendo deploy no Cloud Run..."

# Deploy no Cloud Run com variáveis de ambiente
gcloud run deploy checkgastos \
    --image "${IMAGE_NAME}" \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 3600 \
    --set-env-vars \
"APP_NAME=${APP_NAME},\
APP_ENV=${APP_ENV},\
APP_DEBUG=${APP_DEBUG},\
APP_URL=${APP_URL},\
APP_KEY=${APP_KEY},\
LOG_CHANNEL=${LOG_CHANNEL},\
LOG_LEVEL=${LOG_LEVEL},\
DB_CONNECTION=${DB_CONNECTION},\
DB_HOST=${DB_HOST},\
DB_PORT=${DB_PORT},\
DB_DATABASE=${DB_DATABASE},\
DB_USERNAME=${DB_USERNAME},\
DB_PASSWORD=${DB_PASSWORD},\
MYSQL_ATTR_SSL_CA=${MYSQL_ATTR_SSL_CA},\
DB_SSL_VERIFY_SERVER_CERT=${DB_SSL_VERIFY_SERVER_CERT},\
SESSION_DRIVER=${SESSION_DRIVER},\
BROADCAST_CONNECTION=${BROADCAST_CONNECTION},\
FILESYSTEM_DISK=${FILESYSTEM_DISK},\
QUEUE_CONNECTION=${QUEUE_CONNECTION},\
CACHE_STORE=${CACHE_STORE},\
REDIS_HOST=${REDIS_HOST},\
REDIS_PORT=${REDIS_PORT},\
MAIL_MAILER=${MAIL_MAILER},\
MAIL_HOST=${MAIL_HOST},\
MAIL_PORT=${MAIL_PORT},\
VITE_APP_NAME=${VITE_APP_NAME}"

if [ $? -eq 0 ]; then
    print_success "Deploy concluído com sucesso!"
    echo ""
    echo "========================================="
    echo "Informações do Deploy:"
    echo "========================================="
    echo "Serviço: checkgastos"
    echo "Região: us-central1"
    echo "Imagem: $IMAGE_NAME"
    echo "versão: $VERSION"
    echo ""
    echo "URL: $(gcloud run services describe checkgastos --region us-central1 --format='value(status.url)')"
    echo ""
    print_info "Verifique os logs com:"
    echo "  gcloud run services logs read checkgastos --region us-central1 --limit 100"
else
    print_error "Falha no deploy"
    exit 1
fi

echo ""
print_success "Pronto! Sua aplicação está disponível na URL acima."
