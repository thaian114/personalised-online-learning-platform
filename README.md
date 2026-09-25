# Luma English — Frontend

React + JavaScript + CSS, triển khai từ [Figma Luma English](https://www.figma.com/design/gsvAsJNez3sPsdk4ErA9ky). Đây là **frontend dùng dữ liệu mẫu**, không có backend, database hay API xác thực.

Người tiếp tục phát triển: đọc [hướng dẫn bàn giao](docs/HANDOFF.md). Trong code có `TODO(API_...)` chỉ điểm nối backend, `EXTEND(...)` chỉ cách mở rộng và `REUSE(...)` hướng dẫn component/hook dùng chung. Tài liệu gồm model dữ liệu, bản đồ feature, ví dụ sử dụng và cách kiểm tra; các nhãn này là comment, không phải cấu hình bật API.

## Chạy project

Yêu cầu Node.js 22.12+ (đã kiểm tra với Node 24) và npm.

```sh
npm install
npm run dev
```

Mở địa chỉ localhost được Vite in ra. Bản build tĩnh:

```sh
npm run build
npm run preview
```

Khi host thư mục `dist`, cấu hình SPA fallback về `index.html` để các đường dẫn con hoạt động khi tải lại trang.

## Deploy lên Vercel

Bản production: [luma-english-dath.vercel.app](https://luma-english-dath.vercel.app), project `randomme/luma-english-dath`.

Chạy trong thư mục project:

```sh
npx vercel login
npx vercel --prod
```

Chọn preset **Vite**, build command `npm run build`, output `dist`. File `vercel.json` đã cấu hình SPA rewrite để mở trực tiếp hoặc tải lại `/dashboard`, `/courses` và các đường dẫn con. `.vercelignore` loại bản build local, tệp kiểm tra, log và `.env*` khỏi gói upload. Sau lần liên kết đầu tiên, `.vercel/project.json` lưu project đích trên máy; không đưa thư mục này lên Git.

## Tài khoản dùng thử

Ở trang đăng nhập, chọn **Học viên**, **Giảng viên** hoặc **Quản trị viên** để vào nhanh. Có thể đăng nhập bằng các email dưới đây với mật khẩu dùng thử `Demo@123`:

| Vai trò | Email |
| --- | --- |
| Học viên | minhanh@example.com |
| Giảng viên | linhtran@example.com |
| Quản trị viên | admin@example.com |

Đổi tài khoản ở **Hồ sơ → Đăng xuất / Đổi tài khoản mẫu**. **Khôi phục dữ liệu mẫu** đưa trình duyệt về trạng thái ban đầu. Đăng ký chỉ tạo hồ sơ dùng thử; mật khẩu nhập vào không được lưu. Cơ chế phiên và phân quyền trong trình duyệt phục vụ demo, cần thay bằng xác thực/phân quyền phía backend khi tích hợp thật.

## Các luồng đã triển khai

- Học viên: mục tiêu → 20 câu kiểm tra đầu vào → kết quả/lời giải → lộ trình; tìm/lọc khóa học; điều kiện tiên quyết; đăng ký/hủy đăng ký; bài học, tài liệu tải xuống, thảo luận/báo cáo; quiz có tính điểm; nộp bài, xem phản hồi; tiến độ, hồ sơ, thông báo.
- Giảng viên: danh sách/tạo/sửa/xuất bản khóa học; thêm và sửa bài học; chọn video; soạn câu hỏi và đáp án; danh sách bài nộp, lưu nháp, chấm điểm/gửi phản hồi; xem tiến độ học viên.
- Quản trị: tổng quan, tìm/lọc người dùng, cập nhật vai trò/trạng thái, ẩn/hiện khóa học, xử lý báo cáo và nhật ký thao tác.
- Desktop, tablet và mobile dùng cùng component và cùng dữ liệu. Mobile có thanh điều hướng dưới; bảng quản lý chuyển thành thẻ để tránh cuộn ngang.
- Hiệu ứng dùng [Motion for React](https://motion.dev/docs/react): chuyển trang, hover vào/ra, nhấn nút, thông báo và lỗi biểu mẫu. Success/Error có hai âm báo ngắn khác nhau bằng Web Audio, chỉ phát sau thao tác. Nút loa ở trang đăng nhập và thanh trên cùng bật/tắt âm, ghi nhớ lựa chọn trên trình duyệt. Khi hệ điều hành bật giảm chuyển động, app giữ phản hồi màu/độ mờ và bỏ hiệu ứng dịch chuyển; nếu trình duyệt chặn âm thanh, thông báo vẫn hiển thị.

## Dữ liệu và giới hạn của bản frontend

- State dùng React Context và được lưu trong localStorage với khóa `luma-english-demo-v1`. Số liệu là dữ liệu mẫu; tiến độ và điểm quiz được tính từ thao tác thực tế trong demo.
- Quiz, nộp/chấm bài và quản trị cập nhật ngay trên cùng trình duyệt. Không gửi dữ liệu tới máy chủ.
- Tệp bài nộp nhận PDF/DOCX tối đa 10 MB. Tệp video nhận MP4/WebM tối đa 100 MB. Nội dung tệp nằm trong bộ nhớ của phiên hiện tại; localStorage chỉ lưu metadata. Tải lại trang sẽ cần chọn lại tệp để xem nội dung. PDF có xem trước, DOCX tải xuống để xem.
- Khi chưa có video, bài học dùng slide tương tác bằng HTML, có phát/tạm dừng/chọn slide. Nội dung học minh họa được soạn cho demo; chưa phải giáo trình hoàn chỉnh.
- Gợi ý khóa học/lộ trình dùng dữ liệu mẫu. Khi nối API, thay bằng gợi ý và lý do do backend trả về.

## Cấu trúc

```text
src/
  App.jsx            Routes và ranh giới lỗi
  Layout.jsx         Sidebar, header, điều hướng mobile
  components.jsx     Button, Field, Card, Modal, CourseCard, DataTable…
  data.js            Dữ liệu mẫu và quy tắc tính điểm/tiên quyết/tệp
  store.jsx          Phiên demo, state, lưu dữ liệu và thông báo
  feedback.jsx       Thông báo, lỗi có animation và âm báo Web Audio
  styles.css         Tokens từ Figma và responsive CSS
  pages/             Account, Student, Learning, Instructor, Admin
public/icons/        SVG tải từ chính file Figma (Lucide, ISC)
tests/               Kiểm tra logic và luồng trình duyệt
```

Khi có API, thay nguồn dữ liệu trong `store.jsx` và các handler đọc/ghi ở `src/pages/` theo [bản đồ tích hợp](docs/HANDOFF.md#bản-đồ-tích-hợp). `update()` hiện chỉ merge state local. Backend chịu trách nhiệm xác thực, phân quyền, chấm điểm tin cậy, upload và gợi ý lộ trình; UI cần xử lý loading/error và cập nhật từ response.

## Thiết kế và kiểm tra

Đã áp dụng skill **ui-ux-pro-max**: chạy truy vấn design system cho nền tảng học tiếng Anh, tra typography Inter, UX bàn phím/form và hướng dẫn React. Giữ palette Figma `#4F46E5`, `#18243B`, `#F6F7FB`; font Inter tự lưu cùng bản build; icon SVG thống nhất; mục tiêu chạm tối thiểu 44px; focus nhìn thấy; label cho input; modal có focus trap bằng `<dialog>`; hỗ trợ reduced motion.

```sh
npm test
npm run test:e2e
```

E2E dùng Microsoft Edge có sẵn trên Windows, kiểm tra luồng học/quiz, đăng ký khóa học, nộp/chấm bài, xử lý báo cáo và các route ở 375, 768, 1024, 1440px. Máy không có Edge: chạy `npx playwright install chromium`, rồi bỏ `channel: 'msedge'` trong `playwright.config.js`.

Tài liệu công cụ: [React](https://react.dev/learn/build-a-react-app-from-scratch), [Vite](https://vite.dev/guide/).
