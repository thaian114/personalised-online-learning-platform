# Bàn giao Luma English Frontend

Project dùng React + JavaScript + Vite. Các luồng hiện chạy bằng dữ liệu demo trong trình duyệt. Chưa có API client, endpoint backend hoặc công tắc `mock/api`. Các nhãn dưới đây là comment hướng dẫn teammate tiếp tục công việc; chúng không bật/tắt tính năng khi chạy app.

Chạy project, tài khoản mẫu và deploy: xem [README](../README.md). Đọc phần **Bản đồ tích hợp** trước khi nhận một feature.

## Tìm flag trong code

| Nhãn            | Ý nghĩa                                                      | Khi hoàn thành                                                                   |
| --------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `TODO(API_...)` | Chỗ đang dùng dữ liệu/thao tác local và cần nối backend      | Bỏ TODO sau khi cả đọc, ghi, lỗi và quyền truy cập đã được kiểm tra với API thật |
| `EXTEND(...)`   | Giới hạn hiện tại và các phần phải sửa cùng nhau khi mở rộng | Chỉ triển khai khi nhóm chọn mở rộng feature đó                                  |
| `REUSE(...)`    | Cách sử dụng code dùng chung đã có                           | Giữ hướng dẫn đúng với component/hook sau mỗi thay đổi                           |

Tìm toàn bộ hoặc một nhóm cụ thể, chạy từ thư mục project:

```sh
rg -n 'TODO\(API_|EXTEND\(|REUSE\(' src
rg -n 'TODO\(API_QUIZ\)' src
rg -n 'EXTEND\(ASSESSMENTS\)' src
```

## Dữ liệu đang đi đâu?

`Page handler → update(partialState) → StoreProvider.state → UI + localStorage`.

`keepFile(id, file) → files.current (Map) → blob URL để xem/tải trong phiên`.

| File                                                                         | Trách nhiệm hiện tại                                                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [data.js](../src/data.js)                                                    | Seed demo, cấu trúc state, tách dữ liệu học viên khi đổi tài khoản, helper chấm điểm/tiến độ/tiên quyết            |
| [store.jsx](../src/store.jsx)                                                | Đọc/lưu localStorage, merge state, giữ tệp trong bộ nhớ, notification UI và tùy chọn âm thanh                      |
| [pages](../src/pages)                                                        | Đọc state, xử lý form và thực hiện phần lớn thao tác ghi; **nối API cần sửa handler tại đây**, không chỉ sửa Store |
| [App.jsx](../src/App.jsx), [Layout.jsx](../src/Layout.jsx)                   | Route, Guard, sidebar, bottom nav và chuyển trang                                                                  |
| [components.jsx](../src/components.jsx), [feedback.jsx](../src/feedback.jsx) | Component dùng chung, toast, lỗi biểu mẫu, animation và âm                                                         |
| [styles.css](../src/styles.css), [main.jsx](../src/main.jsx)                 | Design tokens, responsive CSS và MotionConfig                                                                      |

`REUSE(STORE)`: `update()` là **shallow merge**, không gọi API. Khi đổi nested object, dùng `update(previous => ({ profile: { ...previous.profile, goal } }))`. Không đặt `fetch`, `notify`, upload hoặc side effect trong updater: React có thể gọi lại updater khi kiểm tra ở StrictMode.

State demo lưu bằng khóa `luma-english-demo-v1`. `sessionFor()` giữ profile/tiến độ từng học viên trong `learnerRecords` để đổi tài khoản trên cùng trình duyệt. Đây không phải cơ chế đồng bộ giữa máy hoặc giữa người dùng. Tệp và blob URL không được lưu bền sau reload. Nút loa lưu riêng bằng `luma-feedback-sound`.

## Bản đồ tích hợp

Mỗi ID dưới đây tìm được trực tiếp bằng `rg`. Đường dẫn HTTP sẽ do FE/BE thống nhất; bảng mô tả dữ liệu và hành vi cần thay, không phải API đã tồn tại.

| Flag                  | Điểm vào trong code                                                                                                                   | Cần nối / dữ liệu cần nhận                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_STATE`           | [store.jsx](../src/store.jsx): `readState`, effect lưu state                                                                          | Bootstrap dữ liệu sau khi biết phiên đăng nhập; phân biệt loading/error/empty/ready. Không tự trả seed demo khi API thất bại.                                                               |
| `API_AUTH`            | [Account.jsx](../src/pages/Account.jsx): `Auth`, logout trong `Profile`; [Layout.jsx](../src/Layout.jsx): `Guard`; Store: `startDemo` | Login/register/logout và lấy phiên hiện tại. BE cấp user/role và kiểm quyền từng request. Bỏ đường đăng nhập `Demo@123`, chuyển tài khoản mẫu và reset demo trong bản dùng dữ liệu thật.    |
| `API_PROFILE`         | Account: `Profile.save`, `Goals`                                                                                                      | Nạp/lưu `name`, `email`, `goal`, `dailyMinutes`; trả hồ sơ đã lưu. Đồng bộ tên/email hiển thị trong session; làm mới gợi ý sau đổi goal.                                                    |
| `API_NOTIFICATIONS`   | Account: `Notifications.open`, đánh dấu tất cả đã đọc                                                                                 | Danh sách theo người đăng nhập, trạng thái read và đích điều hướng. BE tạo thông báo khi chấm bài/trả lời; ngừng tự thêm notification trong Instructor.                                     |
| `API_COURSES`         | [Student.jsx](../src/pages/Student.jsx): `Catalog`, `CourseDetail`, `CourseCard` trong components                                     | Danh sách/chi tiết khóa đã công khai; map fields của Course bên dưới. Nếu có phân trang, gửi bộ lọc và nhận total/cursor từ BE.                                                             |
| `API_RECOMMENDATIONS` | Student: `Dashboard`, `LearningPath`                                                                                                  | Khóa được đề xuất, thứ tự lộ trình, lý do và điều kiện mở khóa. Hiện dashboard lấy 3 khóa đầu, lộ trình dùng 4 ID cố định; chưa có cá nhân hóa thật.                                        |
| `API_ENROLLMENT`      | Student: `CourseDetail.enroll`, xác nhận hủy trong `MyCourses`                                                                        | Đăng ký/hủy đăng ký, trạng thái enrollment và tiên quyết do BE xác nhận. Demo bảo lưu tiến độ khi hủy rồi đăng ký lại.                                                                      |
| `API_LESSONS`         | [Learning.jsx](../src/pages/Learning.jsx): `Lesson`, `download`; [data.js](../src/data.js): `getLessons`                              | Nội dung bài, media và tài liệu thật. Hiện bài dùng lessonCopy/lessonEdits, video từ Map, tài liệu tải xuống là `.txt` được tạo tại client.                                                 |
| `API_PROGRESS`        | Learning: `Lesson.complete`; Student: `StudentProgress`, số liệu Dashboard                                                            | Ghi hoàn thành bài và lấy tiến độ/kết quả theo học viên. BE xác nhận điều kiện hoàn thành; UI cập nhật từ kết quả trả về.                                                                   |
| `API_DISCUSSIONS`     | Learning: `Lesson.ask`, form báo cáo; [Instructor.jsx](../src/pages/Instructor.jsx): `DiscussionReply.save`                           | Danh sách/gửi câu hỏi, phản hồi và tạo báo cáo liên kết `postId`. BE cấp tác giả/id/thời gian và tạo notification.                                                                          |
| `API_QUIZ`            | Learning: `Quiz.submit`, `QuizResult`; data: `scoreAnswers`                                                                           | Lấy đề, gửi answers, nhận attempt/kết quả và lời giải được phép xem. Nối cả placement. BE chấm điểm; đề dành cho học viên không mang đáp án đúng trước thời điểm cho phép.                  |
| `API_UPLOADS`         | Store: `keepFile`; Instructor: `LessonForm.upload`; Learning/Grading đọc `files.current`                                              | Upload tệp, nhận fileId/mediaId và URL xem/tải; thay cả bên ghi lẫn bên đọc blob URL. FE đang nhận bài PDF/DOCX ≤10 MB, video MP4/WebM ≤100 MB; BE xác nhận loại/kích thước/quyền truy cập. |
| `API_SUBMISSIONS`     | Learning: `Assignment.submit`; Instructor: `Submissions`, `Grading`                                                                   | Nộp/nộp lại và lấy bài nộp của đúng học viên/khóa. Chỉ xóa form sau khi upload và lưu thành công. `isLocalUpload` hiện là cờ demo, không phải trạng thái upload trên server.                |
| `API_AUTHORING`       | Instructor: `CourseEditor.save`/xuất bản, `LessonEditor`, `LessonForm.save`, `AssessmentEditor.save`, `AssignmentEditorCard.save`     | CRUD khóa/bài/đề và xuất bản. BE trả ID, owner và trạng thái; tên `teacher` hiện tại chỉ dùng hiển thị, chưa thay thế ownerId.                                                              |
| `API_GRADING`         | Instructor: `Grading.save`, `draft`                                                                                                   | Tách lưu nháp và công bố điểm. BE kiểm quyền chấm/điểm 0–10; chỉ công bố điểm mới gửi notification. Trả bài nộp đã lưu để refresh UI.                                                       |
| `API_ANALYTICS`       | Instructor: `InstructorStudents`                                                                                                      | Tiến độ học viên theo khóa do BE trả về. Hiện màn này cố định khóa foundations, có fallback mẫu 50/100% cho người chưa có cache.                                                            |
| `API_ADMIN`           | [Admin.jsx](../src/pages/Admin.jsx): `AdminDashboard`, `UserForm.save`, `AdminCourses.toggle`, `ReportDetail.resolve`                 | Số liệu/danh sách, đổi vai trò/trạng thái, ẩn khóa, xử lý báo cáo. BE kiểm quyền và lưu quyết định/ẩn nội dung/nhật ký nhất quán.                                                           |
| `API_AUDIT`           | Store: `logChange`; Admin: `AuditLog`; Instructor: xuất bản                                                                           | Nhật ký do BE tạo sau thao tác được xác nhận. Không lấy actor hoặc timestamp do client cung cấp làm nhật ký thật.                                                                           |

## Model mà UI đang đọc

Đây là **model hiện tại của FE**. API có thể dùng tên khác; cần map rõ tại chỗ nhận dữ liệu hoặc đổi đồng bộ các caller.

| Dữ liệu              | Quy ước cần giữ hoặc sửa đồng bộ                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session`            | `null` hoặc `{ userId, role, name, email }`; role là `student`, `instructor`, `admin`. Khi nối API cần trạng thái đang tải phiên để Guard không redirect sớm.                                                                                            |
| `profile`            | `{ name, email, goal, dailyMinutes }`. Các goal mẫu nằm trong `goals`; UI hiện dùng chuỗi tiếng Việt.                                                                                                                                                    |
| `Course`             | `id` dạng string; `title`, `description`, `level`, `category`, `hours`, `teacher`, `learners`, `status`, `prerequisite`, `outcomes[]`, `reason`, `art`, `color`; `lessons` là số lượng, `lessonTitles` tùy chọn. Status: `draft`, `published`, `hidden`. |
| Bài học              | `getLessons(course)` sinh `{ id: number, title, minutes }`; id bắt đầu 1 và chỉ duy nhất trong course. Route param là string nhưng đang được ép `Number(lessonId)`.                                                                                      |
| Enrollment / tiến độ | `enrolled: courseId[]`; `completed: { [courseId]: lessonId[] }`. Helper `canEnroll` yêu cầu khóa published và tiên quyết đạt 100%. BE phải kiểm lại trước khi cho đăng ký.                                                                               |
| Khóa cache           | `lessonEdits[courseId + '-' + lessonId]`; `questionEdits[courseId]`; `assignmentEdits[courseId]`; `quizResults` và `quizDrafts` theo khóa courseId–lessonId. Không tách khóa bằng dấu `-` vì courseId cũng có thể chứa dấu này.                          |
| Quiz                 | Câu hỏi `{ id, prompt, options[], answer, explanation }`; lựa chọn `answers[questionId]` là chỉ số **0-based**. `0` là câu trả lời hợp lệ, không kiểm bằng truthy. Mỗi khóa quizResults hiện chỉ giữ kết quả gần nhất.                                   |
| Bài nộp              | `{ id, userId, name, courseId, title, filename, size?, text, createdAt, status, score, feedback }`; `text` của tệp upload là ghi chú, không phải nội dung đã parse từ PDF/DOCX. Status `pending`/`graded`; điểm nháp ở `draftScore`/`draftFeedback`.     |
| Tệp                  | `files.current.get(submissionId)` cho bài nộp; `files.current.get('video-' + courseId + '-' + lessonId)` cho video. Sau reload cần URL/fileId từ BE thay vì blob URL cũ.                                                                                 |
| Báo cáo / thông báo  | Report dùng `pending`/`resolved`/`dismissed`, `postId` liên kết thảo luận. Notification dùng `{ id, userId, title, body, to, read }`; chỉ hiển thị dữ liệu BE cấp cho người đăng nhập.                                                                   |
| Thời gian            | `createdAt` đang là ISO string. `due` trong đề writing lấy từ `datetime-local`, chưa có múi giờ; thống nhất cách chuyển đổi với BE trước khi áp dụng deadline thật.                                                                                      |

Không dùng toàn bộ `createInitialState()` làm payload gửi server. Ví dụ nộp quiz gửi định danh đề/lần làm và các lựa chọn, không gửi điểm tự tính, role hay toàn bộ danh sách người dùng.

## Nối một API theo từng bước

1. Chọn ID trong bảng, đọc handler và các màn cùng sử dụng dữ liệu đó. Chốt endpoint, cách xác thực, ID, payload, response và lỗi với người làm BE.
2. Khi có endpoint thật, thêm hàm gọi bằng `fetch` cho nghiệp vụ đó (có thể bắt đầu bằng một `src/api.js`). Repo hiện chưa có file này. URL API phải trỏ tới backend thật; deployment Vercel hiện chỉ phục vụ frontend và SPA rewrite.
3. Nạp dữ liệu trong nơi sở hữu feature; phân biệt chưa tải, lỗi và danh sách rỗng. Khi chuyển tài khoản/đăng xuất, xóa dữ liệu theo phiên và hủy hoặc bỏ qua phản hồi của phiên cũ.
4. Trong handler lưu: chặn gửi lặp bằng pending, giữ input, `await` request, kiểm tra HTTP status, rồi mới `update()` từ response và `notify()` thành công. Lỗi dùng `setError(message)` hoặc `notify(message, 'danger')`; cho phép thử lại.
5. Cập nhật các màn liên quan từ response hoặc tải lại: ví dụ chấm bài ảnh hưởng Grading, Assignment, StudentProgress và Notifications. Không còn tạo hiệu ứng dữ liệu phía BE bằng cách tự sửa nhiều mảng demo.
6. Thử API thất bại, phiên hết hạn, không đủ quyền, không có dữ liệu và thành công. Sau đó bỏ TODO của phần đã nối; giữ các TODO còn dùng mock.

Ví dụ contract **đề xuất để thảo luận với BE**, chưa được triển khai: cập nhật mục tiêu.

```text
PATCH /me/profile
Request:  { "goal": "Củng cố nền tảng", "dailyMinutes": 30 }
Response: { "profile": { "name": "Minh Anh", "email": "minhanh@example.com",
                        "goal": "Củng cố nền tảng", "dailyMinutes": 30 } }
```

FE dùng `response.profile` cập nhật hồ sơ và làm mới recommendations/path. Không cần gửi userId để tự chọn hồ sơ; BE xác định người dùng từ phiên đã xác thực. Nếu nhóm chọn cấu hình URL qua `VITE_API_BASE_URL`, cần thêm code đọc biến đó; hiện thêm biến môi trường một mình chưa nối được API. Biến có tiền tố `VITE_` là cấu hình public của frontend, không dùng để giữ secret.

## Dùng lại UI, animation và thông báo

Tìm `REUSE(UI_COMPONENTS)` tại Button và `REUSE(FEEDBACK)` tại Store/feedback để tới điểm dùng chung.

| Thành phần                   | Cách dùng                                                                                                                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                     | `to="/courses"` để điều hướng; `type="submit"` để submit form; mặc định là button. Variant: primary/secondary/ghost/danger. Có hover/tap và reduced motion. Khi request đang chờ, đặt `disabled={pending}` và label dễ hiểu. |
| `Field`                      | Truyền `label`, `value`, `onChange`; có `as="textarea"`/`as="select"`, `help`, `error`. Dùng label thật thay cho chỉ placeholder.                                                                                            |
| `useFormError` + `FormError` | Import hook từ store, component từ feedback. `setError('Nội dung lỗi')` báo lỗi có âm; `setError('')` xóa. `error` là object `{ message, id }`, không render trực tiếp `{error}`.                                            |
| `notify`                     | `notify('Đã lưu.')` mặc định success; `'danger'` cho lỗi; `'primary'` cho thông tin không có âm. Không gọi thêm playFeedbackSound cho cùng thao tác vì sẽ phát hai lần.                                                      |
| `Modal`                      | `<Modal open={open} onClose={...} title="...">…</Modal>` dùng native dialog/focus trap. Lỗi của form đang mở nên hiển thị bằng FormError trong modal; toast ngoài dialog có thể nằm sau lớp modal.                           |
| Motion / âm thanh            | `main.jsx` đặt reducedMotion; Button và Layout xử lý hiệu ứng chung. Âm nằm trong feedback.jsx, trạng thái loa nằm trong Store. Âm chỉ phát từ thao tác, không phát trong effect nạp dữ liệu.                                |

Ví dụ component dùng được bên trong StoreProvider; đoạn này vẫn lưu dữ liệu demo:

```jsx
import { useState } from 'react';
import { Button, Field } from './components';
import { FormError } from './feedback';
import { useFormError, useStore } from './store';

export function DailyMinutesForm() {
  const { state, update, notify } = useStore();
  const choices = [10, 20, 30, 45, 60];
  const [minutes, setMinutes] = useState(state.profile.dailyMinutes);
  const [error, setError] = useFormError();

  function save(event) {
    event.preventDefault();
    const value = Number(minutes);
    if (!choices.includes(value)) {
      return setError('Chọn thời gian học hợp lệ.');
    }
    update((previous) => ({ profile: { ...previous.profile, dailyMinutes: value } }));
    setError('');
    notify('Đã lưu thời gian học.');
  }

  return (
    <form className="stack" onSubmit={save}>
      <Field
        label="Số phút mỗi ngày"
        as="select"
        required
        value={minutes}
        onChange={(event) => setMinutes(event.target.value)}
      >
        {choices.map((value) => (
          <option key={value} value={value}>
            {value} phút
          </option>
        ))}
      </Field>
      <FormError error={error} />
      <Button type="submit">Lưu thay đổi</Button>
    </form>
  );
}
```

Ví dụ trên minh họa hook/component với các lựa chọn đang có trong Profile, không tự thêm route. Nếu đặt file trong `src/pages/`, đổi import thành `../components`, `../feedback`, `../store`. Khi tích hợp thật, thay block update bằng quy trình request/response ở phần trên và dùng giới hạn nghiệp vụ nhóm đã thống nhất.

## Mở rộng feature ở đâu?

| Flag                    | Giới hạn hiện tại                                                                          | Cách mở rộng và các điểm phải đi cùng                                                                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXTEND(DATA_MODEL)`    | Lesson ID sinh theo vị trí; state demo có schema version 1                                 | Nếu thêm xóa/sắp xếp bài hoặc chuyển UUID: dùng ID ổn định, sửa getLessons, route parsing, completed, lessonEdits và khóa media/quiz. Nếu thêm dữ liệu riêng học viên: thêm default tại createInitialState và fields trong sessionFor. Nếu đổi schema đã lưu: thêm migration hoặc tăng version có chủ đích. |
| `EXTEND(ASSESSMENTS)`   | Một bộ quiz và một đề writing mỗi course; quiz giữ kết quả mới nhất; nộp lại ghi đè bài cũ | Khi cần nhiều đề/lịch sử: thêm quizId/assignmentId/attemptId, đổi route và cache; cập nhật editor, QuizResult, Assignment, Submissions, Grading và StudentProgress cùng nhau. Chốt quy tắc deadline/lượt làm với BE.                                                                                        |
| `EXTEND(ROUTES)`        | Routes và menu được khai báo tường minh                                                    | Tạo page, thêm Route dưới đúng Guard/Layout, cập nhật navigation và mobileItems trong Layout. Vai trò mới cần cập nhật roles/roleHome trong data. Thử cả truy cập trực tiếp, reload và sai vai trò.                                                                                                         |
| `EXTEND(DESIGN_SYSTEM)` | Tokens indigo/Inter và breakpoint dùng chung                                               | Đổi token ở :root; tái dùng Button/Card/Field/Modal. Dùng ui-ux-pro-max khi sửa UI; kiểm tra 375/768/1024/1440px, focus, target 44px và giảm chuyển động.                                                                                                                                                   |

Để thêm một feature mới: xác định page + role + dữ liệu cần đọc/ghi, dùng component chung, thêm route/menu khi cần, đặt TODO tại đúng ranh giới mock/API nếu BE chưa sẵn sàng. Ghi trạng thái và cách thử trong tài liệu này; không tạo biến bật API khi phần API chưa được thực hiện.

## Kiểm tra trước khi bàn giao tiếp

```sh
npm test
npm run test:e2e
npm run build
```

Các kiểm tra hiện tại nằm trong [tests](../tests): quy tắc tiên quyết, chấm điểm, upload; các luồng demo của ba vai trò; không tràn ngang ở bốn kích thước; hover/tap, Error/Success, mute và reduced motion. E2E hiện dùng Edge và dữ liệu local, chưa xác minh backend thật. Khi nối feature, bổ sung kiểm tra focused cho request/response thành công và lỗi của feature đó.

Vercel deploy lại bằng lệnh trong README khi muốn đưa thay đổi chạy thực tế lên web. Mã nguồn bàn giao nằm trong thư mục project; đường link web hiển thị ứng dụng, không thay thế việc chia sẻ source cho teammate.
