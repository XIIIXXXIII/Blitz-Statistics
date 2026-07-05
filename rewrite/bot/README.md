# Blitz Statistics — bot core (TypeScript)

Перенос ядра Discord-бота с py-cord на discord.js. Пока покрыты `/ping` и упрощённая
версия `/profile`; остальные команды (`cogs/session.py`, `cogs/stats.py`, `cogs/report.py`,
`cogs/replay_parser.py`, `cogs/set.py`, ...) ещё не портированы — переносить по одной,
благо структура (`src/commands/*.ts`, одна команда — один файл) уже под это заточена.

## Запуск

```bash
cp .env.example .env   # заполнить DISCORD_TOKEN и MONGODB_URI
npm install
npm run dev             # запуск через tsx, без сборки
npm run build && npm start   # либо собрать в dist/ и запустить обычным node
```

## Тесты

```bash
npm run typecheck   # tsc --noEmit
npm test             # юнит-тесты форматирования embed'ов (без Discord и без Mongo)
```

## Структура

- `src/config.ts` — переменные окружения (те же имена, что в Python EnvConfig)
- `src/db.ts` — подключение к MongoDB, коллекция `players`
- `src/embeds.ts` — чистые функции построения embed'ов (тестируются отдельно)
- `src/commands/*.ts` — одна команда — один файл, экспортирует `data` (SlashCommandBuilder) и `execute`

## Известные упрощения относительно оригинала

Схема игрока в оригинале (`lib/data_classes/db_player.py`) — это несколько игровых
аккаунтов на одного Discord-пользователя (`AccountSlotsEnum`, слоты, дефолтный слот и
т.д.), плюс настройки отображения статов, бейджи, темы. Здесь — плоская схема с одним
набором статов на пользователя, только чтобы показать рабочий сквозной путь
Discord → Mongo → embed. Перенос полной модели слотов — следующий шаг, не задача на
один заход.
