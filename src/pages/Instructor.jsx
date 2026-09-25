import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BackLink,
  Badge,
  Button,
  Card,
  DataTable,
  Empty,
  Field,
  Heading,
  Icon,
  Metric,
  Modal,
  Notice,
  Progress,
  RouteTabs,
} from '../components';
import {
  defaultAssignment,
  formatDate,
  getLessons,
  lessonCopy,
  normalizeSearch,
  progressOf,
  quizQuestions,
} from '../data';
import { useFormError, useStore } from '../store';
import { FormError } from '../feedback';

const statusLabels = { published: 'Công khai', draft: 'Bản nháp', hidden: 'Đã ẩn' };
export function CourseStatus({ status }) {
  return (
    <Badge tone={status === 'published' ? 'success' : status === 'hidden' ? 'danger' : 'neutral'}>
      {statusLabels[status]}
    </Badge>
  );
}
function EditorNav({ id }) {
  return (
    <RouteTabs
      items={[
        { to: '/instructor/courses/' + id + '/edit', label: 'Thông tin khóa học' },
        { to: '/instructor/courses/' + id + '/lessons', label: 'Bài học' },
        { to: '/instructor/courses/' + id + '/assessments', label: 'Quiz và bài tập' },
      ]}
    />
  );
}

export function InstructorCourses() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const search = params.get('q') || '';
  const owned = state.courses.filter((course) => course.teacher === state.session.name);
  const courses = owned.filter((course) =>
    normalizeSearch(course.title).includes(normalizeSearch(search)),
  );
  const pending = state.submissions.filter(
    (submission) =>
      owned.some((c) => c.id === submission.courseId) && submission.status === 'pending',
  ).length;
  return (
    <>
      <Heading
        title="Khóa học của tôi"
        description="Tạo nội dung, theo dõi học viên và quản lý bài tập."
        actions={
          <Button to="/instructor/courses/new/edit" icon="plus">
            Tạo khóa học
          </Button>
        }
      />
      <div className="metrics">
        <Metric
          label="Khóa học công khai"
          value={owned.filter((c) => c.status === 'published').length}
          note={owned.filter((c) => c.status === 'draft').length + ' khóa học đang ở bản nháp'}
        />
        <Metric
          label="Học viên đang học"
          value={owned.reduce((sum, c) => sum + c.learners, 0)}
          note="Dữ liệu học viên mẫu"
        />
        <Metric label="Bài cần chấm" value={pending} note="Phản hồi để học viên tiến bộ" />
      </div>
      <Field
        label="Tìm khóa học"
        type="search"
        placeholder="Tên khóa học…"
        value={search}
        onChange={(event) =>
          setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })
        }
      />
      <DataTable
        caption="Các khóa học của giảng viên"
        rows={courses}
        columns={[
          { key: 'title', label: 'Khóa học', render: (row) => <strong>{row.title}</strong> },
          { key: 'learners', label: 'Học viên' },
          { key: 'lessons', label: 'Nội dung', render: (row) => row.lessons + ' bài học' },
          {
            key: 'status',
            label: 'Trạng thái',
            render: (row) => <CourseStatus status={row.status} />,
          },
          {
            key: 'action',
            label: 'Thao tác',
            render: (row) => (
              <Button variant="ghost" to={'/instructor/courses/' + row.id + '/edit'}>
                Chỉnh sửa
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}

// TODO(API_AUTHORING): Nối tạo/sửa/xuất bản khóa học; lấy id/trạng thái từ BE.
// BE kiểm quyền giảng viên trên khóa; hiện teacher chỉ là tên hiển thị, chưa có ownerId.
export function CourseEditor() {
  const { courseId } = useParams();
  const { state, update, notify, logChange } = useStore();
  const navigate = useNavigate();
  const isNew = courseId === 'new';
  const course = state.courses.find((c) => c.id === courseId);
  const [form, setForm] = useState(
    course || {
      title: '',
      description: '',
      level: 'Cơ bản',
      category: 'Ngữ pháp',
      prerequisite: '',
      hours: 1,
    },
  );
  const [publish, setPublish] = useState(false);
  if (!isNew && !course)
    return (
      <Empty
        title="Không tìm thấy khóa học"
        action={<Button to="/instructor/courses">Về danh sách</Button>}
      />
    );
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  function save(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    const id = isNew ? 'course-' + crypto.randomUUID().slice(0, 8) : courseId;
    const next = {
      art: 'Aa',
      color: 'indigo',
      lessons: 1,
      learners: 0,
      outcomes: ['Làm quen với nội dung và thực hành kiến thức đã học.'],
      reason: 'Khóa học mới từ giảng viên. Hãy xem nội dung để chọn khóa phù hợp.',
      status: 'draft',
      ...course,
      ...form,
      id,
      title: form.title.trim(),
      description: form.description.trim(),
      hours: Number(form.hours),
      teacher: state.session.name,
    };
    update((previous) => ({
      courses: isNew
        ? [...previous.courses, next]
        : previous.courses.map((c) => (c.id === id ? next : c)),
    }));
    notify('Đã lưu thông tin khóa học.');
    if (isNew) navigate('/instructor/courses/' + id + '/edit');
  }
  return (
    <>
      <BackLink to="/instructor/courses">Danh sách khóa học</BackLink>
      <Heading
        title={isNew ? 'Tạo khóa học' : 'Thông tin khóa học'}
        description={
          isNew ? 'Bắt đầu từ một mục tiêu học tập rõ ràng.' : course.title + ' · Đang chỉnh sửa'
        }
      />
      {!isNew && <EditorNav id={courseId} />}
      <div className="two-column">
        <Card>
          <form className="stack" onSubmit={save}>
            <Field
              label="Tên khóa học"
              value={form.title}
              onChange={set('title')}
              maxLength="100"
              required
            />
            <div className="form-grid">
              <Field label="Trình độ" as="select" value={form.level} onChange={set('level')}>
                <option>Cơ bản</option>
                <option>Trung cấp</option>
              </Field>
              <Field label="Kỹ năng" as="select" value={form.category} onChange={set('category')}>
                {['Ngữ pháp', 'Giao tiếp', 'Đọc hiểu', 'Nghe', 'Luyện thi'].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Field>
            </div>
            <Field
              as="textarea"
              label="Mô tả khóa học"
              rows="5"
              value={form.description}
              onChange={set('description')}
              maxLength="1000"
              required
            />
            <div className="form-grid">
              <Field
                label="Thời lượng (giờ)"
                type="number"
                min="1"
                max="100"
                required
                value={form.hours}
                onChange={set('hours')}
              />
              <Field
                label="Kiến thức tiên quyết"
                as="select"
                value={form.prerequisite}
                onChange={set('prerequisite')}
              >
                <option value="">Không yêu cầu</option>
                {state.courses
                  .filter((c) => c.id !== courseId && !c.prerequisite && c.status === 'published')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </Field>
            </div>
            <Button type="submit">Lưu thông tin</Button>
          </form>
        </Card>
        <Card>
          <h2>Sẵn sàng cho học viên</h2>
          <p>Kiểm tra thông tin, bài học và đáp án trước khi xuất bản.</p>
          {!isNew && (
            <>
              <CourseStatus status={course.status} />
              <ul className="check-list">
                <li>
                  <Icon name="check" />
                  Thông tin khóa học đã lưu
                </li>
                <li>
                  <Icon name="book-open" />
                  {course.lessons} bài học
                </li>
                <li>
                  <Icon name="clipboard-list" />
                  {(state.questionEdits[courseId] || quizQuestions).length} câu hỏi luyện tập
                </li>
              </ul>
              <Button to={'/instructor/courses/' + courseId + '/lessons'} variant="secondary">
                Soạn bài học
              </Button>
              <Button onClick={() => setPublish(true)} disabled={course.status === 'published'}>
                {course.status === 'published' ? 'Đã công khai' : 'Xuất bản khóa học'}
              </Button>
              <small>Nút xuất bản sử dụng thông tin đã lưu.</small>
            </>
          )}
          {isNew && (
            <Notice title="Bắt đầu bằng bản nháp">Lưu thông tin để thêm bài học và câu hỏi.</Notice>
          )}
        </Card>
      </div>
      <Modal open={publish} title="Xuất bản khóa học?" onClose={() => setPublish(false)}>
        <p>Khóa học “{course?.title}” sẽ xuất hiện trong trang Khám phá của học viên.</p>
        <div className="actions">
          <Button variant="secondary" onClick={() => setPublish(false)}>
            Kiểm tra thêm
          </Button>
          <Button
            onClick={() => {
              logChange('Xuất bản khóa học', course.title, {
                courses: state.courses.map((c) =>
                  c.id === courseId ? { ...c, status: 'published' } : c,
                ),
              });
              setPublish(false);
              notify('Khóa học đã được công khai.');
            }}
          >
            Xác nhận xuất bản
          </Button>
        </div>
      </Modal>
    </>
  );
}

// TODO(API_AUTHORING): addLesson() hiện tăng số lượng và sinh id theo thứ tự; nối CRUD bài học.
// Giữ định danh bài khi đổi thứ tự/xóa bài; xem EXTEND(DATA_MODEL) tại getLessons().
export function LessonEditor() {
  const { courseId } = useParams();
  const { state, update, notify, keepFile } = useStore();
  const course = state.courses.find((c) => c.id === courseId);
  const [selected, setSelected] = useState(course?.lessons >= 4 ? 4 : 1);
  const [revision, setRevision] = useState(0);
  if (!course)
    return (
      <Empty
        title="Không tìm thấy khóa học"
        action={<Button to="/instructor/courses">Về danh sách</Button>}
      />
    );
  const lessons = getLessons(course);
  function addLesson() {
    update((previous) => ({
      courses: previous.courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              lessons: c.lessons + 1,
              lessonTitles: [...getLessons(c).map((l) => l.title), 'Bài học mới'],
            }
          : c,
      ),
    }));
    setSelected(course.lessons + 1);
  }
  return (
    <>
      <BackLink to="/instructor/courses">Khóa học của tôi</BackLink>
      <Heading title="Soạn bài học" description={course.title} />
      <EditorNav id={courseId} />
      <div className="editor-layout">
        <Card className="editor-outline">
          <h2>Nội dung khóa học</h2>
          {lessons.map((lesson) => (
            <button
              className={selected === lesson.id ? 'selected' : ''}
              onClick={() => setSelected(lesson.id)}
              key={lesson.id}
            >
              <span>{lesson.id.toString().padStart(2, '0')}</span>
              {lesson.title}
            </button>
          ))}
          <Button variant="secondary" onClick={addLesson} icon="plus">
            Thêm bài học
          </Button>
        </Card>
        <LessonForm
          key={selected + '-' + revision}
          course={course}
          lesson={lessons.find((l) => l.id === selected) || lessons[0]}
          onSave={() => setRevision(revision + 1)}
          store={{ state, update, notify, keepFile }}
        />
      </div>
    </>
  );
}
function LessonForm({ course, lesson, store, onSave }) {
  const { state, update, notify, keepFile } = store;
  const key = course.id + '-' + lesson.id;
  const saved = state.lessonEdits[key];
  const [title, setTitle] = useState(saved?.title || lesson.title);
  const [body, setBody] = useState(
    saved?.body ||
      lessonCopy[lesson.id]?.body ||
      'Thêm nội dung, ví dụ và hướng dẫn thực hành tại đây.',
  );
  const [filename, setFilename] = useState(saved?.filename || '');
  const [error, setError] = useFormError();
  function upload(event) {
    // TODO(API_UPLOADS): MP4/WebM <=100 MB chỉ kiểm tại FE và giữ blob URL trong phiên.
    // Sau upload thật, lưu mediaId/URL vào bài học thay cho filename + files.current.
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(mp4|webm)$/i.test(file.name) || file.size > 100 * 1024 * 1024 || !file.size)
      return setError('Chọn tệp MP4 hoặc WebM hợp lệ, tối đa 100 MB.');
    keepFile('video-' + key, file);
    setFilename(file.name);
    setError('');
  }
  function save(event) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    update((previous) => ({
      lessonEdits: {
        ...previous.lessonEdits,
        [key]: { title: title.trim(), body: body.trim(), filename },
      },
      courses: previous.courses.map((c) =>
        c.id === course.id
          ? {
              ...c,
              lessonTitles: getLessons(c).map((l) => (l.id === lesson.id ? title.trim() : l.title)),
            }
          : c,
      ),
    }));
    notify('Đã lưu bài học.');
    onSave();
  }
  return (
    <Card>
      <form className="stack" onSubmit={save}>
        <Field
          label="Tên bài học"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength="150"
        />
        <label className="upload-zone">
          <Icon name="upload" />
          <strong>{filename || 'Chọn video bài học'}</strong>
          <span>MP4, WebM · tối đa 100 MB</span>
          <input
            type="file"
            accept="video/mp4,video/webm"
            aria-label="Video bài học"
            onChange={upload}
          />
        </label>
        <FormError error={error} />
        <small>
          Video xem được trong phiên này. Khi tích hợp backend, tệp sẽ được lưu trên máy chủ.
        </small>
        <Field
          label="Nội dung bài học"
          as="textarea"
          rows="12"
          required
          maxLength="10000"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <Button type="submit">Lưu bài học</Button>
      </form>
      <h2>Thảo luận bài học</h2>
      {state.discussions
        .filter(
          (item) => item.courseId === course.id && item.lessonId === lesson.id && !item.hidden,
        )
        .map((item) => (
          <DiscussionReply key={item.id} item={item} />
        ))}
      {!state.discussions.some(
        (item) => item.courseId === course.id && item.lessonId === lesson.id && !item.hidden,
      ) && <p>Chưa có câu hỏi cho bài học này.</p>}
    </Card>
  );
}

// TODO(API_DISCUSSIONS): Lưu phản hồi qua BE; BE tạo notification cho đúng người đặt câu hỏi.
function DiscussionReply({ item }) {
  const { state, update, notify } = useStore();
  const [reply, setReply] = useState(item.reply || '');
  function save(event) {
    event.preventDefault();
    if (!reply.trim()) return;
    update((previous) => ({
      discussions: previous.discussions.map((discussion) =>
        discussion.id === item.id
          ? { ...discussion, reply: reply.trim(), repliedBy: state.session.name }
          : discussion,
      ),
      notifications: [
        {
          id: crypto.randomUUID(),
          userId: item.userId,
          title: 'Giảng viên đã trả lời',
          body: 'Câu hỏi của bạn trong bài học đã có phản hồi.',
          to: '/learn/' + item.courseId + '/' + item.lessonId,
          read: false,
        },
        ...previous.notifications,
      ],
    }));
    notify('Đã gửi phản hồi cho học viên.');
  }
  return (
    <form className="discussion stack" onSubmit={save}>
      <strong>{item.name}</strong>
      <p>{item.text}</p>
      <Field
        label="Trả lời học viên"
        as="textarea"
        rows="3"
        required
        maxLength="2000"
        value={reply}
        onChange={(event) => setReply(event.target.value)}
      />
      <Button type="submit" variant="secondary">
        Gửi phản hồi thảo luận
      </Button>
    </form>
  );
}

// TODO(API_AUTHORING): save() và AssignmentEditorCard.save() hiện chỉ ghi *Edits trong Store.
// EXTEND(ASSESSMENTS): Hiện 1 bộ quiz + 1 đề writing/course; nhiều đề cần quizId/assignmentId,
// đồng bộ editor, routes, Quiz/QuizResult, Assignment, Submissions và lịch sử attempts.
export function AssessmentEditor() {
  const { courseId } = useParams();
  const { state, update, notify } = useStore();
  const course = state.courses.find((c) => c.id === courseId);
  const [questions, setQuestions] = useState(() =>
    structuredClone(state.questionEdits[courseId] || quizQuestions),
  );
  const [index, setIndex] = useState(0);
  const [error, setError] = useFormError();
  if (!course)
    return (
      <Empty
        title="Không tìm thấy khóa học"
        action={<Button to="/instructor/courses">Về danh sách</Button>}
      />
    );
  const question = questions[index];
  function patch(change) {
    setQuestions((previous) => previous.map((q, i) => (i === index ? { ...q, ...change } : q)));
  }
  function save(event) {
    event.preventDefault();
    const invalid = questions.findIndex(
      (q) =>
        !q.prompt.trim() || q.options.some((option) => !option.trim()) || !q.explanation.trim(),
    );
    if (invalid >= 0) {
      setIndex(invalid);
      setError('Điền câu hỏi, bốn đáp án và lời giải trước khi lưu.');
      return;
    }
    update((previous) => ({ questionEdits: { ...previous.questionEdits, [courseId]: questions } }));
    setError('');
    notify('Đã lưu ' + questions.length + ' câu hỏi.');
  }
  return (
    <>
      <Heading title="Soạn quiz và bài tập" description={course.title} />
      <EditorNav id={courseId} />
      <div className="two-column">
        <Card>
          <form className="stack" onSubmit={save}>
            <Field
              label="Câu hỏi đang chỉnh sửa"
              as="select"
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
            >
              {questions.map((q, i) => (
                <option key={q.id} value={i}>
                  Câu {i + 1}
                </option>
              ))}
            </Field>
            <Field
              label="Nội dung câu hỏi"
              as="textarea"
              rows="2"
              value={question.prompt}
              onChange={(event) => patch({ prompt: event.target.value })}
              required
            />
            <fieldset className="answer-editor">
              <legend>Đáp án · Chọn đáp án đúng</legend>
              {question.options.map((option, i) => (
                <div key={i}>
                  <input
                    type="radio"
                    aria-label={'Đáp án đúng ' + String.fromCharCode(65 + i)}
                    name="correct"
                    checked={question.answer === i}
                    onChange={() => patch({ answer: i })}
                  />
                  <Field
                    label={'Đáp án ' + String.fromCharCode(65 + i)}
                    required
                    value={option}
                    onChange={(event) =>
                      patch({
                        options: question.options.map((value, j) =>
                          j === i ? event.target.value : value,
                        ),
                      })
                    }
                  />
                </div>
              ))}
            </fieldset>
            <Field
              label="Giải thích đáp án"
              as="textarea"
              rows="3"
              value={question.explanation}
              required
              onChange={(event) => patch({ explanation: event.target.value })}
            />
            <FormError error={error} />
            <div className="actions">
              <Button type="submit">Lưu quiz</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setQuestions([
                    ...questions,
                    {
                      id: crypto.randomUUID(),
                      prompt: '',
                      options: ['', '', '', ''],
                      answer: 0,
                      explanation: '',
                    },
                  ]);
                  setIndex(questions.length);
                }}
              >
                Thêm câu hỏi
              </Button>
              <Button
                variant="ghost"
                disabled={questions.length === 1}
                onClick={() => {
                  setQuestions(questions.filter((_, i) => i !== index));
                  setIndex(Math.max(0, index - 1));
                }}
              >
                Xóa câu này
              </Button>
            </div>
          </form>
        </Card>
        <AssignmentEditorCard courseId={courseId} />
      </div>
    </>
  );
}

function AssignmentEditorCard({ courseId }) {
  const { state, update, notify } = useStore();
  const [form, setForm] = useState(state.assignmentEdits[courseId] || defaultAssignment);
  function save(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.prompt.trim()) return;
    update((previous) => ({
      assignmentEdits: {
        ...previous.assignmentEdits,
        [courseId]: { ...form, title: form.title.trim(), prompt: form.prompt.trim() },
      },
    }));
    notify('Đã lưu bài tập tự luận.');
  }
  return (
    <Card>
      <Icon name="file-text" />
      <h2>Bài tập tự luận</h2>
      <form className="stack" onSubmit={save}>
        <Field
          label="Tên bài tập"
          value={form.title}
          required
          maxLength="100"
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <Field
          label="Đề bài"
          as="textarea"
          rows="5"
          value={form.prompt}
          required
          maxLength="2000"
          onChange={(event) => setForm({ ...form, prompt: event.target.value })}
        />
        <Field
          label="Hạn nộp bài"
          type="datetime-local"
          value={form.due}
          required
          onChange={(event) => setForm({ ...form, due: event.target.value })}
        />
        <Badge>Nộp tệp PDF / DOCX · 100–150 từ</Badge>
        <Button type="submit" variant="secondary">
          Lưu bài tập
        </Button>
      </form>
      <Button to="/instructor/submissions" variant="ghost">
        Xem và chấm bài nộp
      </Button>
    </Card>
  );
}

export function Submissions() {
  const { state } = useStore();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const rows = state.submissions.filter(
    (s) =>
      (!status || s.status === status) &&
      normalizeSearch(s.name + ' ' + s.title).includes(normalizeSearch(search)),
  );
  return (
    <>
      <Heading
        title="Bài nộp cần chấm"
        description="Phản hồi kịp thời để học viên tiếp tục tiến bộ."
      />
      <div className="catalog-filters">
        <Field
          label="Tìm học viên hoặc bài tập"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          type="search"
          placeholder="Tên học viên, bài tập…"
        />
        <Field
          label="Trạng thái"
          as="select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ chấm</option>
          <option value="graded">Đã chấm</option>
        </Field>
      </div>
      <DataTable
        caption="Danh sách bài nộp"
        rows={rows}
        columns={[
          { key: 'name', label: 'Học viên', render: (row) => <strong>{row.name}</strong> },
          { key: 'title', label: 'Bài tập' },
          { key: 'createdAt', label: 'Thời gian nộp', render: (row) => formatDate(row.createdAt) },
          {
            key: 'status',
            label: 'Trạng thái',
            render: (row) => (
              <Badge tone={row.status === 'graded' ? 'success' : 'warning'}>
                {row.status === 'graded' ? 'Đã chấm · ' + row.score + '/10' : 'Chờ chấm'}
              </Badge>
            ),
          },
          {
            key: 'action',
            label: 'Thao tác',
            render: (row) => (
              <Button variant="ghost" to={'/instructor/submissions/' + row.id}>
                {row.status === 'graded' ? 'Xem bài' : 'Chấm bài'}
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}

// TODO(API_GRADING): Nối riêng lưu nháp và công bố điểm; chỉ công bố mới thông báo học viên.
// BE kiểm điểm 0..10, quyền chấm và trả submission đã lưu; không tự tạo notification phía FE.
export function Grading() {
  const { submissionId } = useParams();
  const { state, update, notify, files } = useStore();
  const submission = state.submissions.find((s) => s.id === submissionId);
  const [score, setScore] = useState(submission?.draftScore ?? submission?.score ?? '');
  const [feedback, setFeedback] = useState(submission?.draftFeedback ?? submission?.feedback ?? '');
  const [error, setError] = useFormError();
  if (!submission)
    return (
      <Empty
        title="Không tìm thấy bài nộp"
        action={<Button to="/instructor/submissions">Về danh sách</Button>}
      />
    );
  const upload = files.current.get(submission.id);
  function save(event) {
    event.preventDefault();
    if (
      String(score).trim() === '' ||
      !Number.isFinite(Number(score)) ||
      Number(score) < 0 ||
      Number(score) > 10
    )
      return setError('Điểm phải nằm trong khoảng 0 đến 10.');
    if (!feedback.trim()) return setError('Thêm nhận xét để giúp học viên cải thiện.');
    update((previous) => ({
      submissions: previous.submissions.map((s) =>
        s.id === submission.id
          ? {
              ...s,
              score: Number(score),
              feedback: feedback.trim(),
              status: 'graded',
              draftScore: undefined,
              draftFeedback: undefined,
            }
          : s,
      ),
      notifications: [
        {
          id: crypto.randomUUID(),
          userId: submission.userId,
          title: 'Bài tập đã được chấm',
          body: submission.title + ' đã có điểm và nhận xét từ giảng viên.',
          to: '/assignments/' + submission.courseId,
          read: false,
        },
        ...previous.notifications,
      ],
    }));
    setError('');
    notify('Đã lưu điểm và gửi phản hồi.');
  }
  function draft() {
    update((previous) => ({
      submissions: previous.submissions.map((s) =>
        s.id === submission.id ? { ...s, draftScore: score, draftFeedback: feedback } : s,
      ),
    }));
    notify('Đã lưu bản nháp. Điểm chưa được gửi cho học viên.');
  }
  return (
    <>
      <Heading
        title={'Chấm bài: ' + submission.title}
        description={submission.name + ' · Nộp lúc ' + formatDate(submission.createdAt)}
      />
      <BackLink to="/instructor/submissions">Danh sách bài nộp</BackLink>
      <div className="two-column grading-columns">
        <Card>
          <div className="document-label">
            <Icon name="file-text" />
            <strong>{submission.filename}</strong>
          </div>
          {upload && /\.pdf$/i.test(submission.filename) && (
            <object className="pdf-preview" type="application/pdf" data={upload.url}>
              <p>Trình duyệt không hỗ trợ xem PDF. Hãy tải tệp để xem.</p>
            </object>
          )}
          {upload && (
            <a className="button button-secondary" href={upload.url} download={submission.filename}>
              Tải tệp bài làm
            </a>
          )}
          {submission.isLocalUpload && !upload && (
            <Notice tone="warning" title="Tệp thuộc phiên trước">
              Bản dùng thử chỉ còn tên tệp. Học viên cần chọn lại tệp để xem nội dung.
            </Notice>
          )}
          {!submission.isLocalUpload && <h2>My daily routine</h2>}
          {submission.text && <p className="submission-text">{submission.text}</p>}
        </Card>
        <Card>
          <Badge tone={submission.status === 'graded' ? 'success' : 'warning'}>
            {submission.status === 'graded' ? 'ĐÃ CHẤM' : 'CHỜ CHẤM'}
          </Badge>
          <form className="stack" onSubmit={save}>
            <Field
              label="Điểm"
              type="number"
              min="0"
              max="10"
              step="0.1"
              required
              value={score}
              onChange={(event) => setScore(event.target.value)}
              help="Thang điểm: 10"
            />
            <Field
              label="Nhận xét cho học viên"
              as="textarea"
              rows="7"
              required
              maxLength="2000"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Điểm tốt và phần cần cải thiện…"
            />
            <FormError error={error} />
            <Button type="submit">Lưu điểm và gửi phản hồi</Button>
            <Button variant="secondary" onClick={draft}>
              Lưu nháp
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}

// TODO(API_ANALYTICS): Hiện chỉ theo khóa foundations; người chưa có cache dùng số mẫu 50/100%.
// Nhận học viên/tiến độ theo khóa từ BE, bỏ fallback mẫu khi tích hợp dữ liệu thật.
export function InstructorStudents() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const foundation = state.courses.find((c) => c.id === 'foundations');
  const rows = state.users
    .filter(
      (user) =>
        user.role === 'student' && normalizeSearch(user.name).includes(normalizeSearch(query)),
    )
    .map((user) => ({
      ...user,
      progress:
        user.id === state.learnerId
          ? progressOf(foundation, state.completed)
          : state.learnerRecords[user.id]
            ? progressOf(foundation, state.learnerRecords[user.id].completed)
            : user.id === 'thu-ha'
              ? 100
              : 50,
    }));
  return (
    <>
      <Heading
        title="Tiến độ học viên"
        description="English Foundations · Theo dõi để hỗ trợ đúng lúc."
      />
      <div className="metrics">
        <Metric label="Học viên trong dữ liệu mẫu" value={rows.length} />
        <Metric label="Đã hoàn thành" value={rows.filter((row) => row.progress === 100).length} />
        <Metric
          label="Bài đã chấm"
          value={state.submissions.filter((s) => s.status === 'graded').length}
        />
      </div>
      <Field
        label="Tìm học viên"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Nhập tên…"
      />
      <DataTable
        caption="Tiến độ học viên"
        rows={rows}
        columns={[
          { key: 'name', label: 'Học viên', render: (row) => <strong>{row.name}</strong> },
          {
            key: 'progress',
            label: 'Tiến độ',
            render: (row) => <Progress value={row.progress} label="Hoàn thành" />,
          },
          { key: 'email', label: 'Email' },
          {
            key: 'action',
            label: 'Thao tác',
            render: (row) => (
              <Button variant="ghost" onClick={() => setSelected(row)}>
                Xem chi tiết
              </Button>
            ),
          },
        ]}
      />
      <Modal
        open={Boolean(selected)}
        title={selected?.name || 'Chi tiết học viên'}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <p>{selected.email}</p>
            <Progress value={selected.progress} label="English Foundations" />
            <h3>Bài nộp gần đây</h3>
            {state.submissions
              .filter((s) => s.userId === selected.id)
              .map((s) => (
                <Button key={s.id} variant="secondary" to={'/instructor/submissions/' + s.id}>
                  {s.title} · {s.status === 'graded' ? s.score + '/10' : 'Chờ chấm'}
                </Button>
              ))}
            {!state.submissions.some((s) => s.userId === selected.id) && (
              <p>Chưa có bài nộp trong dữ liệu mẫu.</p>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
