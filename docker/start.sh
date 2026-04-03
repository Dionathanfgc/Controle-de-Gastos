#!/bin/sh

set -e

cd /var/www/html

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
