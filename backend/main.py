from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2

app = Flask(__name__)
CORS(app)  # Cho phép frontend (chạy ở origin/port khác) gọi được API này

# Cấu hình kết nối PostgreSQL
DB_CONFIG = {
    "dbname": "test_iot_db",  # Sửa tên database của bạn vào đây
    "user": "test_iot",
    "password": "123456789",  # Sửa mật khẩu user test_iot
    "host": "45.119.87.151",  # Nếu DB chạy cùng máy với file Python này
    "port": "5432"  # Port mặc định của PostgreSQL
}

@app.route('/api/get-latest-real', methods=['GET'])
def get_latest_real():
    conn = None
    cursor = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Lấy giá trị cột "real" mới nhất. 
        # LƯU Ý: Đang giả định bảng của bạn có cột 'id' tự động tăng. 
        # Nếu bảng của bạn dùng cột thời gian, hãy đổi 'id' thành tên cột thời gian đó.
        select_query = """
            SELECT "real" 
            FROM public."test_wifi" 
            ORDER BY id DESC 
            LIMIT 1
        """
        
        cursor.execute(select_query)
        result = cursor.fetchone() # Lấy 1 dòng kết quả đầu tiên
        
        if result:
            latest_value = result[0]
            print(f"'voltage': {latest_value}")
            return jsonify({
                "status": "success", 
                "voltage": latest_value
            }), 200
        else:
            print("Bảng test_wifi hiện chưa có dữ liệu")
            return jsonify({
                "status": "error", 
                "message": "Bảng test_wifi hiện chưa có dữ liệu"
            }), 404

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()

if __name__ == '__main__':
    # host='0.0.0.0' cho phép các thiết bị khác trong mạng LAN (ESP32) gọi được API này
    # Nếu chỉ để '127.0.0.1' thì ESP32 sẽ không thể kết nối.
    app.run(host='127.0.0.1', port=5000, debug=False)