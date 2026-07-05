# Blitz Statistics — image service (Rust)

Перенос сервера генерации картинок (`run_server.py` / `web/server/image_gen_server.py`,
Pillow) на Rust: axum как HTTP-сервер, `image` + `ab_glyph` для рендера. Без `imageproc` —
он тянет `rayon`, а тому нужен rustc 1.80+, в текущем окружении доступен только 1.75
(из apt); текст рисуется вручную через `ab_glyph` (растеризация глифа + альфа-блендинг).

## Запуск

```bash
cargo run    # слушает 0.0.0.0:8080
```

## API

```
GET  /health                → "ok"
POST /generate/profile      → PNG (image/png)
     body: {
       "nickname": "1aur3nt",
       "region": "eu",        // необязательно
       "battles": 4213,        // необязательно
       "winrate": 58.7,        // необязательно
       "avg_damage": 2140      // необязательно
     }
```

Пример:
```bash
curl -X POST localhost:8080/generate/profile \
  -H "Content-Type: application/json" \
  -d '{"nickname":"1aur3nt","region":"eu","battles":4213,"winrate":58.7,"avg_damage":2140}' \
  -o profile.png
```

## Ассеты

`assets/background.png` и `assets/RobotoCondensed-*.ttf` скопированы из оригинального
репозитория (`res/image/profile/backgrounds/blue.png`, `res/fonts/OFL-Licensed/`,
шрифт под OFL-лицензией) и вшиты в бинарник через `include_bytes!` — сервис не читает
файлы с диска в рантайме, только эти два ассета как стартовая точка. Остальные фоны/темы
оригинала (`lib/image/themes/*`) сюда ещё не перенесены.

## Что дальше

Сейчас один эндпоинт с фиксированной раскладкой (аналог `common_slots` из
`lib/data_classes/db_player.py`: winrate, avg damage, battles). В оригинале есть темы
оформления (`props.yaml` на тему), бейджи, цветовая индикация статов
(`lib/image/for_image/stats_coloring.py`) — не перенесено.
