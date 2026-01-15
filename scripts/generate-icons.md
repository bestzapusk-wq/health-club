# Генерация иконок для PWA

## Способ 1: Онлайн генератор (рекомендуется)

1. Откройте https://realfavicongenerator.net/
2. Загрузите `public/icons/icon.svg` (или ваш логотип 512x512)
3. Настройте параметры для каждой платформы
4. Скачайте архив и распакуйте в `public/icons/`

## Способ 2: PWA Asset Generator

```bash
npm install -g pwa-asset-generator
pwa-asset-generator public/icons/icon.svg public/icons -i index.html -m public/manifest.json
```

## Способ 3: Ручная генерация через ImageMagick

```bash
# Установка ImageMagick
brew install imagemagick

# Генерация всех размеров
cd public/icons
for size in 72 96 128 144 152 192 384 512; do
  convert icon.svg -resize ${size}x${size} icon-${size}x${size}.png
done

# Favicon
convert icon.svg -resize 32x32 favicon-32x32.png
convert icon.svg -resize 16x16 favicon-16x16.png

# Apple Touch Icon
convert icon.svg -resize 180x180 apple-touch-icon.png
```

## Нужные файлы

### Иконки (в `public/icons/`)
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
- favicon-16x16.png
- favicon-32x32.png
- apple-touch-icon.png

### Splash screens (в `public/splash/`)
Для iOS нужны splash screens разных размеров:
- apple-splash-640-1136.png (iPhone 5)
- apple-splash-750-1334.png (iPhone 6/7/8)
- apple-splash-1242-2208.png (iPhone Plus)
- apple-splash-1125-2436.png (iPhone X/XS)
- apple-splash-1242-2688.png (iPhone XS Max)
- apple-splash-1536-2048.png (iPad)
- apple-splash-1668-2388.png (iPad Pro 11)
- apple-splash-2048-2732.png (iPad Pro 12.9)

Используйте https://progressier.com/pwa-icons-and-ios-splash-screen-generator для генерации.

## OG Image

Создайте `public/og-image.png` размером 1200x630 для красивого превью при шаринге.
