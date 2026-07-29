/* =========================================================
   DASHBOARD APP.JS
   - Vẽ 1 biểu đồ đường (Chart.js) + 1 gauge tròn
   - Cập nhật dữ liệu theo thời gian thực
   - Phần fetchLatestData() là nơi bạn sẽ nối vào API/WebSocket
     lấy dữ liệu thật từ PostgreSQL sau này.
   ========================================================= */

const MAX_POINTS = 15;      // số điểm tối đa hiển thị trên chart
const POLL_INTERVAL = 3000; // 3 giây cập nhật 1 lần (chỉnh theo nhu cầu)
const GAUGE_MAX = 40;       // giá trị tối đa của gauge (A), chỉnh theo dữ liệu thật
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 52; // r = 52 trong SVG

let chart;

/* ---------- 1. Khởi tạo biểu đồ đường ---------- */
function initChart() {
  const ctx = document.getElementById('currentChart').getContext('2d');

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Dòng điện (A)',
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
          ticks: { callback: (v) => v + 'A' },
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
  const progress = document.getElementById('gauge-progress');
  const valueLabel = document.getElementById('gauge-value');

  const ratio = Math.min(value / GAUGE_MAX, 1);
  const offset = GAUGE_CIRCUMFERENCE * (1 - ratio);

  progress.style.strokeDasharray = GAUGE_CIRCUMFERENCE;
  progress.style.strokeDashoffset = offset;

  valueLabel.textContent = value.toFixed(2) + 'A';
}

/* ---------- 4. Cập nhật thẻ CO2 (ví dụ) ---------- */
function updateCO2(value) {
  document.getElementById('co2-value').textContent = value.toFixed(3) + ' tCO2/MWh';
}

/* =========================================================
   5. LẤY DỮ LIỆU THẬT
   -------------------------------------------------------
   Đây là nơi bạn thay bằng cách lấy dữ liệu thật, ví dụ:

   a) Gọi REST API (backend đọc từ PostgreSQL):
      async function fetchLatestData() {
        const res = await fetch('/api/latest-reading');
        return await res.json(); // { current: 23.5, co2: 20215.4 }
      }

   b) Dùng WebSocket để nhận real-time (khuyến nghị cho dashboard
      cập nhật liên tục, tránh polling tốn tài nguyên):

      const socket = new WebSocket('wss://your-backend/ws');
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleNewData(data);
      };

   Hiện tại mình để hàm giả lập (mock) để bạn xem giao diện
   chạy được ngay. Khi có backend, chỉ cần thay nội dung hàm
   fetchLatestData() bên dưới.
   ========================================================= */
async function fetchLatestData() {
  // MOCK DATA - xoá đoạn này khi đã có API/WebSocket thật
  const current = 20 + Math.random() * 10;
  const co2 = 20000 + Math.random() * 500;
  return { current, co2 };
}

function handleNewData(data) {
  const now = new Date();
  const timeLabel = now.toLocaleTimeString('vi-VN', { hour12: false });

  updateChart(timeLabel, data.current);
  updateGauge(data.current);
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