FROM php:8.3-fpm-alpine

# Instalar dependências do sistema, PHP e NODEJS
RUN apk add --no-cache \
    nginx \
    libpng-dev \
    libzip-dev \
    oniguruma-dev \
    nodejs \
    npm \
    ca-certificates \
    $PHPIZE_DEPS \
    && docker-php-ext-install pdo_mysql gd zip bcmath

WORKDIR /var/www/html
COPY . /var/www/html

# Use production environment file if it exists
RUN if [ -f .env.production ]; then cp .env.production .env; fi

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# --- Build do Vite dentro do Docker ---
RUN npm install
RUN npm run build
# ----------------------------------------

# Permissões e diretórios e diretórios
RUN mkdir -p /var/www/html/storage/logs && \
    mkdir -p /var/www/html/storage/app && \
    mkdir -p /var/www/html/bootstrap/cache && \
    chown -R www-data:www-data /var/www/html && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public && \
    chmod +x /var/www/html/docker/start.sh

COPY ./docker/nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 8080

CMD ["sh", "/var/www/html/docker/start.sh"]