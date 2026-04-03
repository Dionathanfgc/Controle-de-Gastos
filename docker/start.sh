#!/bin/sh

set -e

cd /var/www/html

# Se .env não existe (ou está vazio porque foi copiado sem conteúdo), criar a partir do .env.example
if [ ! -f .env ] || [ ! -s .env ]; then
    cp .env.example .env
fi

# Construir DB_URL com suporte a SSL se não existir
if [ ! -z "$DB_HOST" ] && [ -z "$DB_URL" ]; then
    # Construir URL com SSL obrigatório para TiDB
    export DB_URL="mysql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}?sslmode=require&sslverify=false"
fi

# Sobrescrever variáveis principais no .env
if [ ! -z "$APP_ENV" ]; then
    sed -i "s/^APP_ENV=.*/APP_ENV=${APP_ENV}/" .env
fi
if [ ! -z "$APP_DEBUG" ]; then
    sed -i "s/^APP_DEBUG=.*/APP_DEBUG=${APP_DEBUG}/" .env
fi
if [ ! -z "$DB_HOST" ]; then
    sed -i "s/^DB_HOST=.*/DB_HOST=${DB_HOST}/" .env
fi
if [ ! -z "$DB_PORT" ]; then
    sed -i "s/^DB_PORT=.*/DB_PORT=${DB_PORT}/" .env
fi
if [ ! -z "$DB_USERNAME" ]; then
    sed -i "s/^DB_USERNAME=.*/DB_USERNAME=${DB_USERNAME}/" .env
fi
if [ ! -z "$DB_PASSWORD" ]; then
    PWD_ESCAPED=$(printf '%s\n' "$DB_PASSWORD" | sed -e 's/[\/&]/\\&/g')
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=${PWD_ESCAPED}/" .env
fi
if [ ! -z "$DB_URL" ]; then
    echo "DB_URL=$(echo $DB_URL | sed 's/\//\\\//g' | sed 's/&/\\\&/g')" >> .env
fi

# Criar diretórios necessários
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache

# Permissões - Garantir que logs tem permissão de escrita
chmod -R 777 /var/www/html/storage
chmod -R 777 /var/www/html/bootstrap/cache

# Criar arquivo de log se não existir
touch /var/www/html/storage/logs/laravel.log
chmod 666 /var/www/html/storage/logs/laravel.log

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
