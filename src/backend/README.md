# Luma English Platform — Backend API Service

Tài liệu kỹ thuật và hướng dẫn vận hành hệ thống máy chủ Backend cho nền tảng học trực tuyến **Luma English** (Phục vụ đồ án môn **CO3103 – Đồ án tổng hợp**, Khoa Khoa học & Kỹ thuật Máy tính — Trường Đại học Bách Khoa, ĐHQG-HCM).

---

## 1. Tổng quan & Kiến trúc hệ thống

Backend được xây dựng theo kiến trúc **Modular / Feature-based Architecture** (chia theo từng gói nghiệp vụ độc lập), sử dụng công nghệ:
* **Runtime**: Node.js (ECMAScript Modules - ESM)
* **Web Framework**: Express.js 5.x
* **ORM & Database**: Prisma ORM 5.x kết hợp cơ sở dữ liệu quan hệ SQLite (`dev.db`).
* **Testing Framework**: Node.js Built-in Test Runner (`node:test` & `node:assert/strict`) — không phụ thuộc thư viện test bên thứ 3.

### Cấu trúc thư mục mã nguồn:
```text
src/backend/
├── app.js                          # Cấu hình Express App, Middlewares, Global Error Handler
├── server.js                       # Điểm khởi chạy server lắng nghe cổng 5000
├── seed.js                         # Kịch bản nạp dữ liệu mẫu ban đầu (Users, Courses, Quizzes...)
├── db/
│   └── prisma.js                   # Prisma Client singleton kết nối Database
├── middleware/
│   └── auth.js                     # Middleware xác thực JWT / Mock Header (requireAuth, requireRole)
├── prisma/
│   └── schema.prisma               # Định nghĩa mô hình dữ liệu quan hệ (ERD Schema)
└── modules/
    ├── courses/                    # ⭐ MODULE 1: Quản lý Danh mục Khóa học & Bài học
    │   ├── courses.controller.js
    │   ├── courses.service.js
    │   └── courses.validation.js
    ├── enrollment/                 # ⭐ MODULE 2: Đăng ký học & Theo dõi Tiến độ
    │   ├── enrollment.controller.js
    │   └── enrollment.service.js
    └── assessments/                # ⭐ MODULE 3: Đánh giá, Trắc nghiệm, Placement Test & Chấm bài
        ├── assessments.controller.js
        └── assessments.service.js
```

---

## 2. Hướng dẫn Cài đặt & Khởi chạy nhanh (Quickstart)

### Bước 0: Di chuyển vào thư mục dự án
Trước khi chạy bất kỳ câu lệnh nào, hãy đảm bảo Terminal đang ở đúng thư mục mã nguồn của dự án:
```bash
cd personalised-online-learning-platform-main
```

### Bước 1: Cài đặt thư viện phụ thuộc
```bash
npm install
```

### Bước 2: Đồng bộ cấu trúc Cơ sở dữ liệu
Lệnh này sẽ tạo file database SQLite `dev.db` và các bảng tương ứng theo schema:
```bash
npm run prisma:db:push
```
*(Hoặc dùng lệnh trực tiếp: `npx.cmd prisma db push --schema=src/backend/prisma/schema.prisma`)*

### Bước 3: Nạp dữ liệu mẫu ban đầu (Seed Data)
Lệnh này sẽ nạp sẵn tài khoản học viên, giảng viên, các khóa học chuẩn, ngân hàng câu hỏi quiz và đề kiểm tra đầu vào 20 câu:
```bash
npm run prisma:seed
```
*(Hoặc dùng lệnh trực tiếp: `node src/backend/seed.js`)*

### Bước 4: Khởi động Backend Server
```bash
node src/backend/server.js
```
👉 Server sẽ chạy tại địa chỉ: **`http://localhost:5000`**
* Kiểm tra trạng thái hoạt động: [http://localhost:5000/api/health](http://localhost:5000/api/health)
* Xem danh mục khóa học: [http://localhost:5000/api/courses](http://localhost:5000/api/courses)

---

## 3. Hướng dẫn Chạy Kiểm thử Tự động (Automated Testing)

Hệ thống được trang bị bộ test tự động toàn diện gồm **31 bài test** kiểm thử từ Unit test đến Integration test:

```bash
# Đảm bảo đang ở trong thư mục dự án:
cd personalised-online-learning-platform-main

# Chạy toàn bộ 31 bài test trong một lệnh:
node --test tests/courses.test.js tests/enrollment.test.js tests/assessments.test.js tests/domain.test.js
```

### Hoặc chạy kiểm thử riêng từng Module:
1. **Kiểm thử Module 1 (Khóa học & Bài học - 7 test cases)**:
   ```bash
   node --test tests/courses.test.js
   ```
2. **Kiểm thử Module 2 (Đăng ký học & Tiến độ - 12 test cases)**:
   ```bash
   node --test tests/enrollment.test.js
   ```
3. **Kiểm thử Module 3 (Đánh giá, Trắc nghiệm & Chấm điểm - 8 test cases)**:
   ```bash
   node --test tests/assessments.test.js
   ```
4. **Kiểm thử logic miền nghiệp vụ Frontend (4 test cases)**:
   ```bash
   node --test tests/domain.test.js
   ```

---

## 4. Đặc tả toàn bộ API Endpoints (API Reference)

> 💡 **Tính tương thích URL**: Toàn bộ endpoint của hệ thống đều hỗ trợ đồng thời cả hai dạng đường dẫn: có tiền tố `/api/...` (ví dụ `/api/courses`) hoặc gọi trực tiếp ở gốc `/...` (ví dụ `/courses`).

---

### ⭐ MODULE 1: Khóa học & Bài học (Courses & Lessons)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/courses` | Public | Lấy danh sách khóa học `published`. Hỗ trợ: `?level=`, `?category=`, `?search=` (chuẩn hóa tiếng Việt không dấu), phân trang `?page=1&limit=20`. |
| `GET` | `/api/courses/:id` | Public | Lấy chi tiết khóa học, chuẩn đầu ra `outcomes`, thời lượng và đề cương bài học `lessons`. |
| `GET` | `/api/instructor/courses` | Giảng viên, Admin | Lấy danh sách khóa học do giảng viên phụ trách (kèm số học viên đã đăng ký). |
| `POST` | `/api/instructor/courses` | Giảng viên, Admin | Tạo khóa học mới (mặc định trạng thái `draft`). Body: `{ title, description, level, category, hours, outcomes, prerequisiteId }`. |
| `PUT` | `/api/instructor/courses/:id` | Giảng viên, Admin | Chỉnh sửa thông tin, thiết lập khóa tiên quyết (có chống vòng lặp), đổi trạng thái (`draft` ➔ `published`). |
| `POST` | `/api/instructor/courses/:id/lessons` | Giảng viên, Admin | Thêm bài học mới vào đề cương (tự động đánh số thứ tự và cập nhật thời lượng khóa). |
| `PUT` | `/api/instructor/courses/:id/lessons/:lessonId` | Giảng viên, Admin | Sửa tiêu đề bài học, nội dung lý thuyết, cập nhật link video hoặc tài liệu tóm tắt. |

---

### ⭐ MODULE 2: Đăng ký học & Tiến độ (Enrollment & Progress)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/courses/:id/enroll` | Học viên | **Ràng buộc tiên quyết 100%**: Kiểm tra nếu khóa có `prerequisiteId`, học viên phải học đủ 100% bài của khóa trước. Nếu chưa đủ, trả về ngay lỗi **`400 Bad Request`** ("Chưa hoàn thành khóa học tiên quyết"). |
| `DELETE` | `/api/courses/:id/unenroll` | Học viên | **Bảo lưu tiến độ**: Hủy đăng ký khóa học nhưng giữ nguyên lịch sử học tập trong DB để khi đăng ký lại không bị mất tiến độ. |
| `GET` | `/api/me/enrollments` | Học viên | Lấy danh sách ID các khóa học viên hiện tại đang theo học. |
| `POST` | `/api/courses/:id/lessons/:lessonId/complete` | Học viên | **Cơ chế Idempotent**: Đánh dấu hoàn thành bài học an toàn (không bị lỗi hoặc tăng trùng khi click nhiều lần), tự động tính lại % tiến độ khóa. |
| `GET` | `/api/me/progress` | Học viên | Lấy bảng tổng hợp tiến độ học tập trên tất cả các khóa (danh sách bài đã xong và % từng khóa). |

---

### ⭐ MODULE 3: Đánh giá & Chấm điểm (Assessments & Quizzes)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/courses/:id/lessons/:lessonId/quiz` | Public / Học viên | **Bảo mật tuyệt đối**: Lấy câu hỏi trắc nghiệm bài học. Server **loại bỏ hoàn toàn 2 trường `answer` và `explanation`** để chống gian lận F12. |
| `POST` | `/api/courses/:id/lessons/:lessonId/quiz/submit` | Học viên | Nộp bài làm trắc nghiệm: Server chấm điểm tự động, lưu vào bảng `QuizResult`, trả về điểm số thang 10, % và lời giải thích chi tiết. |
| `GET` | `/api/placement/test` | Public / Học viên | Lấy 20 câu hỏi kiểm tra đánh giá năng lực đầu vào (đã loại bỏ đáp án). |
| `POST` | `/api/placement/submit` | Học viên | Chấm điểm 20 câu, **tự động phân loại trình độ CEFR** (`<40%: A1`, `40-60%: A2`, `60-80%: B1`, `>80%: B2`) và cập nhật trường `level` của User. |
| `POST` | `/api/courses/:id/assignments/:assignmentId/submit` | Học viên | Nộp bài tập tự luận/tệp. Tự động so khớp thời gian với deadline `due`, nếu quá hạn sẽ tự gắn cờ **`late: true`**. |
| `GET` | `/api/instructor/submissions` | Giảng viên, Admin | Giảng viên xem danh sách các bài nộp cần chấm, lọc theo khóa học hoặc trạng thái (`pending`, `draft`, `graded`). |
| `PUT` | `/api/instructor/submissions/:id/grade` | Giảng viên, Admin | Chấm điểm bài nộp (thang 0–10), lưu nhận xét `feedback`, hỗ trợ lưu nháp (`draft`) hoặc công bố điểm chính thức (`graded`). |

---

## 5. Các điểm nổi bật về Kỹ nghệ Phần mềm & Bảo mật

1. **Chuẩn hóa tìm kiếm Tiếng Việt không dấu (`normalizeSearch`)**: 
   Sử dụng cơ chế chuẩn hóa NFD giúp người dùng tìm kiếm linh hoạt (`"giao tiep"` tìm đúng `"Giao tiếp"`).
2. **Cơ chế Idempotency trong ghi nhận tiến độ**:
   Sử dụng Prisma `upsert` trên composite key `@@unique([userId, courseId, lessonId])` đảm bảo tính toàn vẹn dữ liệu ngay cả khi người dùng spam click hoặc mạng chập chờn.
3. **Chống gian lận lộ đề thi phía Client (Server-side Grading)**:
   Đáp án trắc nghiệm không bao giờ được gửi về máy người dùng trước khi nộp bài. Toàn bộ quá trình tính điểm, xếp loại trình độ và đánh giá hạn nộp diễn ra 100% tại Server.
4. **Header giả lập môi trường Test linh hoạt**:
   Bên cạnh chuẩn JWT Token, hệ thống hỗ trợ header phát triển `x-user-id` và `x-user-role`, giúp việc viết kịch bản kiểm thử tự động diễn ra nhanh chóng và độc lập.
