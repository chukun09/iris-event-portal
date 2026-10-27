# -*- coding: utf-8 -*-
import sys
import os
import json
import openpyxl

DEFAULT_EXCEL_PATH = r'C:\Users\longtd\Downloads\tên định danh chuẩn.xlsx'
OUTPUT_JS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'js', 'data.js'))

def sync_data(excel_path=None):
    if not excel_path:
        excel_path = DEFAULT_EXCEL_PATH
    
    if not os.path.exists(excel_path):
        print(f'Khong tim thay file Excel: {excel_path}')
        return False

    print(f'Dang doc du lieu tu: {excel_path}')
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    sheet = wb.active

    dept_list = []
    emp_list = []

    for r in sheet.iter_rows(min_row=2, values_only=True):
        if not any(r): continue
        stt = r[0]
        u = str(r[1]).strip() if r[1] is not None else ''
        fn = str(r[2]).strip() if r[2] is not None else ''
        d = str(r[3]).strip() if r[3] is not None else ''
        note = str(r[4]).strip() if len(r) > 4 and r[4] is not None else ''
        if not u or not fn: continue
        if d and d not in dept_list: dept_list.append(d)
        emp_list.append({'stt': stt, 'username': u, 'fullname': fn, 'department': d, 'note': note})

    content = '/**\n * IRIS 15 Years Event - Employee & Department Data\n */\nwindow.EVENT_DATA = ' + json.dumps({'departments': dept_list, 'employees': emp_list}, ensure_ascii=False, indent=2) + ';\n'
    os.makedirs(os.path.dirname(OUTPUT_JS_PATH), exist_ok=True)
    with open(OUTPUT_JS_PATH, 'w', encoding='utf-8-sig') as f:
        f.write(content)
    print(f'Da xuat {len(dept_list)} phong ban va {len(emp_list)} nhan su vao: {OUTPUT_JS_PATH}')
    return True

if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    p = sys.argv[1] if len(sys.argv) > 1 else None
    sync_data(p)
