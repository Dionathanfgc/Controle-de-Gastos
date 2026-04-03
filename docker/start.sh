#!/bin/sh

set -e

cd /var/www/html

# Se existir .env.production, usar ele
if [ -f .env.production ]; then
    cp .env.production .env
else
    # Gerar .env a partir do .env.example e sobrescrever com variáveis de ambiente
    if [ ! -f .env ]; then
        cp .env.example .env
    fi
    
    # Criar arquivo .env novo com variáveis de ambiente (para Cloud Run)
    # Se estamos em produção, sobrescrever com valores reais
    if [ "$APP_ENV" = "production" ] || [ ! -z "$DB_HOST" ] && [ "$DB_HOST" != "mysql" ]; then
        cat > .env << FINALENV
APP_NAME=${APP_NAME:-Laravel}
APP_ENV=${APP_ENV:-production}
APP_DEBUG=${APP_DEBUG:-false}
APP_KEY=${APP_KEY:-base64:A4+C7M6pRy63G01d+7SbqciCb37lsuDeXwSvaE4h0mo=}
APP_URL=${APP_URL:-https://checkgastos-1083277186891.us-central1.run.app}

LOG_CHANNEL=${LOG_CHANNEL:-stack}
LOG_LEVEL=${LOG_LEVEL:-warning}

DB_CONNECTION=${DB_CONNECTION:-mysql}
DB_HOST=${DB_HOST:-mysql}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE:-controle_de_gastos}
DB_USERNAME=${DB_USERNAME:-sail}
DB_PASSWORD=${DB_PASSWORD:-password}

SESSION_DRIVER=${SESSION_DRIVER:-database}
BROADCAST_CONNECTION=${BROADCAST_CONNECTION:-log}
FILESYSTEM_DISK=${FILESYSTEM_DISK:-local}
QUEUE_CONNECTION=${QUEUE_CONNECTION:-database}
CACHE_STORE=${CACHE_STORE:-database}

REDIS_HOST=${REDIS_HOST:-127.0.0.1}
REDIS_PORT=${REDIS_PORT:-6379}

MAIL_MAILER=${MAIL_MAILER:-log}

VITE_APP_NAME=${VITE_APP_NAME:-Laravel}
FINALENV
    fi
fi

# Criar diretórios necessários
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache

# Permissões - Garantir que o arquivo de log existe e tem permissões corretas ANTES de PHP-FPM usar
touch /var/www/html/storage/logs/laravel.log
chmod -R 777 /var/www/html/storage
chmod -R 777 /var/www/html/bootstrap/cache
chmod 666 /var/www/html/storage/logs/laravel.log 2>/dev/null || true

# Para TiDB (produção), adicionar configuração de SSL
if [ "$DB_HOST" = "gateway01.us-east-1.prod.aws.tidbcloud.com" ] || [ "$DB_HOST" = "gateway01.ap-northeast-1.prod.aws.tidbcloud.com" ] || grep -q "tidbcloud.com" <<< "$DB_HOST" 2>/dev/null; then
    # TiDB Cloud requer SSL
    sed -i "$ a MYSQL_ATTR_SSL_VERIFY_SERVER_CERT=false" /var/www/html/.env 2>/dev/null || echo "MYSQL_ATTR_SSL_VERIFY_SERVER_CERT=false" >> /var/www/html/.env
fi

# Limpar cache
php artisan config:clear > /dev/null 2>&1 || true
php artisan cache:clear > /dev/null 2>&1 || true

# Executar migrations (ignorar erros)
php artisan migrate --force > /dev/null 2>&1 || true

# Iniciar PHP-FPM em background
php-fpm -D

# Aguardar PHP-FPM estar pronto
sleep 2

# Iniciar Nginx em foreground
exec nginx -g 'daemon off;'
