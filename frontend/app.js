/* =========================================================
   DASHBOARD APP.JS
   - Vẽ 1 biểu đồ đường (Chart.js) + 1 gauge tròn
   - Cập nhật dữ liệu theo thời gian thực
   - Phần fetchLatestData() là nơi bạn sẽ nối vào API/WebSocket
     lấy dữ liệu thật từ PostgreSQL sau này.
   ========================================================= */

// Địa chỉ API backend (main.py). Đổi thành IP/host thực tế của server Flask
// nếu frontend được host ở nơi khác với backend.
const API_BASE_URL = 'http://192.168.1.23:5000';

const MAX_POINTS = 15;      // số điểm tối đa hiển thị trên chart
const POLL_INTERVAL = 3000; // 3 giây cập nhật 1 lần (chỉnh theo nhu cầu)
const GAUGE_MAX = 40;       // (hiện chưa dùng tới, gauge chỉ hiển thị số)
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 52; // (hiện chưa dùng tới, xem ghi chú cuối file)

let chart;

/* ---------- 1. Khởi tạo biểu đồ đường ---------- */
function initChart() {
  const ctx = document.getElementById('currentChart').getContext('2d');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Điện áp (V)',
        data: [],
        borderColor: '#4457c9',
        backgroundColor: 'rgba(68, 87, 201, 0.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#4457c9',
        tension: 0.35,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      animation: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: { callback: (v) => v + 'V' },
          grid: { color: '#f0f2f8' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

/* ---------- 2. Cập nhật biểu đồ đường ---------- */
function updateChart(timeLabel, value) {
  chart.data.labels.push(timeLabel);
  chart.data.datasets[0].data.push(value);

  if (chart.data.labels.length > MAX_POINTS) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update();
}

/* ---------- 3. Cập nhật gauge tròn ---------- */
function updateGauge(value) {
  const valueLabel = document.getElementById('gauge-value');
  valueLabel.textContent = value.toFixed(2) + 'V';
}
/* ---------- 4. Cập nhật thẻ CO2 (ví dụ) ---------- */
function updateCO2(value) {
  document.getElementById('co2-value').textContent = value.toFixed(3) + ' tCO2/MWh';
}

/* =========================================================
   5. LẤY DỮ LIỆU THẬT TỪ BACKEND (main.py -> PostgreSQL)
   -------------------------------------------------------
   Endpoint thật ở main.py là GET /api/get-latest-real và trả về:
     { "status": "success", "voltage": <số> }
   Chú ý: backend hiện KHÔNG có dữ liệu CO2, nên phần CO2 bên dưới
   vẫn đang là số giả lập (mock) — cần bổ sung endpoint CO2 ở
   backend rồi thay đoạn mock đó sau.
   ========================================================= */
async function fetchLatestData() {
  const res = await fetch(`${API_BASE_URL}/api/get-latest-real`);

  if (!res.ok) {
    throw new Error(`API trả về lỗi: ${res.status}`);
  }

  const json = await res.json();

  if (json.status !== 'success') {
    throw new Error(json.message || 'Không lấy được dữ liệu');
  }

  // TODO: chưa có endpoint CO2 thật ở backend -> tạm thời vẫn mock
  const co2 = 20000 + Math.random() * 500;

  return { voltage: json.voltage, co2 };
}

function handleNewData(data) {
  const now = new Date();
  const timeLabel = now.toLocaleTimeString('vi-VN', { hour12: false });

  updateChart(timeLabel, data.voltage);
  updateGauge(data.voltage);
  updateCO2(data.co2);
}

/* ---------- 6. Vòng lặp cập nhật real-time (polling) ---------- */
function startPolling() {
  handleNewData_wrapper(); // gọi ngay lần đầu
  setInterval(handleNewData_wrapper, POLL_INTERVAL);
}

async function handleNewData_wrapper() {
  try {
    const data = await fetchLatestData();
    handleNewData(data);
  } catch (err) {
    console.error('Lỗi khi lấy dữ liệu:', err);
  }
}

/* ---------- 7. Khởi động ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initChart();
  startPolling();
});
