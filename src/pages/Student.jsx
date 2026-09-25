import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  BackLink,
  Badge,
  Button,
  Card,
  CourseArt,
  CourseCard,
  DataTable,
  Empty,
  Field,
  Heading,
  Icon,
  Metric,
  Modal,
  Notice,
  Progress,
  SectionHeading,
  Tabs,
} from '../components';
import { canEnroll, getLessons, normalizeSearch, progressOf } from '../data';
import { useStore } from '../store';

// TODO(API_RECOMMENDATIONS): "Dành riêng cho bạn" đang lấy 3 khóa published đầu tiên.
// Nhận danh sách có thứ tự + lý do từ BE; LearningPath bên dưới cũng đang dùng ID cố định.
export function Dashboard() {
  const { state } = useStore();
  const active = state.courses.filter(
    (c) => state.enrolled.includes(c.id) && c.status === 'published',
  );
  const current = active.find((c) => progressOf(c, state.completed) < 100) || active[0];
  const completed = active.reduce((sum, c) => sum + (state.completed[c.id]?.length || 0), 0);
  const total = active.reduce((sum, c) => sum + c.lessons, 0);
  const nextLesson = current
    ? getLessons(current).find((l) => !state.completed[current.id]?.includes(l.id)) ||
      getLessons(current)[0]
    : null;
  return (
    <>
      <Heading
        title={'Chào ' + state.profile.name + ','}
        description="Một bước nhỏ hôm nay, tự tin hơn ngày mai."
      />
      <div className="dashboard-hero">
        <Card className="continue-card">
          <Badge>{current ? 'TIẾP TỤC HỌC' : 'BẮT ĐẦU HÀNH TRÌNH'}</Badge>
          <h2>
            {current?.id === 'foundations' && nextLesson?.id === 4 ? (
              <>
                Tự tin với
                <br />
                thì hiện tại đơn.
              </>
            ) : current ? (
              nextLesson.title
            ) : (
              <>
                Bước đầu nhỏ.
                <br />
                Thay đổi lớn.
              </>
            )}
          </h2>
          <p>
            {current
              ? current.title + ' · Bài ' + nextLesson.id + ' / ' + current.lessons
              : 'Khám phá khóa học phù hợp với mục tiêu của bạn.'}
          </p>
          <div className="split">
            <Button to={current ? '/learn/' + current.id + '/' + nextLesson.id : '/courses'}>
              {current ? 'Tiếp tục bài học' : 'Khám phá khóa học'}
            </Button>
            {current && <small>{nextLesson.minutes} phút</small>}
          </div>
        </Card>
        <Card className="goal-card">
          <Icon name="route" />
          <p>Mục tiêu của bạn</p>
          <h2>{state.profile.goal}</h2>
          <p>Lộ trình được điều chỉnh từ mục tiêu và kết quả đầu vào.</p>
          <Button to="/path" variant="secondary">
            Xem lộ trình
          </Button>
        </Card>
      </div>
      <div className="metrics dashboard-metrics">
        <Metric
          label="Khóa học đang học"
          value={active.filter((c) => progressOf(c, state.completed) < 100).length}
          note="Tiếp tục theo nhịp độ của bạn"
        />
        <Metric label="Bài học hoàn thành" value={completed} note="Mỗi bài học là một bước tiến" />
        <Metric
          className="desktop-metric"
          label="Tiến độ khóa học"
          value={(total ? Math.round((completed / total) * 100) : 0) + '%'}
          note="Tính trên các khóa học đã đăng ký"
        />
      </div>
      <SectionHeading title="Dành riêng cho bạn" to="/courses" />
      <div className="course-grid">
        {state.courses
          .filter((c) => c.status === 'published')
          .slice(0, 3)
          .map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
      </div>
    </>
  );
}

// TODO(API_RECOMMENDATIONS): Thay danh sách ID cố định bằng lộ trình của người học từ BE.
// Khi goal, placement hoặc tiến độ đổi, tải lại lộ trình và lý do đề xuất.
export function LearningPath() {
  const { state } = useStore();
  const courses = state.courses.filter((c) =>
    ['foundations', 'everyday', 'reading', 'exam'].includes(c.id),
  );
  const done = courses.filter((c) => progressOf(c, state.completed) === 100).length;
  return (
    <>
      <Heading
        title="Lộ trình của bạn"
        description="Một hành trình phù hợp với mục tiêu và trình độ hiện tại."
        actions={
          <Button variant="secondary" to="/onboarding/goal">
            Điều chỉnh mục tiêu
          </Button>
        }
      />
      <Card className="path-banner">
        <div>
          <Badge>{state.profile.goal}</Badge>
          <h2>Xây nền vững, học tự tin.</h2>
          <p>Dựa trên mục tiêu học tập, kết quả kiểm tra và các bài bạn đã hoàn thành.</p>
        </div>
        <div className="path-progress">
          <strong>
            {done} / {courses.length}
          </strong>
          <small>chặng đã hoàn thành</small>
        </div>
      </Card>
      <div className="path-list">
        {courses.map((course, index) => {
          const percent = progressOf(course, state.completed);
          const unlocked = canEnroll(course, state.courses, state.completed);
          return (
            <Card key={course.id} className={'path-step ' + (unlocked ? '' : 'path-locked')}>
              <span className="path-number">
                {percent === 100 ? <Icon name="check" /> : String(index + 1).padStart(2, '0')}
              </span>
              <div className="path-step-copy">
                <div className="split">
                  <h2>{course.title}</h2>
                  <Badge tone={percent === 100 ? 'success' : !unlocked ? 'neutral' : 'primary'}>
                    {percent === 100
                      ? 'Hoàn thành'
                      : !unlocked
                        ? 'Chưa mở khóa'
                        : state.enrolled.includes(course.id)
                          ? 'Đang học'
                          : 'Sẵn sàng'}
                  </Badge>
                </div>
                <p>{course.description}</p>
                {!unlocked ? (
                  <small className="inline-icon">
                    <Icon name="lock-keyhole" />
                    Hoàn thành{' '}
                    {state.courses.find((c) => c.id === course.prerequisite)?.title ||
                      'kiến thức tiên quyết'}{' '}
                    để mở khóa.
                  </small>
                ) : (
                  <Progress value={percent} label="Tiến độ" />
                )}
              </div>
              <Button variant={unlocked ? 'primary' : 'secondary'} to={'/courses/' + course.id}>
                {unlocked ? 'Xem khóa học' : 'Xem điều kiện'}
              </Button>
            </Card>
          );
        })}
      </div>
      <Notice title="Vì sao lộ trình có thứ tự này?" icon="route">
        Nền tảng ngữ pháp giúp bạn tự tin trước khi luyện đọc và làm bài thi. Các gợi ý trong bản
        dùng thử sử dụng dữ liệu mẫu.
      </Notice>
    </>
  );
}

// TODO(API_COURSES): Đang lọc/sắp xếp toàn bộ state.courses tại client; nối GET courses.
// Nếu BE phân trang, gửi q/level/category/sort và dùng total/cursor từ BE, không lọc riêng một trang.
export function Catalog() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('recommended');
  const [filterOpen, setFilterOpen] = useState(false);
  const courses = state.courses
    .filter(
      (c) =>
        c.status === 'published' &&
        normalizeSearch(c.title + ' ' + c.description).includes(normalizeSearch(query)) &&
        (!level || c.level === level) &&
        (!category || c.category === category),
    )
    .sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title)
        : sort === 'shortest'
          ? a.hours - b.hours
          : 0,
    );
  function filters() {
    return (
      <>
        <Field
          label="Trình độ"
          as="select"
          value={level}
          onChange={(event) => setLevel(event.target.value)}
        >
          <option value="">Tất cả trình độ</option>
          <option>Cơ bản</option>
          <option>Trung cấp</option>
        </Field>
        <Field
          label="Kỹ năng"
          as="select"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">Tất cả kỹ năng</option>
          {['Ngữ pháp', 'Giao tiếp', 'Đọc hiểu', 'Nghe', 'Luyện thi'].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Field>
      </>
    );
  }
  function reset() {
    setParams({});
    setLevel('');
    setCategory('');
  }
  return (
    <>
      <Heading title="Khám phá khóa học" description="Tìm khóa học phù hợp với mục tiêu của bạn." />
      <div className="catalog-filters">
        <Field
          label="Tìm kiếm khóa học"
          type="search"
          placeholder="Tên khóa học hoặc từ khóa…"
          value={query}
          onChange={(event) =>
            setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })
          }
        />
        <div className="desktop-filters">{filters()}</div>
        <Button
          className="mobile-filter-button"
          variant="secondary"
          onClick={() => setFilterOpen(true)}
          icon="settings"
        >
          Bộ lọc
        </Button>
      </div>
      <div className="split results-heading">
        <p aria-live="polite">
          {courses.length} khóa học
          {(query || level || category) && (
            <button className="text-link inline-clear" onClick={reset}>
              Xóa bộ lọc
            </button>
          )}
        </p>
        <Field
          label="Sắp xếp"
          as="select"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          <option value="recommended">Phù hợp nhất</option>
          <option value="title">Tên A–Z</option>
          <option value="shortest">Thời lượng ngắn nhất</option>
        </Field>
      </div>
      {courses.length ? (
        <div className="course-grid">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <Empty
          title="Chưa tìm thấy khóa học"
          description="Thử một từ khóa khác hoặc bớt điều kiện lọc."
          action={<Button onClick={reset}>Xóa bộ lọc</Button>}
        />
      )}
      <Modal open={filterOpen} title="Bộ lọc khóa học" onClose={() => setFilterOpen(false)}>
        {filters()}
        <Button onClick={() => setFilterOpen(false)}>Xem {courses.length} khóa học</Button>
        <Button variant="ghost" onClick={reset}>
          Đặt lại bộ lọc
        </Button>
      </Modal>
    </>
  );
}

export function LessonOutline({ course, activeId, onSelect }) {
  const { state } = useStore();
  const completed = state.completed[course.id] || [];
  return (
    <Card className="lesson-outline">
      <h2>Nội dung khóa học</h2>
      <p className="small">
        {completed.length} / {course.lessons} bài đã hoàn thành
      </p>
      <ol>
        {getLessons(course).map((lesson) => (
          <li key={lesson.id}>
            <button
              type="button"
              className={lesson.id === Number(activeId) ? 'active' : ''}
              onClick={() => onSelect(lesson.id)}
            >
              <Icon
                name={
                  completed.includes(lesson.id)
                    ? 'circle-check'
                    : lesson.id === Number(activeId)
                      ? 'play'
                      : 'book-open'
                }
              />
              <span>
                {lesson.title}
                <small>
                  {lesson.minutes} phút{lesson.id === Number(activeId) ? ' · Đang xem' : ''}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function CourseDetail() {
  const { courseId } = useParams();
  const { state, update, notify } = useStore();
  const navigate = useNavigate();
  const course = state.courses.find((c) => c.id === courseId && c.status === 'published');
  if (!course)
    return (
      <Empty
        title="Khóa học chưa sẵn sàng"
        description="Khóa học có thể đã được ẩn hoặc chưa xuất bản."
        action={<Button to="/courses">Xem các khóa học khác</Button>}
      />
    );
  const enrolled = state.enrolled.includes(courseId);
  const allowed = canEnroll(course, state.courses, state.completed);
  const prerequisite = state.courses.find((c) => c.id === course.prerequisite);
  const next = getLessons(course).find((l) => !state.completed[course.id]?.includes(l.id))?.id || 1;
  function enroll() {
    // TODO(API_ENROLLMENT): BE kiểm tiên quyết/trạng thái khóa rồi tạo đăng ký; chờ thành công
    // mới update/navigate. Nối luôn hủy đăng ký tại MyCourses, giữ chính sách bảo lưu tiến độ.
    if (!allowed) return;
    update((previous) => ({ enrolled: [...new Set([...previous.enrolled, courseId])] }));
    notify('Đã đăng ký ' + course.title + '.');
    navigate('/learn/' + course.id + '/' + next);
  }
  return (
    <>
      <BackLink to="/courses">Quay lại khóa học</BackLink>
      <div className="two-column course-detail">
        <div className="stack">
          <CourseArt course={course} large />
          <Card>
            <h2>Bạn sẽ học được gì?</h2>
            <ul className="check-list">
              {course.outcomes.map((text) => (
                <li key={text}>
                  <Icon name="check" />
                  {text}
                </li>
              ))}
            </ul>
          </Card>
          <LessonOutline
            course={course}
            onSelect={(id) =>
              enrolled
                ? navigate('/learn/' + courseId + '/' + id)
                : notify('Đăng ký khóa học để bắt đầu học.', 'primary')
            }
          />
        </div>
        <Card className="enrollment-card">
          <h2>{enrolled ? 'Hành trình của bạn' : 'Bắt đầu hành trình'}</h2>
          <p>
            {course.lessons} bài học · {course.hours} giờ nội dung
            <br />
            Quiz và bài tập thực hành
            <br />
            Giảng viên: {course.teacher}
          </p>
          <Notice title="Vì sao phù hợp?" icon="route">
            {course.reason}
          </Notice>
          <Notice
            tone={allowed ? 'success' : 'warning'}
            title={allowed ? 'Đủ điều kiện tham gia' : 'Cần hoàn thành khóa tiên quyết'}
            icon={allowed ? 'circle-check' : 'lock-keyhole'}
          >
            {prerequisite
              ? prerequisite.title + (allowed ? ' đã hoàn thành.' : ' cần đạt 100% tiến độ.')
              : 'Khóa học này không yêu cầu kiến thức tiên quyết.'}
          </Notice>
          {enrolled ? (
            <>
              <Progress value={progressOf(course, state.completed)} label="Tiến độ của bạn" />
              <Button to={'/learn/' + course.id + '/' + next}>Tiếp tục học</Button>
            </>
          ) : (
            <Button onClick={enroll} disabled={!allowed}>
              Đăng ký học
            </Button>
          )}
          {!allowed && prerequisite && (
            <Button to={'/courses/' + prerequisite.id} variant="secondary">
              Xem khóa tiên quyết
            </Button>
          )}
          <small>Bạn có thể hủy đăng ký trong Khóa học của tôi.</small>
        </Card>
      </div>
    </>
  );
}

export function MyCourses() {
  const { state, update, notify } = useStore();
  const [tab, setTab] = useState('active');
  const [cancelId, setCancelId] = useState(null);
  const courses = state.courses.filter(
    (c) =>
      state.enrolled.includes(c.id) &&
      c.status === 'published' &&
      (tab === 'completed'
        ? progressOf(c, state.completed) === 100
        : progressOf(c, state.completed) < 100),
  );
  return (
    <>
      <Heading
        title="Khóa học của tôi"
        description="Theo dõi tiến độ và tiếp tục bài học gần nhất."
      />
      <Tabs
        items={[
          { value: 'active', label: 'Đang học' },
          { value: 'completed', label: 'Đã hoàn thành' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {courses.length ? (
        <div className="course-grid">
          {courses.map((course) => (
            <div className="stack" key={course.id}>
              <CourseCard course={course} enrolled />
              <Button variant="ghost" onClick={() => setCancelId(course.id)}>
                Hủy đăng ký
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title={
            tab === 'completed'
              ? 'Chặng đường vẫn đang tiếp diễn'
              : 'Sẵn sàng cho một khởi đầu mới?'
          }
          description={
            tab === 'completed'
              ? 'Các khóa học hoàn thành sẽ xuất hiện ở đây.'
              : 'Khám phá khóa học và chọn một mục tiêu cho hôm nay.'
          }
          action={
            <Button
              to={tab === 'completed' ? '/my-courses' : '/courses'}
              onClick={() => setTab('active')}
            >
              {tab === 'completed' ? 'Tiếp tục học' : 'Khám phá khóa học'}
            </Button>
          }
        />
      )}
      <Modal
        open={Boolean(cancelId)}
        title="Hủy đăng ký khóa học?"
        onClose={() => setCancelId(null)}
      >
        <p>
          Khóa học sẽ rời danh sách đang học. Tiến độ đã hoàn thành vẫn được giữ nếu bạn đăng ký
          lại.
        </p>
        <div className="actions">
          <Button variant="secondary" onClick={() => setCancelId(null)}>
            Tiếp tục học
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              update((previous) => ({
                enrolled: previous.enrolled.filter((id) => id !== cancelId),
              }));
              setCancelId(null);
              notify('Đã hủy đăng ký khóa học.');
            }}
          >
            Xác nhận hủy
          </Button>
        </div>
      </Modal>
    </>
  );
}

// TODO(API_PROGRESS): Số liệu tính từ completed/quizResults/submissions trong cache học viên.
// Nạp tiến độ và kết quả được BE cấp quyền; làm mới sau hoàn thành bài, nộp quiz hoặc chấm bài.
export function StudentProgress() {
  const { state } = useStore();
  const courses = state.courses.filter((c) => state.enrolled.includes(c.id));
  const done = courses.reduce((sum, c) => sum + (state.completed[c.id]?.length || 0), 0);
  const total = courses.reduce((sum, c) => sum + c.lessons, 0);
  const quiz = Object.values(state.quizResults).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const rows = [
    ...quiz.map((result) => ({
      id: result.id,
      title: result.title,
      course: state.courses.find((c) => c.id === result.courseId)?.title,
      score: result.score + ' / ' + result.total,
      status: 'Hoàn thành',
    })),
    ...state.submissions
      .filter((s) => s.userId === state.session.userId)
      .map((s) => ({
        ...s,
        course: state.courses.find((c) => c.id === s.courseId)?.title,
        score: s.status === 'graded' ? s.score + ' / 10' : '—',
        status: s.status === 'graded' ? 'Đã chấm' : 'Chờ chấm',
      })),
  ];
  return (
    <>
      <Heading title="Tiến độ học tập" description="Nhìn lại những gì bạn đã hoàn thành." />
      <div className="metrics">
        <Metric
          label="Bài học hoàn thành"
          value={done}
          note={'Trong ' + courses.length + ' khóa học'}
        />
        <Metric
          label="Tiến độ khóa học"
          value={(total ? Math.round((done / total) * 100) : 0) + '%'}
          note="Tính trên các khóa đã đăng ký"
        />
        <Metric
          label="Điểm quiz gần nhất"
          value={quiz.length ? quiz[0].score + ' / ' + quiz[0].total : '—'}
          note={quiz.length ? quiz[0].title : 'Hoàn thành một quiz để xem kết quả'}
        />
      </div>
      <Card>
        <h2>Tiến độ theo khóa học</h2>
        {courses.length ? (
          courses.map((course) => (
            <Link key={course.id} className="course-progress-row" to={'/courses/' + course.id}>
              <strong>{course.title}</strong>
              <Progress
                value={progressOf(course, state.completed)}
                label={(state.completed[course.id]?.length || 0) + ' / ' + course.lessons + ' bài'}
              />
            </Link>
          ))
        ) : (
          <p>Đăng ký khóa học đầu tiên để bắt đầu theo dõi tiến độ.</p>
        )}
      </Card>
      <SectionHeading title="Kết quả gần đây" />
      <DataTable
        caption="Kết quả học tập gần đây"
        rows={rows}
        columns={[
          { key: 'title', label: 'Bài đánh giá' },
          { key: 'course', label: 'Khóa học' },
          { key: 'score', label: 'Kết quả' },
          {
            key: 'status',
            label: 'Trạng thái',
            render: (row) => (
              <Badge tone={row.status === 'Chờ chấm' ? 'warning' : 'success'}>{row.status}</Badge>
            ),
          },
        ]}
      />
    </>
  );
}
