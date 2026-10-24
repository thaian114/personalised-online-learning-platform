# Luma English Platform — Backend API Service

Tài liệu kỹ thuật và hướng dẫn vận hành hệ thống máy chủ Backend cho nền tảng học trực tuyến **Luma English** (Phục vụ đồ án môn **CO3103 – Đồ án tổng hợp**, Khoa Khoa học & Kỹ thuật Máy tính — Trường Đại học Bách Khoa, ĐHQG-HCM).

---

## 1. Tổng quan & Kiến trúc hệ thống

Backend được xây dựng theo kiến trúc **Modular / Feature-based Architecture** (chia theo từng gói nghiệp vụ độc lập), sử dụng công nghệ:

- **Runtime**: Node.js (ECMAScript Modules - ESM)
- **Web Framework**: Express.js 5.x
- **ORM & Database**: Prisma ORM 5.x kết hợp cơ sở dữ liệu quan hệ SQLite (`dev.db`).
- **Testing Framework**: Node.js Built-in Test Runner (`node:test` & `node:assert/strict`) — không phụ thuộc thư viện test bên thứ 3.

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
    ├── courses/                    # MODULE 1: Quản lý Danh mục Khóa học & Bài học
    │   ├── courses.controller.js
    │   ├── courses.service.js
    │   └── courses.validation.js
    ├── enrollment/                 # MODULE 2: Đăng ký học & Theo dõi Tiến độ
    │   ├── enrollment.controller.js
    │   └── enrollment.service.js
    ├── assessments/                # MODULE 3: Đánh giá, Trắc nghiệm, Placement Test & Chấm bài
    │   ├── assessments.controller.js
    │   └── assessments.service.js
    ├── admin/                      # MODULE 4.6: Quản trị & Báo cáo Số liệu Khóa học
    │   ├── admin.controller.js
    │   └── admin.service.js
    └── path/                       # MODULE 4: Thành phần Nâng cao (Lộ trình DAG & Gợi ý học tập)
        ├── path.service.js
        ├── recommendation.service.js
        └── path.controller.js
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

_(Hoặc dùng lệnh trực tiếp: `npx.cmd prisma db push --schema=src/backend/prisma/schema.prisma`)_

### Bước 3: Nạp dữ liệu mẫu ban đầu (Seed Data)

Lệnh này sẽ nạp sẵn tài khoản học viên, giảng viên, các khóa học chuẩn, ngân hàng câu hỏi quiz và đề kiểm tra đầu vào 20 câu:

```bash
npm run prisma:seed
```

_(Hoặc dùng lệnh trực tiếp: `node src/backend/seed.js`)_

### Bước 4: Khởi động Backend Server

```bash
node src/backend/server.js
```

Server sẽ chạy tại địa chỉ: **`http://localhost:5000`**

- Kiểm tra trạng thái hoạt động: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- Xem danh mục khóa học: [http://localhost:5000/api/courses](http://localhost:5000/api/courses)

---

## 3. Hướng dẫn Chạy Kiểm thử Tự động (Automated Testing)

Hệ thống được trang bị bộ test tự động toàn diện gồm **46 bài test** kiểm thử từ Unit test đến Integration test:

```bash
# Đảm bảo đang ở trong thư mục dự án:
cd personalised-online-learning-platform-main

# Chạy toàn bộ 46 bài test trong một lệnh:
npm run test:all
```

### Hoặc chạy kiểm thử riêng từng Module:

1. **Kiểm thử Module 1 (Khóa học & Bài học - 7 test cases)**:
   ```bash
   node --test tests/courses.test.js
   ```
2. **Kiểm thử Module 2 (Đăng ký học & Tiến độ - 13 test cases)**:
   ```bash
   node --test tests/enrollment.test.js
   ```
3. **Kiểm thử Module 3 (Đánh giá, Trắc nghiệm & Chấm điểm - 8 test cases)**:
   ```bash
   node --test tests/assessments.test.js
   ```
4. **Kiểm thử Module 4 (Thành phần nâng cao: Lộ trình DAG & Gợi ý - 8 test cases)**:
   ```bash
   node --test tests/path.test.js
   ```
5. **Kiểm thử Module 4.6 (Quản trị & Báo cáo Số liệu Khóa học - 6 test cases)**:
   ```bash
   node --test tests/admin.test.js
   ```
6. **Kiểm thử logic miền nghiệp vụ Frontend (4 test cases)**:
   ```bash
   node --test tests/domain.test.js
   ```

---

## 4. Đặc tả toàn bộ API Endpoints (API Reference)

Lưu ý về tính tương thích URL: Toàn bộ endpoint của hệ thống đều hỗ trợ đồng thời cả hai dạng đường dẫn: có tiền tố `/api/...` (ví dụ `/api/courses`) hoặc gọi trực tiếp ở gốc `/...` (ví dụ `/courses`).

---

### MODULE 1: Khóa học & Bài học (Courses & Lessons)

| Method | Endpoint                                        |     Quyền hạn     | Mô tả                                                                                                                                            |
| :----- | :---------------------------------------------- | :---------------: | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/courses`                                  |      Public       | Lấy danh sách khóa học `published`. Hỗ trợ: `?level=`, `?category=`, `?search=` (chuẩn hóa tiếng Việt không dấu), phân trang `?page=1&limit=20`. |
| `GET`  | `/api/courses/:id`                              |      Public       | Lấy chi tiết khóa học, chuẩn đầu ra `outcomes`, thời lượng và đề cương bài học `lessons`.                                                        |
| `GET`  | `/api/instructor/courses`                       | Giảng viên, Admin | Lấy danh sách khóa học do giảng viên phụ trách (kèm số học viên đã đăng ký).                                                                     |
| `POST` | `/api/instructor/courses`                       | Giảng viên, Admin | Tạo khóa học mới (mặc định trạng thái `draft`). Body: `{ title, description, level, category, hours, outcomes, prerequisiteId }`.                |
| `PUT`  | `/api/instructor/courses/:id`                   | Giảng viên, Admin | Chỉnh sửa thông tin, thiết lập khóa tiên quyết (có chống vòng lặp), đổi trạng thái (`draft` sang `published`).                                   |
| `POST` | `/api/instructor/courses/:id/lessons`           | Giảng viên, Admin | Thêm bài học mới vào đề cương (tự động đánh số thứ tự và cập nhật thời lượng khóa).                                                              |
| `PUT`  | `/api/instructor/courses/:id/lessons/:lessonId` | Giảng viên, Admin | Sửa tiêu đề bài học, nội dung lý thuyết, cập nhật link video hoặc tài liệu tóm tắt.                                                              |

---

### MODULE 2: Đăng ký học & Tiến độ (Enrollment & Progress)

| Method   | Endpoint                                      | Quyền hạn | Mô tả                                                                                                                                                                                                           |
| :------- | :-------------------------------------------- | :-------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST`   | `/api/courses/:id/enroll`                     | Học viên  | **Ràng buộc tiên quyết 100% kèm Miễn trừ Placement Test**: Yêu cầu hoàn thành 100% khóa học tiên quyết trước khi đăng ký. Nếu học viên đạt điểm cao trong bài kiểm tra đầu vào (Trình độ B1 miễn tiên quyết Cơ bản; Trình độ B2 miễn toàn bộ), hệ thống tự động cho phép đăng ký trực tiếp. |
| `DELETE` | `/api/courses/:id/unenroll`                   | Học viên  | **Bảo lưu tiến độ**: Hủy đăng ký khóa học nhưng giữ nguyên lịch sử học tập trong DB để khi đăng ký lại không bị mất tiến độ.                                                                                    |
| `GET`    | `/api/me/enrollments`                         | Học viên  | Lấy danh sách ID các khóa học viên hiện tại đang theo học.                                                                                                                                                      |
| `POST`   | `/api/courses/:id/lessons/:lessonId/complete` | Học viên  | **Cơ chế Idempotent**: Đánh dấu hoàn thành bài học an toàn (không bị lỗi hoặc tăng trùng khi click nhiều lần), tự động tính lại % tiến độ khóa.                                                                 |
| `GET`    | `/api/me/progress`                            | Học viên  | Lấy bảng tổng hợp tiến độ học tập trên tất cả các khóa (danh sách bài đã xong và % từng khóa).                                                                                                                  |

---

### MODULE 3: Đánh giá & Chấm điểm (Assessments & Quizzes)

| Method | Endpoint                                            |     Quyền hạn     | Mô tả                                                                                                                                           |
| :----- | :-------------------------------------------------- | :---------------: | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/courses/:id/lessons/:lessonId/quiz`           | Public / Học viên | **Bảo mật**: Lấy câu hỏi trắc nghiệm bài học. Server **loại bỏ hoàn toàn 2 trường `answer` và `explanation`** để chống gian lận F12.            |
| `POST` | `/api/courses/:id/lessons/:lessonId/quiz/submit`    |     Học viên      | Nộp bài làm trắc nghiệm: Server chấm điểm tự động, lưu vào bảng `QuizResult`, trả về điểm số thang 10, % và lời giải thích chi tiết.            |
| `GET`  | `/api/placement/test`                               | Public / Học viên | Lấy 20 câu hỏi kiểm tra đánh giá năng lực đầu vào (đã loại bỏ đáp án).                                                                          |
| `POST` | `/api/placement/submit`                             |     Học viên      | Chấm điểm 20 câu, **tự động phân loại trình độ CEFR** (`<40%: A1`, `40-60%: A2`, `60-80%: B1`, `>80%: B2`) và cập nhật trường `level` của User. |
| `POST` | `/api/courses/:id/assignments/:assignmentId/submit` |     Học viên      | Nộp bài tập tự luận/tệp. Tự động so khớp thời gian với deadline `due`, nếu quá hạn sẽ tự gắn cờ **`late: true`**.                               |
| `GET`  | `/api/instructor/submissions`                       | Giảng viên, Admin | Giảng viên xem danh sách các bài nộp cần chấm, lọc theo khóa học hoặc trạng thái (`pending`, `draft`, `graded`).                                |
| `PUT`  | `/api/instructor/submissions/:id/grade`             | Giảng viên, Admin | Chấm điểm bài nộp (thang 0–10), lưu nhận xét `feedback`, hỗ trợ lưu nháp (`draft`) hoặc công bố điểm chính thức (`graded`).                     |

---

### MODULE 4: Thành phần Nâng cao — Lộ trình Đồ thị DAG & Gợi ý Cá nhân hóa (Advanced Component)

| Method | Endpoint                         |   Quyền hạn    | Mô tả                                                                                                                                                                                                                                                                                                                                                                                             |
| :----- | :------------------------------- | :------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/api/path/me`                   |    Học viên    | **Thuật toán Đồ thị sinh Lộ trình (DAG & Topological Sort)**: Dựng đồ thị khóa học dựa trên `prerequisiteId`, sắp xếp theo thứ tự Topo bằng giải thuật Kahn. Tự động phân loại trạng thái từng node: `completed` (đã xong 100%), `unlocked` (sẵn sàng học ngay, bao gồm các khóa học được mở khóa thích ứng nhờ đạt trình độ B1/B2 qua Placement Test), `locked` (bị khóa kèm thông tin khóa tiên quyết). Khóa bắt đầu được cá nhân hóa theo trình độ CEFR từ Placement Test. |
| `GET`  | `/api/recommendations`           |    Học viên    | **Động cơ Gợi ý Đa Tiêu chí có Giải thích (Explainable Multi-factor Scoring)**: Tính điểm ưu tiên theo công thức $Score = 0.4 \times S_{goal} + 0.3 \times S_{level} + 0.2 \times S_{prereq} + 0.1 \times S_{history}$. Tự động sinh mảng chuỗi giải thích lý do minh bạch (`reasons: string[]`). Lọc bỏ các khóa đã hoàn thành 100%.                                                             |
| `GET`  | `/api/recommendations/benchmark` | Public / Admin | **Đánh giá Thực nghiệm Đối chuẩn (Baseline Comparison)**: So sánh thuật toán cá nhân hóa với mô hình cơ sở phổ biến nhất (Most Popular Baseline) trên 3 Persona người học (A1, B1, B2). Đo lường 2 chỉ số định lượng: Độ phù hợp (Relevance Rate) và Tính khả thi điều kiện tiên quyết (Prerequisite Feasibility Rate) để đưa vào Báo cáo cuối kỳ.                                                |
| `PUT`  | `/api/me/goal`                   |    Học viên    | Cập nhật mục tiêu học tập của học viên trong database (`Củng cố nền tảng`, `Giao tiếp hằng ngày`, `Học tập và công việc`, `Chuẩn bị thi cử`).                                                                                                                                                                                                                                                     |

---

### MODULE 4.6: Quản trị & Báo cáo Số liệu Khóa học (Admin & Course Statistics)

| Method | Endpoint                        | Quyền hạn | Mô tả                                                                                                                                                                                                                                                                          |
| :----- | :------------------------------ | :-------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/admin/courses/stats`      |   Admin   | Báo cáo số liệu tổng quan toàn sàn: tổng khóa học (phân theo published/draft/hidden), tổng bài học, tổng người dùng, tổng lượt đăng ký, tỷ lệ hoàn thành trung bình, kết quả trắc nghiệm và bài tập nộp. Kèm thống kê chi tiết từng khóa học, phân bố theo danh mục và cấp độ. |
| `GET`  | `/api/admin/courses`            |   Admin   | Lấy danh sách khóa học kèm chỉ số người học thực tế (`enrolledCount`), số người đã hoàn thành 100% (`completedLearnersCount`), và tiến độ trung bình (`averageProgress`).                                                                                                      |
| `PUT`  | `/api/admin/courses/:id/status` |   Admin   | Cập nhật nhanh trạng thái hiển thị của khóa học (`published`, `hidden`, `draft`).                                                                                                                                                                                              |

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
5. **Thống kê tổng hợp thời gian thực (Real-time Metric Aggregation)**:
   Tính toán tức thời tỷ lệ hoàn thành (`completionRate`) và tiến độ trung bình (`averageProgress`) trực tiếp từ bảng quan hệ, bảo đảm tính nhất quán dữ liệu cho báo cáo quản trị.
6. **Thuật toán Đồ thị Topo & Gợi ý Đa tiêu chí có Giải thích (DAG & Explainable Scoring)**:
   Giải thuật Kahn sắp xếp thứ tự tiên quyết không chu trình, kết hợp mô hình chấm điểm 4 trọng số và chuỗi giải thích tự nhiên minh bạch, có đối chuẩn định lượng với Baseline theo chuẩn Rubric Bách Khoa.
7. **Cơ chế Mở khóa Thích ứng theo Năng lực đầu vào (Adaptive Placement Exemption)**:
   Người học đạt điểm cao trong bài kiểm tra phân loại đầu vào (B1 đạt từ 60%, B2 đạt trên 80%) được tự động miễn điều kiện tiên quyết nền tảng, mở khóa ngay các khóa học Trung cấp và Nâng cao tương ứng trên cả giao diện và API đăng ký học.
