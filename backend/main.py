import sys
import json
import psycopg2

DB_CONFIG = {
    "dbname": "test_iot_db",
    "user": "test_iot",
    "password": "123456789",
    "host": "45.119.87.151",
    "port": "5432"
}

def get_latest_real():
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute(
            'SELECT "real" FROM public."test_wifi" ORDER BY id DESC LIMIT 1'
        )
        result = cursor.fetchone()
        if result:
            return {"status": "success", "voltage": float(result[0])}
        else:
            return {"status": "error", "message": "Bảng test_wifi chưa có dữ liệu"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()

def main():
    # Đọc lệnh liên tục từ stdin, mỗi dòng là 1 lệnh
    for line in sys.stdin:
        command = line.strip()

        if command == "get_latest_voltage":
            response = get_latest_real()
        else:
            response = {"status": "error", "message": f"Lệnh không hợp lệ: {command}"}

        # In kết quả ra stdout dạng JSON, mỗi kết quả 1 dòng
        print(json.dumps(response), flush=True)

if __name__ == "__main__":
    main()