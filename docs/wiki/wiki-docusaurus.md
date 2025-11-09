# MeshWorks Wiki — Docusaurus (prod)

_Last updated: 2025-11-09_

## 1. Big picture
- **wiki.meshworks.ru** — основной домен производственной Docusaurus-инстанции. `wiki-test.meshworks.ru` оставлен как алиас, но рассматриваем его как тот же прод.
- Сайт работает в режиме **docs-only**: `/` отдаёт “Introduction to Meshtastic” (`docs/introduction/index.md`).
- Контент зеркалирует Outline: структура, названия страниц, оформление блоков.

## 2. Инфраструктура
- **Хост:** `meshworks@178.17.48.43` (`instance155096.waicore.network`).
- **Рабочая директория:** `/opt/compose/external/wiki/app` (git-репозитория нет, правим прямо на сервере).
- **Docker-стек:** `/opt/compose/stacks/stack-wiki.yml`. Один сервис `wiki` на `node:20`, выполняет `npm install && npm run serve -- --build --port 3000 --host 0.0.0.0`. Слушает `3000`, сеть `infra` (`172.18.0.31`). Healthcheck: `wget -qO- http://127.0.0.1:3000`.
- **Запуск/останов:** только через Bitwarden wrapper (`bws-compose.sh`).
  ```bash
  # Состояние
  sudo /opt/compose/scripts/bws-compose.sh --compose-args "-f stacks/stack-wiki.yml ps"

  # Перезапуск после изменений
  sudo /opt/compose/scripts/bws-compose.sh --compose-args "-f stacks/stack-wiki.yml up -d" wiki

  # Логи
  sudo /opt/compose/scripts/bws-compose.sh --compose-args "-f stacks/stack-wiki.yml logs -n 100" wiki
  ```
- **Секреты:** только через `bws-compose.sh`. Запуск `docker compose` напрямую запрещён.

## 3. Build и деплой
1. На сервере: `cd /opt/compose/external/wiki/app`.
2. Запустить `sudo ./build_wiki.sh`. Скрипт:
   - удаляет `build/` и `.docusaurus/`;
   - стартует контейнер `node:20` под UID 1000:1000;
   - выполняет `npm install` и `npm run build`.
3. После успешного билда сервис автоматически отдаёт новый `build/` (общий volume). Повторный `up -d` не нужен.
4. Санити-чек:
   ```bash
   curl -I "https://wiki.meshworks.ru/?cacheBust=$(date +%s)"
   curl -I "https://wiki.meshworks.ru/devices/ready-made/?cacheBust=$(date +%s)"
   ```
   Затем визуальная проверка через MCP Chrome в обеих темах (`?cacheBust` обязательно).

## 4. Структура проекта
```
/opt/compose/external/wiki/app
├── docs/                # контент (Markdown/MDX)
├── static/
│   ├── img/logo-*.png
│   └── img/wiki/        # локальные изображения для статей
├── src/
│   ├── css/custom.css   # фирменные цвета/стили
│   ├── pages/about.md
│   └── theme/           # переопределения (Admonition и т.п.)
├── sidebars.ts          # порядок навигации
└── docusaurus.config.ts
```

### Обязательный front matter
- `slug` — осмысленный путь (`/devices/ready-made/portable`).
- `sidebar_label`, `sidebar_position`.
- Страницы с реферальными ссылками добавляют `:::favorite … :::` сразу после front matter.

## 5. Брендинг и иконки
- Логотипы: `static/img/logo-light.png` и `logo-dark.png` (см. `docusaurus.config.ts`).
- Favicons переключаются через `headTags` с `prefers-color-scheme`.
- Цвета задаются в `src/css/custom.css` (`--ifm-color-primary`, тёмная тема и пр.).
- Footer настраивается отдельными переменными (`--ifm-footer-*`). Ссылки — Meshworks.ru, YouTube, Boosty, Telegram, Status Page, Malla + дисклеймер Meshtastic.

## 6. Кастомизации Docusaurus
### Admonitions
- Поддерживаются стандартные типы + кастомный `favorite`.
- В `docusaurus.config.ts`: `docs.admonitions.keywords=['favorite']`.
- Реализация: `src/theme/Admonition/Type/Favorite.tsx`, регистрируется в `src/theme/Admonition/Types/index.tsx`, стилизуется в `custom.css` (`--mesh-alert-*`).
- Партнёрский дисклеймер:
  ```markdown
  :::favorite
  Some links may be affiliate…
  :::
  ```

### Сайдбар-иконки
- Используем `Material Symbols Rounded` (подключены в `custom.css`). Правила вида `menu__link[href='/devices']::before`.

### Навигация
- Navbar: “База знаний” (`/`) и “О нас” (`/about`).
- Тумблер темы — дефолтный.
- `/about` лежит в `src/pages/about.md`.

### Поиск
- Локальный поиск `@easyops-cn/docusaurus-search-local` (Algolia отключена).
- Placeholder “Поиск”, подсказки клавиш спрятаны CSS.

## 7. Workflow обновления контента
1. SSH на сервер → `/opt/compose/external/wiki/app`.
2. Изменить контент:
   - Markdown в `docs/**`.
   - Картинки в `static/img/wiki/` (`![](/img/wiki/<slug>.png)`).
   - Конфиги/стили в `docusaurus.config.ts`, `src/css/custom.css`, `src/theme/**`.
3. Проверить diff (локального git нет, используем `rg`/`diff`).
4. Запустить `sudo ./build_wiki.sh`.
5. Проверить `?cacheBust` URL.
6. Обновить Status Hub и документацию (этот runbook + архитектуру при необходимости).

## 8. Пост-чек
- `curl -I` для ключевых маршрутов (`/`, `/devices`, `/node-setup`, `/troubleshooting`, `/community`, `/about`).
- MCP Chrome: проверить navbar highlight, footer, admonitions, картинки (`/img/wiki`).
- Убедиться, что поиск индексирует новые страницы.

## 9. Быстрые команды
```bash
# SSH
ssh meshworks@178.17.48.43

# Build
sudo /opt/compose/external/wiki/app/build_wiki.sh

# Сервис / логи
sudo /opt/compose/scripts/bws-compose.sh --compose-args "-f stacks/stack-wiki.yml ps"
sudo /opt/compose/scripts/bws-compose.sh --compose-args "-f stacks/stack-wiki.yml logs -n 50" wiki

# Health
curl -I "https://wiki.meshworks.ru/?cacheBust=$(date +%s)"

# Размер артефактов
ls -lh /opt/compose/external/wiki/app/build
```

## 10. Подводные камни
1. `docker compose` напрямую запрещён — используем `bws-compose.sh`.
2. `npm run serve -- --build …` требует актуального `build/`, не пропускаем `build_wiki.sh`.
3. Всегда добавляем `?cacheBust=<ts>` при проверке UI.
4. Ошибка `No admonition component…` — пересобрать и проверить `docs.admonitions.keywords`.
5. Не удаляем файлы из `static/img/wiki` без `rg -l` — ищем все вхождения.

## 11. Бэклог
- Заполнить `docs/regulations.md`.
- Добавить lint для ссылок/орфографии в build-скрипт.
- Перенести `app/` в полноценный git-репозиторий.

## 12. Переключение wiki.meshworks.ru на Docusaurus
**Цель:** `https://wiki.meshworks.ru` обслуживает тот же `wiki` backend.

### Prereqs
- Сервис `wiki` здоров (`bws-compose.sh --compose-args "-f stacks/stack-wiki.yml ps"`).
- SSH к `meshworks@178.17.48.43`.

### Конфиги Nginx
- Upstream: `/opt/compose/edge/nginx/conf.d/010-wiki-upstream.conf`.
- Серверные блоки:
  - `wiki`: `/opt/compose/edge/nginx/conf.d/wiki.conf` (боевой).
  - `wiki-test`: `/opt/compose/edge/nginx/conf.d/wiki-test.conf` (алиас, можно отключить при необходимости).

### Шаги (R2, обратимо)
1. Обновить `wiki.conf`, если меняется upstream или заголовки (бэкап с `cp wiki.conf wiki.conf.bak-$TS`).
2. Проверить и перезагрузить nginx inside контейнера:
   ```bash
   docker exec nginx-reverse-proxy nginx -t && \
   docker exec nginx-reverse-proxy nginx -s reload
   ```
3. Валидировать:
   ```bash
   curl -I "https://wiki.meshworks.ru/?cacheBust=$(date +%s)"
   ```

### Rollback
```bash
cd /opt/compose/edge/nginx/conf.d
mv -f wiki.conf.bak-<TS> wiki.conf
docker exec nginx-reverse-proxy nginx -t && docker exec nginx-reverse-proxy nginx -s reload
```

### Notes
- Static assets: `immutable`, HTML: `no-cache/must-revalidate` (см. `wiki.conf`).
- Перед UI-проверкой всегда добавляем `?cacheBust=<ts>`.
