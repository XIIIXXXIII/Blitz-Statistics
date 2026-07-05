use axum::{
    extract::Json,
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Router,
};
use ab_glyph::{Font, FontRef, Glyph, PxScale, ScaleFont};
use image::{ImageBuffer, Rgba};
use serde::Deserialize;

const BACKGROUND_BYTES: &[u8] = include_bytes!("../assets/background.png");
const FONT_BOLD_BYTES: &[u8] = include_bytes!("../assets/RobotoCondensed-Bold.ttf");
const FONT_REGULAR_BYTES: &[u8] = include_bytes!("../assets/RobotoCondensed-Regular.ttf");

#[derive(Deserialize)]
struct ProfileRequest {
    nickname: String,
    #[serde(default = "default_region")]
    region: String,
    #[serde(default)]
    battles: u32,
    #[serde(default)]
    winrate: f32,
    #[serde(default)]
    avg_damage: f32,
}

fn default_region() -> String {
    "unknown".to_string()
}

type Canvas = ImageBuffer<Rgba<u8>, Vec<u8>>;

/// Рисует текст на канвасе через ab_glyph напрямую: без imageproc/rayon,
/// чтобы не тянуть транзитивные зависимости с MSRV выше, чем есть в окружении.
/// Растеризует каждый глиф и альфа-блендит его поверх текущих пикселей.
fn draw_text(canvas: &mut Canvas, font: &FontRef, scale: f32, x: i32, y: i32, color: [u8; 3], text: &str) {
    let scaled_font = font.as_scaled(PxScale::from(scale));
    let mut cursor_x = x as f32;
    let baseline_y = y as f32 + scaled_font.ascent();

    for ch in text.chars() {
        let glyph_id = scaled_font.glyph_id(ch);
        let glyph: Glyph = glyph_id.with_scale_and_position(scale, ab_glyph::point(cursor_x, baseline_y));

        if let Some(outlined) = scaled_font.outline_glyph(glyph) {
            let bounds = outlined.px_bounds();
            outlined.draw(|gx, gy, coverage| {
                if coverage <= 0.0 {
                    return;
                }
                let px = bounds.min.x as i32 + gx as i32;
                let py = bounds.min.y as i32 + gy as i32;
                if px < 0 || py < 0 || px as u32 >= canvas.width() || py as u32 >= canvas.height() {
                    return;
                }
                let existing = canvas.get_pixel(px as u32, py as u32).0;
                let alpha = coverage.clamp(0.0, 1.0);
                let blended = [
                    (color[0] as f32 * alpha + existing[0] as f32 * (1.0 - alpha)) as u8,
                    (color[1] as f32 * alpha + existing[1] as f32 * (1.0 - alpha)) as u8,
                    (color[2] as f32 * alpha + existing[2] as f32 * (1.0 - alpha)) as u8,
                    255,
                ];
                canvas.put_pixel(px as u32, py as u32, Rgba(blended));
            });
        }
        cursor_x += scaled_font.h_advance(glyph_id);
    }
}

/// Одна "плашка" статистики: подпись сверху, значение крупным шрифтом снизу.
/// Повторяет common_slots из lib/data_classes/db_player.py (winrate, avg_damage, battles).
fn draw_stat_slot(
    canvas: &mut Canvas,
    font_bold: &FontRef,
    font_regular: &FontRef,
    x: i32,
    y: i32,
    label: &str,
    value: &str,
) {
    draw_text(canvas, font_regular, 18.0, x, y, [180, 190, 200], label);
    draw_text(canvas, font_bold, 32.0, x, y + 26, [255, 255, 255], value);
}

fn generate_profile_image(req: &ProfileRequest) -> Vec<u8> {
    let mut canvas: Canvas = image::load_from_memory(BACKGROUND_BYTES)
        .expect("встроенный background.png должен грузиться всегда")
        .to_rgba8();

    let font_bold = FontRef::try_from_slice(FONT_BOLD_BYTES).expect("шрифт должен парситься");
    let font_regular = FontRef::try_from_slice(FONT_REGULAR_BYTES).expect("шрифт должен парситься");

    draw_text(&mut canvas, &font_bold, 42.0, 40, 30, [255, 255, 255], &req.nickname);
    draw_text(
        &mut canvas,
        &font_regular,
        20.0,
        40,
        82,
        [160, 170, 180],
        &format!("region: {}", req.region.to_uppercase()),
    );

    let slot_y = 180;
    draw_stat_slot(&mut canvas, &font_bold, &font_regular, 40, slot_y, "WINRATE", &format!("{:.1}%", req.winrate));
    draw_stat_slot(&mut canvas, &font_bold, &font_regular, 260, slot_y, "AVG DAMAGE", &format!("{:.0}", req.avg_damage));
    draw_stat_slot(&mut canvas, &font_bold, &font_regular, 480, slot_y, "BATTLES", &req.battles.to_string());

    let mut buf = Vec::new();
    canvas
        .write_to(&mut std::io::Cursor::new(&mut buf), image::ImageOutputFormat::Png)
        .expect("кодирование в PNG не должно падать");
    buf
}

async fn generate_profile(Json(payload): Json<ProfileRequest>) -> Response {
    let png_bytes = generate_profile_image(&payload);
    (StatusCode::OK, [(header::CONTENT_TYPE, "image/png")], png_bytes).into_response()
}

async fn health() -> &'static str {
    "ok"
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/health", get(health))
        .route("/generate/profile", post(generate_profile));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080")
        .await
        .expect("не смог забиндить порт 8080");

    println!("image-service слушает на http://0.0.0.0:8080");
    axum::serve(listener, app).await.expect("сервер упал");
}
