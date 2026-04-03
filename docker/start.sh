#!/bin/sh

set -e

cd /var/www/html

# Copiar .env.production se existir (para builds locais)
if [ -f .env.production ]; then
    cp .env.production .env
else
    # Se não existir .env.production, criar um a partir do .env.example se .env não existir  
    if [ ! -f .env ]; then
        cp .env.example .env
    fi
    
    # Sobrescrever variáveis de produção com valores do Cloud Run (se definidas)
    if [ ! -z "$APP_ENV" ]; then
        sed -i "s/APP_ENV=.*/APP_ENV=$APP_ENV/" .env
    fi
    if [ ! -z "$APP_DEBUG" ]; then
        sed -i "s/APP_DEBUG=.*/APP_DEBUG=$APP_DEBUG/" .env
    fi
    if [ ! -z "$DB_HOST" ]; then
        sed -i "s/DB_HOST=.*/DB_HOST=$DB_HOST/" .env
    fi
    if [ ! -z "$DB_PORT" ]; then
        sed -i "s/DB_PORT=.*/DB_PORT=$DB_PORT/" .env
    fi
    if [ ! -z "$DB_USERNAME" ]; then
        sed -i "s/DB_USERNAME=.*/DB_USERNAME=$DB_USERNAME/" .env
    fi
    if [ ! -z "$DB_PASSWORD" ]; then
        sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" .env
    fi
    if [ ! -z "$APP_URL" ]; then
        sed -i "s|APP_URL=.*|APP_URL=$APP_URL|" .env
    fi
fi

# Criar diretórios necessários
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache

# Permissões
chmod -R 777 /var/www/html/storage
chmod -R 777 /var/www/html/bootstrap/cache

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
