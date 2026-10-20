# Luma English — Personalised Online Learning Platform

Nền tảng học trực tuyến cá nhân hóa tiếng Anh (Đồ án tổng hợp môn **CO3103**, Khoa KH&KT Máy tính — Trường Đại học Bách Khoa, ĐHQG-HCM).

Hệ thống bao gồm hai thành phần hoàn chỉnh:
1. **Frontend Web Application**: Triển khai từ [Figma Luma English](https://www.figma.com/design/gsvAsJNez3sPsdk4ErA9ky) bằng React 19 + JavaScript + Vite + CSS Tokens, hỗ trợ đầy đủ Desktop, Tablet và Mobile.
2. **Backend API Service**: Xây dựng bằng Node.js + Express 5 + Prisma ORM + SQLite Database, triển khai các nghiệp vụ từ Module 1 đến Module 3 với bộ kiểm thử tự động 31 test cases (Xem tài liệu chi tiết tại **[src/backend/README.md](src/backend/README.md)**).

---

## 🚀 Hướng dẫn Chạy Dự án ở Local

Yêu cầu môi trường: **Node.js 22+** (hoặc Node 24) và **npm**.

### Bước 0: Di chuyển vào thư mục dự án
Trước khi chạy bất kỳ câu lệnh nào, đảm bảo Terminal của bạn đang ở đúng thư mục mã nguồn:
```sh
cd personalised-online-learning-platform-main
```

### Bước 1: Cài đặt và Chuẩn bị Cơ sở dữ liệu (Lần đầu chạy)
```sh
npm install
npm run prisma:db:push
npm run prisma:seed
```

### Bước 2: Khởi chạy Hệ thống Fullstack

Mở **2 cửa sổ Terminal** (cả 2 đều `cd` vào `personalised-online-learning-platform-main`) chạy song song:

* **Terminal 1: Khởi động Backend API Server (Cổng 5000)**
  ```sh
  node src/backend/server.js
  ```
  👉 Địa chỉ API: `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)

* **Terminal 2: Khởi động Giao diện Frontend (Cổng 5173)**
  ```sh
  npm run dev
  ```
  *(Trên Windows PowerShell, nếu gặp lỗi policy hãy gõ `npm.cmd run dev`)*
  👉 Mở trình duyệt truy cập: **`http://localhost:5173`**

---

## 🧪 Kiểm thử Tự động (Testing)

Dự án có hệ thống kiểm thử tự động toàn diện:
```sh
# Đảm bảo đang ở trong thư mục dự án:
cd personalised-online-learning-platform-main

# Chạy toàn bộ 31 bài test tự động của Backend và Domain Logic
npm test

# Chạy kiểm thử End-to-End với Playwright
npm run test:e2e
```

---

## 🌐 Triển khai Production (Vercel)

Bản demo production giao diện: [luma-english-dath.vercel.app](https://luma-english-dath.vercel.app), project `randomme/luma-english-dath`.

Build bản tĩnh:
```sh
cd personalised-online-learning-platform-main
npm run build
npm run preview
```

---

## 👥 Tài khoản dùng thử

Ở trang đăng nhập, có thể chọn nhanh **Học viên**, **Giảng viên** hoặc **Quản trị viên** hoặc đăng nhập bằng mật khẩu dùng thử `Demo@123`:

| Vai trò | Email | Quyền hạn chính |
| --- | --- | --- |
| **Học viên** | minhanh@example.com | Làm bài test đầu vào, đăng ký khóa học, học bài, làm quiz trắc nghiệm, nộp bài viết |
| **Giảng viên** | linhtran@example.com | Tạo/sửa khóa học, soạn bài học, chấm điểm bài nộp học viên, lưu nháp/công bố điểm |
| **Quản trị viên** | admin@example.com | Tổng quan số liệu, quản lý người dùng, ẩn/hiện khóa học, xử lý báo cáo vi phạm |

---

## 📚 Tài liệu chi tiết các Module

* **[Hướng dẫn Backend & Đặc tả toàn bộ API](src/backend/README.md)**: Cấu trúc cơ sở dữ liệu Prisma, cách seed data, danh mục các endpoint Module 1, 2, 3 và kỹ thuật bảo mật.
* **[Tài liệu Bàn giao Kỹ thuật Frontend](docs/HANDOFF.md)**: Bản đồ tích hợp API, mô hình state, quy ước component và hiệu ứng âm thanh/chuyển động.
