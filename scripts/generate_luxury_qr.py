"""
Script tạo Mã QR sang trọng theo Key Visual IRIS 15 Năm
URL: https://iris-event-portal.onrender.com
Sinh ra các tệp:
  - assets/iris-qr-code.png (Mã QR VIP chất lượng cao 1200x1200px)
  - assets/iris-qr-standee.png (Standee / Poster sự kiện 1080x1920px chuẩn in ấn & chia sẻ)
  - assets/iris-qr-code.svg (Mã QR Vector sắc nét cho thiết kế)
"""

import os
import sys
import math
import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageFilter

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

URL = "https://iris-event-portal.onrender.com"
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../assets"))
KV_PATH = os.path.join(OUTPUT_DIR, "key-visual.jpg")

# Bảng màu Hoàng gia (Royal Gold & Deep Cosmic Blue)
COLOR_SPACE_BG = (4, 8, 22)        # #040816
COLOR_SPACE_CARD = (8, 16, 42)     # #08102A
COLOR_GOLD_LIGHT = (255, 243, 196) # #FFF3C4
COLOR_GOLD_MID = (247, 207, 93)    # #F7CF5D
COLOR_GOLD_DARK = (217, 150, 22)   # #D99616
COLOR_GOLD_BORDER = (245, 184, 46, 120)

def lerp_color(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))

def get_gold_color(t):
    """Nội suy màu vàng kim theo gradient chéo t (0.0 -> 1.0)"""
    if t < 0.5:
        return lerp_color(COLOR_GOLD_LIGHT, COLOR_GOLD_MID, t * 2)
    else:
        return lerp_color(COLOR_GOLD_MID, COLOR_GOLD_DARK, (t - 0.5) * 2)

def generate_qr_image(size=1200):
    """Tạo mã QR VIP với nền Cosmic và hạt vàng kim rực rỡ"""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=1,
        border=0
    )
    qr.add_data(URL)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    mod_count = len(matrix)

    # Kích thước canvas
    padding = int(size * 0.12)
    qr_inner_size = size - padding * 2
    mod_size = qr_inner_size / mod_count

    # 1. Nền Deep Cosmic với hiệu ứng Gradient tỏa sáng tâm
    base = Image.new("RGBA", (size, size), COLOR_SPACE_BG + (255,))
    draw = ImageDraw.Draw(base)

    # Vẽ vầng sáng vàng kim trung tâm (Radial Glow)
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    cx, cy = size // 2, size // 2
    for r in range(int(size * 0.48), 0, -4):
        alpha = int(28 * (1.0 - r / (size * 0.48)))
        glow_draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(245, 184, 46, alpha)
        )
    base = Image.alpha_composite(base, glow)
    draw = ImageDraw.Draw(base)

    # 2. Khung thẻ bài Card bo góc dát vàng
    card_margin = int(padding * 0.4)
    card_rect = [card_margin, card_margin, size - card_margin, size - card_margin]
    draw.rounded_rectangle(card_rect, radius=int(size * 0.05), fill=(7, 14, 38, 230), outline=(245, 184, 46, 180), width=3)
    
    # Viền trong tinh tế
    inner_border_rect = [card_margin + 6, card_margin + 6, size - card_margin - 6, size - card_margin - 6]
    draw.rounded_rectangle(inner_border_rect, radius=int(size * 0.045), outline=(245, 184, 46, 60), width=1)

    # Xác định vị trí 3 mắt căn chỉnh (Finder patterns)
    def is_finder(r, c):
        if r < 7 and c < 7:
            return True
        if r < 7 and c >= mod_count - 7:
            return True
        if r >= mod_count - 7 and c < 7:
            return True
        return False

    # Xác định vùng logo ở trung tâm (7x7 modules)
    logo_rad = 4
    center_idx = mod_count // 2
    def is_center_logo(r, c):
        return (center_idx - logo_rad <= r <= center_idx + logo_rad) and \
               (center_idx - logo_rad <= c <= center_idx + logo_rad)

    # 3. Vẽ các module dữ liệu (Hạt vàng kim bo tròn mềm mại)
    for r in range(mod_count):
        for c in range(mod_count):
            if is_finder(r, c) or is_center_logo(r, c):
                continue
            if matrix[r][c]:
                # Tính tọa độ
                x1 = padding + c * mod_size
                y1 = padding + r * mod_size
                x2 = x1 + mod_size
                y2 = y1 + mod_size
                
                # Thu nhỏ nhẹ module để tạo kẽ hở sang trọng
                inset = mod_size * 0.1
                t = (r + c) / (2 * mod_count)
                color = get_gold_color(t)
                
                draw.rounded_rectangle(
                    [x1 + inset, y1 + inset, x2 - inset, y2 - inset],
                    radius=int(mod_size * 0.35),
                    fill=color
                )

    # 4. Vẽ 3 Mắt Căn Chỉnh Finder Patterns Hoàng Gia
    def draw_luxury_eye(top_r, left_c):
        ox = padding + left_c * mod_size
        oy = padding + top_r * mod_size
        eye_w = 7 * mod_size
        
        # Vòng ngoài dát vàng (7x7)
        draw.rounded_rectangle(
            [ox, oy, ox + eye_w, oy + eye_w],
            radius=int(eye_w * 0.28),
            fill=None,
            outline=COLOR_GOLD_MID,
            width=int(mod_size * 0.95)
        )
        # Khoảng trống đen viền
        gap_inset = mod_size * 1.05
        # Tâm mắt vàng kim (3x3)
        center_inset = mod_size * 2.0
        center_w = 3 * mod_size
        draw.rounded_rectangle(
            [ox + center_inset, oy + center_inset, ox + eye_w - center_inset, oy + eye_w - center_inset],
            radius=int(center_w * 0.32),
            fill=COLOR_GOLD_LIGHT
        )

    draw_luxury_eye(0, 0)
    draw_luxury_eye(0, mod_count - 7)
    draw_luxury_eye(mod_count - 7, 0)

    # 5. Vẽ Huy Hiệu Logo IRIS 15 Năm Tại Tâm
    logo_box_size = (logo_rad * 2 + 1) * mod_size + mod_size * 0.6
    lx = size / 2 - logo_box_size / 2
    ly = size / 2 - logo_box_size / 2
    
    # Nền huy hiệu
    draw.rounded_rectangle(
        [lx, ly, lx + logo_box_size, ly + logo_box_size],
        radius=int(logo_box_size * 0.32),
        fill=(5, 10, 28),
        outline=COLOR_GOLD_MID,
        width=int(mod_size * 0.5)
    )

    # Chữ IRIS & Số 15 vàng kim ở giữa
    try:
        font_large = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", int(logo_box_size * 0.32))
        font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", int(logo_box_size * 0.16))
    except Exception:
        font_large = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    draw.text((size / 2, size / 2 - logo_box_size * 0.12), "IRIS", fill=COLOR_GOLD_LIGHT, font=font_large, anchor="mm")
    draw.text((size / 2, size / 2 + logo_box_size * 0.22), "15 NĂM", fill=COLOR_GOLD_MID, font=font_sub, anchor="mm")

    return base

def generate_luxury_standee(qr_img):
    """Tạo Standee / Poster sự kiện 1080x1920px (9:16) cực đẹp để in ấn hoặc trình chiếu"""
    width = 1080
    height = 1920
    poster = Image.new("RGBA", (width, height), COLOR_SPACE_BG + (255,))
    
    # 1. Chèn ảnh Key Visual ở phía trên
    if os.path.exists(KV_PATH):
        kv_img = Image.open(KV_PATH).convert("RGBA")
        kv_w = width
        kv_h = int(kv_img.height * (width / kv_img.width))
        kv_resized = kv_img.resize((kv_w, kv_h), Image.Resampling.LANCZOS)
        poster.paste(kv_resized, (0, 0))

        # Hiệu ứng chuyển mờ gradient từ Key Visual vào nền vũ trụ bên dưới
        mask = Image.new("L", (kv_w, kv_h), 0)
        mask_draw = ImageDraw.Draw(mask)
        fade_start = int(kv_h * 0.6)
        for y in range(fade_start, kv_h):
            alpha = int(255 * (1.0 - (y - fade_start) / (kv_h - fade_start)))
            mask_draw.line([(0, y), (kv_w, y)], fill=alpha)
        # Apply mask
        poster.paste(kv_resized, (0, 0), mask)

    draw = ImageDraw.Draw(poster)

    # 2. Font chữ hệ thống
    try:
        font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 26)
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 54)
        font_subtitle = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 30)
        font_instruct = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 36)
        font_sub_instruct = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 24)
        font_url = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 30)
        font_footer = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 22)
    except Exception:
        font_badge = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_instruct = ImageFont.load_default()
        font_sub_instruct = ImageFont.load_default()
        font_url = ImageFont.load_default()
        font_footer = ImageFont.load_default()

    # 3. Huy hiệu "KỶ NIỆM 15 NĂM THÀNH LẬP"
    badge_y = 660
    badge_text = "KỶ NIỆM 15 NĂM THÀNH LẬP (2011 - 2026)"
    badge_half_w = 315
    draw.rounded_rectangle([width // 2 - badge_half_w, badge_y - 24, width // 2 + badge_half_w, badge_y + 24], radius=24, fill=(18, 30, 68), outline=COLOR_GOLD_MID, width=2)
    # Vẽ 2 viên kim cương vàng 2 bên
    diamond_offset = badge_half_w - 24
    for dx in [-diamond_offset, diamond_offset]:
        cx = width // 2 + dx
        draw.polygon([(cx, badge_y - 6), (cx + 6, badge_y), (cx, badge_y + 6), (cx - 6, badge_y)], fill=COLOR_GOLD_LIGHT)
    draw.text((width // 2, badge_y), badge_text, fill=COLOR_GOLD_LIGHT, font=font_badge, anchor="mm")

    # 4. Tiêu đề Trò Chơi Trắc Nghiệm Có Thưởng
    title_y = 735
    draw.text((width // 2, title_y), "MẬT MÃ IRIS", fill=COLOR_GOLD_LIGHT, font=font_title, anchor="mm")
    draw.text((width // 2, title_y + 55), "Trò Chơi Trắc Nghiệm Có Thưởng • Đấu Trí Rinh Quà", fill=(255, 228, 138), font=font_subtitle, anchor="mm")

    # 5. Dán Mã QR VIP đã tạo
    qr_target_size = 620
    qr_small = qr_img.resize((qr_target_size, qr_target_size), Image.Resampling.LANCZOS)
    qr_x = (width - qr_target_size) // 2
    qr_y = 855

    # Khung hào quang phát sáng xung quanh QR Card
    glow_box = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_box)
    for g in range(40, 0, -3):
        a = int(35 * (1.0 - g / 40))
        glow_draw.rounded_rectangle(
            [qr_x - g, qr_y - g, qr_x + qr_target_size + g, qr_y + qr_target_size + g],
            radius=35 + g,
            outline=(245, 184, 46, a),
            width=2
        )
    poster = Image.alpha_composite(poster, glow_box)
    draw = ImageDraw.Draw(poster)

    # Dán QR
    poster.paste(qr_small, (qr_x, qr_y), qr_small)

    # 6. Hướng dẫn quét & URL
    instruct_y = qr_y + qr_target_size + 65
    draw.text((width // 2, instruct_y), "QUÉT MÃ ĐỂ VÀO CHƠI & NHẬN THƯỞNG NGAY", fill=COLOR_GOLD_LIGHT, font=font_instruct, anchor="mm")

    sub_instruct_y = instruct_y + 42
    draw.text((width // 2, sub_instruct_y), "(Mở Camera điện thoại hoặc Zalo để quét mã)", fill=(164, 179, 214), font=font_sub_instruct, anchor="mm")

    url_y = sub_instruct_y + 52
    draw.rounded_rectangle([width // 2 - 310, url_y - 25, width // 2 + 310, url_y + 25], radius=16, fill=(10, 20, 52), outline=(245, 184, 46, 120), width=1)
    draw.text((width // 2, url_y), URL, fill=COLOR_GOLD_MID, font=font_url, anchor="mm")

    # 7. Footer thương hiệu
    footer_y = height - 90
    draw.line([(width // 2 - 220, footer_y - 30), (width // 2 + 220, footer_y - 30)], fill=(245, 184, 46, 80), width=1)
    draw.text((width // 2, footer_y), "CÔNG TY CỔ PHẦN GIẢI PHÁP CÔNG NGHỆ IRIS", fill=(255, 255, 255), font=font_footer, anchor="mm")
    draw.text((width // 2, footer_y + 35), "Hành trình 15 năm Đổi mới & Gắn kết (2011 - 2026)", fill=(140, 156, 184), font=font_footer, anchor="mm")

    return poster

def generate_svg_qr():
    """Tạo mã QR vector SVG độ phân giải vô cực để xuất cho in ấn khổ lớn"""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2
    )
    qr.add_data(URL)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    mod_count = len(matrix)
    svg_size = mod_count * 10 + 40

    svg_lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_size} {svg_size}" width="100%" height="100%">',
        '  <defs>',
        '    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">',
        '      <stop offset="0%" stop-color="#FFF2C2" />',
        '      <stop offset="50%" stop-color="#F7CF5D" />',
        '      <stop offset="100%" stop-color="#D99616" />',
        '    </linearGradient>',
        '  </defs>',
        f'  <rect width="{svg_size}" height="{svg_size}" rx="24" fill="#040816" />',
        f'  <rect x="4" y="4" width="{svg_size - 8}" height="{svg_size - 8}" rx="20" fill="none" stroke="#F5B82E" stroke-width="2" stroke-opacity="0.4" />'
    ]

    for r in range(mod_count):
        for c in range(mod_count):
            if matrix[r][c]:
                x = 20 + c * 10
                y = 20 + r * 10
                svg_lines.append(f'  <rect x="{x}" y="{y}" width="9" height="9" rx="2.5" fill="url(#goldGradient)" />')

    svg_lines.append('</svg>')
    return "\n".join(svg_lines)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("[QR Generator] Đang vẽ Mã QR VIP hoàng gia...")
    qr_img = generate_qr_image(size=1200)
    qr_out_path = os.path.join(OUTPUT_DIR, "iris-qr-code.png")
    qr_img.save(qr_out_path, "PNG", quality=100)
    print(f"✅ Đã tạo: {qr_out_path}")

    print("[QR Generator] Đang vẽ Poster Standee sự kiện 1080x1920px...")
    standee_img = generate_luxury_standee(qr_img)
    standee_out_path = os.path.join(OUTPUT_DIR, "iris-qr-standee.png")
    standee_img.save(standee_out_path, "PNG", quality=95)
    print(f"✅ Đã tạo: {standee_out_path}")

    print("[QR Generator] Đang tạo tệp vector SVG...")
    svg_content = generate_svg_qr()
    svg_out_path = os.path.join(OUTPUT_DIR, "iris-qr-code.svg")
    with open(svg_out_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"✅ Đã tạo: {svg_out_path}")

    print("\n🎉 Hoàn thành thiết kế bộ mã QR sự kiện 15 năm IRIS!")

if __name__ == "__main__":
    main()
