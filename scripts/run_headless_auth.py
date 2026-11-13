# -*- coding: utf-8 -*-
"""
Script chạy Playwright Headless Browser để mở link đăng nhập Cổng Game IRIS (Campaign 26)
cho toàn bộ nhân sự, xác thực và kích hoạt nhận lượt chơi.
"""
import sys
import os
import json
import time
from playwright.sync_api import sync_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

TOKENS_FILE = os.path.join(os.path.dirname(__file__), 'tokens_campaign_26.json')
REPORT_FILE = os.path.join(os.path.dirname(__file__), 'auth_report_campaign_26.json')

def run_headless_auth():
    if not os.path.exists(TOKENS_FILE):
        print(f"❌ Không tìm thấy tệp {TOKENS_FILE}. Hãy chạy generate_tokens.js trước!")
        return

    with open(TOKENS_FILE, 'r', encoding='utf-8') as f:
        users = json.load(f)

    total_users = len(users)
    print("=" * 70)
    print(f"🚀 BẮT ĐẦU CHẠY HEADLESS BROWSER CHO {total_users} NHÂN SỰ (CAMPAIGN 26)")
    print("=" * 70)

    report_list = []
    success_count = 0
    fail_count = 0

    with sync_playwright() as p:
        print("🌐 Đang khởi động Google Chrome Headless...")
        browser = p.chromium.launch(channel='chrome', headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()

        # Chặn hình ảnh và font để tăng tốc độ tải
        def route_filter(route):
            if route.request.resource_type in ["image", "media", "font"]:
                route.abort()
            else:
                route.continue_()

        page.route("**/*", route_filter)

        for idx, user in enumerate(users, 1):
            stt = user.get('stt')
            username = user.get('username')
            fullname = user.get('fullname')
            department = user.get('department')
            target_url = user.get('url')

            auth_result = {
                "stt": stt,
                "username": username,
                "fullname": fullname,
                "department": department,
                "status": "PENDING",
                "player_id": None,
                "profile_name": None,
                "message": ""
            }

            received_auth = []

            def on_response(response):
                if "client_auth" in response.url and response.request.method.upper() == "POST":
                    try:
                        data = response.json()
                        received_auth.append(data)
                    except Exception as e:
                        received_auth.append({"error": str(e), "status_code": response.status})

            # Gắn listener
            page.on("response", on_response)

            try:
                page.goto(target_url, wait_until="domcontentloaded", timeout=25000)

                # Chờ tối đa 8 giây cho đến khi client_auth phản hồi
                start_time = time.time()
                while not received_auth and (time.time() - start_time) < 8.0:
                    page.wait_for_timeout(300)

                if received_auth:
                    res_data = received_auth[0]
                    is_success = res_data.get("isSuccess", False)
                    val = res_data.get("value") or {}
                    resp_msg = res_data.get("responseMessage") or {}

                    if is_success:
                        auth_result["status"] = "SUCCESS"
                        auth_result["player_id"] = val.get("playerID")
                        auth_result["profile_name"] = val.get("profileName") or val.get("username")
                        auth_result["message"] = "Đăng nhập và nhận lượt chơi thành công"
                        success_count += 1
                        print(f"[{idx:02d}/{total_users:02d}] ✅ STT {stt:02d} | {username:<12} | {fullname:<22} | PlayerID: {auth_result['player_id']}")
                    else:
                        auth_result["status"] = "FAILED"
                        auth_result["message"] = resp_msg.get("message") or "client_auth returned isSuccess=false"
                        fail_count += 1
                        print(f"[{idx:02d}/{total_users:02d}] ❌ STT {stt:02d} | {username:<12} | {fullname:<22} | Lỗi: {auth_result['message']}")
                else:
                    auth_result["status"] = "TIMEOUT"
                    auth_result["message"] = "Không nhận được phản hồi client_auth sau 8s"
                    fail_count += 1
                    print(f"[{idx:02d}/{total_users:02d}] ⚠️ STT {stt:02d} | {username:<12} | {fullname:<22} | Timeout chờ client_auth")

            except Exception as ex:
                auth_result["status"] = "ERROR"
                auth_result["message"] = str(ex)
                fail_count += 1
                print(f"[{idx:02d}/{total_users:02d}] 💥 STT {stt:02d} | {username:<12} | {fullname:<22} | Exception: {ex}")

            finally:
                # Gỡ listener để không bị tích lũy cho lượt sau
                page.remove_listener("response", on_response)

            report_list.append(auth_result)

            # Nghỉ ngắn 200ms giữa các user để tránh nghẽn mạng
            time.sleep(0.2)

        browser.close()

    # Lưu báo cáo JSON
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            "campaign_id": "26",
            "total_users": total_users,
            "success_count": success_count,
            "fail_count": fail_count,
            "results": report_list
        }, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 70)
    print(f"🎉 HOÀN TẤT: {success_count}/{total_users} người chơi đã được kích hoạt thành công!")
    if fail_count > 0:
        print(f"⚠️ Có {fail_count} người chơi gặp lỗi hoặc timeout.")
    print(f"📁 Báo cáo chi tiết đã được lưu tại: {REPORT_FILE}")
    print("=" * 70)

if __name__ == '__main__':
    run_headless_auth()

