import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BackLink,
  Badge,
  Button,
  Card,
  Choice,
  Empty,
  Field,
  Heading,
  Icon,
  Metric,
  Modal,
  Notice,
  Progress,
  Tabs,
} from '../components';
import {
  defaultAssignment,
  formatDate,
  getLessons,
  lessonCopy,
  placementQuestions,
  quizQuestions,
  scoreAnswers,
  validateUpload,
} from '../data';
import { useFormError, useStore } from '../store';
import { FormError } from '../feedback';
import { LessonOutline } from './Student';
import { getLessonContent } from '../course-content';

function LessonSlides({ lesson, copy }) {
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(false);
  const slides = [
    { title: copy.en, text: copy.sub },
    { title: 'Remember', text: copy.body },
    { title: 'Let’s practise', text: copy.examples.join('\n') },
  ];
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setSlide((previous) => (previous + 1) % slides.length), 8000);
    return () => clearInterval(timer);
  }, [playing, slides.length]);
  return (
    <>
      <div className="lesson-stage">
        <small>ENGLISH LEARNING · BÀI {lesson.id}</small>
        <h2>{slides[slide].title}</h2>
        <p>{slides[slide].text}</p>
      </div>
      <div className="player-controls">
        <Button
          variant="secondary"
          className="icon-button"
          aria-label={playing ? 'Tạm dừng bài giảng mẫu' : 'Phát bài giảng mẫu'}
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <span aria-hidden="true">Ⅱ</span> : <Icon name="play" />}
        </Button>
        <span>
          Slide {slide + 1} / {slides.length}
        </span>
        <div className="slide-dots">
          {slides.map((item, index) => (
            <button
              key={item.title}
              className={index === slide ? 'active' : ''}
              aria-label={'Xem slide ' + (index + 1)}
              aria-pressed={slide === index}
              onClick={() => {
                setSlide(index);
                setPlaying(false);
              }}
            />
          ))}
        </div>
        <small>Bài giảng mẫu</small>
      </div>
    </>
  );
}

// TODO(API_LESSONS): Nội dung đang ghép getLessons/lessonCopy/lessonEdits, video từ Map trong Store.
// Nối bài học + media/tài liệu của BE; download() hiện chỉ tạo .txt từ nội dung mẫu.
export function Lesson() {
  const { courseId, lessonId } = useParams();
  const { state, update, notify, files } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('materials');
  const [question, setQuestion] = useState('');
  const [report, setReport] = useState(null);
  const [reason, setReason] = useState('Nội dung không liên quan');
  const course = state.courses.find((c) => c.id === courseId && c.status === 'published');
  const lesson = course && getLessons(course).find((l) => l.id === Number(lessonId));
  if (!course || !lesson)
    return (
      <Empty
        title="Không tìm thấy bài học"
        description="Hãy chọn một bài trong khóa học của bạn."
        action={<Button to="/my-courses">Khóa học của tôi</Button>}
      />
    );
  if (!state.enrolled.includes(courseId))
    return (
      <Empty
        title="Đăng ký để bắt đầu học"
        description={'Bài học này thuộc khóa ' + course.title + '.'}
        action={<Button to={'/courses/' + courseId}>Xem khóa học</Button>}
      />
    );
  const edited = state.lessonEdits[courseId + '-' + lesson.id];
  const copy =
    getLessonContent(courseId, lesson.id) ||
    (course.id === 'foundations' && lessonCopy[lesson.id]
      ? lessonCopy[lesson.id]
      : {
          en: lesson.title,
          sub: 'Learn. Practise. Grow.',
          body: 'Đọc các ví dụ, ghi lại từ mới và thử đặt câu của riêng bạn. Dùng tab Thảo luận để đặt câu hỏi cho giảng viên.',
          examples: [
            'Learning a little every day makes a difference.',
            'I practise English with my friends.',
            'What did you learn today?',
          ],
        });
  const video = files.current.get('video-' + courseId + '-' + lesson.id);
  const quizResult = state.quizResults[courseId + '-' + lesson.id];
  const quizPassed =
    quizResult &&
    (quizResult.percentage >= 70 || quizResult.score / (quizResult.total || 10) >= 0.7);
  const done = state.completed[courseId]?.includes(lesson.id) || Boolean(quizPassed);

  useEffect(() => {
    if (quizPassed && !state.completed[courseId]?.includes(lesson.id)) {
      update((previous) => ({
        completed: {
          ...previous.completed,
          [courseId]: [...new Set([...(previous.completed[courseId] || []), lesson.id])].sort(
            (a, b) => a - b,
          ),
        },
      }));
    }
  }, [quizPassed, courseId, lesson.id, state.completed, update]);

  const hasQuiz =
    state.courseSettings?.[courseId]?.hasQuiz !== false &&
    state.questionEdits[courseId]?.length !== 0;
  const discussions = state.discussions.filter(
    (item) => item.courseId === courseId && item.lessonId === lesson.id && !item.hidden,
  );
  function complete() {
    // TODO(API_PROGRESS): Gửi courseId/lessonId tới BE và nhận tiến độ đã xác nhận trước khi update.
    update((previous) => ({
      completed: {
        ...previous.completed,
        [courseId]: [...new Set([...(previous.completed[courseId] || []), lesson.id])].sort(
          (a, b) => a - b,
        ),
      },
    }));
    notify('Đã ghi nhận hoàn thành bài học.');
  }
  function download() {
    const blob = new Blob([lesson.title + '\n\n' + copy.body + '\n\n' + copy.examples.join('\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = courseId + '-lesson-' + lesson.id + '.txt';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function ask(event) {
    // TODO(API_DISCUSSIONS): Nối gửi câu hỏi và form báo cáo cuối Lesson; BE cấp id/tác giả.
    // DiscussionReply bên Instructor đang sửa reply và tạo notification trong cùng cache demo.
    event.preventDefault();
    if (!question.trim()) return;
    update((previous) => ({
      discussions: [
        ...previous.discussions,
        {
          id: crypto.randomUUID(),
          userId: previous.session.userId,
          name: previous.profile.name,
          text: question.trim(),
          reply: '',
          courseId,
          lessonId: lesson.id,
        },
      ],
    }));
    setQuestion('');
    notify('Câu hỏi đã được thêm vào thảo luận.');
  }
  return (
    <>
      <BackLink to={'/courses/' + courseId}>{course.title}</BackLink>
      <Heading
        title={edited?.title || lesson.title}
        description={'Bài ' + lesson.id + ' · ' + course.title}
      />
      <div className="two-column learning-columns">
        <div className="stack">
          {video ? (
            <video className="lesson-video" src={video.url} controls preload="metadata">
              <track kind="captions" label="Phụ đề chưa được cung cấp" />
            </video>
          ) : (
            <LessonSlides key={courseId + lesson.id} lesson={lesson} copy={copy} />
          )}
          <Tabs
            items={[
              { value: 'materials', label: 'Tài liệu' },
              { value: 'discussion', label: 'Thảo luận' },
              { value: 'practice', label: 'Bài tập' },
            ]}
            value={tab}
            onChange={setTab}
          />
          {tab === 'materials' && (
            <Card>
              <h2>Tài liệu bài học</h2>
              <button className="document-link" onClick={download}>
                <Icon name="file-text" />
                {lesson.title} · Tóm tắt.txt
                <Icon name="arrow-right" />
              </button>
              <p className="pre-line">{edited?.body || copy.body}</p>
              {copy.objectives && (
                <ul>
                  {copy.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              )}
              <ul className="example-list">
                {copy.examples.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
              {copy.practice && (
                <p>
                  <strong>Practice: </strong>
                  {copy.practice}
                </p>
              )}
              {copy.worksheet && (
                <a className="document-link" href={copy.worksheet} target="_blank" rel="noreferrer">
                  Open printable worksheet and answer key
                </a>
              )}
              <div className="actions">
                <Button onClick={complete} disabled={done} icon={done ? 'circle-check' : 'check'}>
                  {done ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                </Button>
                {hasQuiz ? (
                  <Button variant="secondary" to={'/quiz/' + courseId + '/' + lesson.id}>
                    Làm bài kiểm tra
                  </Button>
                ) : (
                  <Button variant="secondary" to={'/assignments/' + courseId}>
                    Làm bài tập viết
                  </Button>
                )}
              </div>
              {lesson.id < course.lessons && (
                <Button to={'/learn/' + courseId + '/' + (lesson.id + 1)} variant="ghost">
                  Bài tiếp theo
                  <Icon name="arrow-right" />
                </Button>
              )}
            </Card>
          )}
          {tab === 'discussion' && (
            <Card>
              <h2>Thảo luận bài học</h2>
              {discussions.map((item) => (
                <article key={item.id} className="discussion">
                  <div className="split">
                    <strong>{item.name}</strong>
                    <button className="text-link" onClick={() => setReport(item)}>
                      Báo cáo
                    </button>
                  </div>
                  <p>{item.text}</p>
                  {item.reply ? (
                    <div className="teacher-reply">
                      <Badge>Giảng viên · {item.repliedBy || course.teacher}</Badge>
                      <p>{item.reply}</p>
                    </div>
                  ) : (
                    <small>Đang chờ giảng viên phản hồi</small>
                  )}
                </article>
              ))}
              {!discussions.length && <p>Hãy là người đầu tiên đặt câu hỏi về bài học này.</p>}
              <form className="stack" onSubmit={ask}>
                <Field
                  as="textarea"
                  label="Câu hỏi của bạn"
                  rows="3"
                  required
                  maxLength="1000"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Bạn muốn hiểu rõ phần nào?"
                />
                <Button type="submit" disabled={!question.trim()}>
                  Gửi câu hỏi
                </Button>
              </form>
            </Card>
          )}
          {tab === 'practice' && (
            <Card>
              <h2>Áp dụng kiến thức</h2>
              {hasQuiz ? (
                <>
                  <p>Luyện tập với câu hỏi trắc nghiệm và bài tập viết thực hành.</p>
                  <Button to={'/quiz/' + courseId + '/' + lesson.id}>
                    Làm quiz · {(state.questionEdits[courseId] || quizQuestions).length} câu hỏi
                  </Button>
                  <Button to={'/assignments/' + courseId} variant="secondary">
                    Writing: {state.assignmentEdits[courseId]?.title || defaultAssignment.title}
                  </Button>
                </>
              ) : (
                <>
                  <p>
                    Khóa học này tập trung rèn luyện kỹ năng viết qua bài tập tự luận Writing. Hãy
                    làm bài tập và nộp để nhận phản hồi chi tiết từ giảng viên.
                  </p>
                  <Button to={'/assignments/' + courseId}>
                    Writing: {state.assignmentEdits[courseId]?.title || defaultAssignment.title}
                  </Button>
                </>
              )}
            </Card>
          )}
        </div>
        <LessonOutline
          course={course}
          activeId={lesson.id}
          onSelect={(id) => navigate('/learn/' + courseId + '/' + id)}
        />
      </div>
      <Modal open={Boolean(report)} title="Báo cáo nội dung" onClose={() => setReport(null)}>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            update((previous) => ({
              reports: [
                {
                  id: 'RP-' + crypto.randomUUID().slice(0, 6),
                  title: reason,
                  context: 'Thảo luận tại ' + lesson.title,
                  content: report.text,
                  reporter: previous.profile.name,
                  postId: report.id,
                  status: 'pending',
                  note: '',
                  createdAt: new Date().toISOString(),
                },
                ...previous.reports,
              ],
            }));
            setReport(null);
            notify('Đã gửi báo cáo để quản trị viên xem xét.');
          }}
        >
          <Field
            label="Lý do báo cáo"
            as="select"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          >
            {[
              'Nội dung không liên quan',
              'Quảng cáo ngoài khóa học',
              'Nội dung không phù hợp',
              'Thông tin chưa chính xác',
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </Field>
          <p>Quản trị viên sẽ xem ngữ cảnh trước khi xử lý.</p>
          <Button type="submit">Gửi báo cáo</Button>
        </form>
      </Modal>
    </>
  );
}

export function Quiz({ placement = false }) {
  const { courseId = 'placement', lessonId = '0' } = useParams();
  const { state, update, notify } = useStore();
  const navigate = useNavigate();
  const key = courseId + '-' + lessonId;
  const course = state.courses.find((c) => c.id === courseId);
  const questions = placement
    ? placementQuestions
    : state.questionEdits[courseId] ||
      getLessonContent(courseId, Number(lessonId))?.questions ||
      quizQuestions;
  const answers = placement ? state.placementDraft : state.quizDrafts[key] || {};
  const [index, setIndex] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const question = questions[index];
  const answered = questions.filter((q) => answers[q.id] !== undefined).length;
  const hasQuiz =
    placement ||
    (state.courseSettings?.[courseId]?.hasQuiz !== false &&
      state.questionEdits[courseId]?.length !== 0);
  if (!placement && !hasQuiz)
    return (
      <Empty
        title="Khóa học không có bài kiểm tra trắc nghiệm"
        description="Khóa học này tập trung đánh giá qua bài tập tự luận Writing."
        action={<Button to={'/assignments/' + courseId}>Đến bài tập tự luận</Button>}
      />
    );
  if (
    !placement &&
    (!course ||
      course.status !== 'published' ||
      !state.enrolled.includes(courseId) ||
      !getLessons(course).some((l) => l.id === Number(lessonId)))
  )
    return (
      <Empty
        title="Bài kiểm tra chưa sẵn sàng"
        description="Chọn bài học trong khóa đã đăng ký để luyện tập."
        action={<Button to="/my-courses">Khóa học của tôi</Button>}
      />
    );
  if (!question)
    return (
      <Empty
        title="Chưa có câu hỏi kiểm tra"
        description="Bài kiểm tra hiện chưa có câu hỏi nào."
        action={
          <Button to={placement ? '/placement' : `/learn/${courseId}/${lessonId}`}>Quay lại</Button>
        }
      />
    );
  function select(value) {
    update((previous) =>
      placement
        ? { placementDraft: { ...previous.placementDraft, [question.id]: value } }
        : {
            quizDrafts: {
              ...previous.quizDrafts,
              [key]: { ...previous.quizDrafts[key], [question.id]: value },
            },
          },
    );
  }
  function submit() {
    // TODO(API_QUIZ): Gửi answers theo questionId; nhận attemptId, score, total và quyền xem lời giải.
    // Không gửi score tự tính làm điểm thật; nối cả placement và luồng QuizResult/làm lại.
    const total = questions.length || 20;
    const correctCount = scoreAnswers(questions, answers);
    const percentage = Math.round((correctCount / total) * 100);
    const score10 = Math.round((correctCount / total) * 10 * 10) / 10;
    let level = 'A1';
    if (percentage > 80) level = 'B2';
    else if (percentage >= 60) level = 'B1';
    else if (percentage >= 40) level = 'A2';
    else level = 'A1';

    const result = {
      id: crypto.randomUUID(),
      courseId,
      lessonId,
      title: placement
        ? 'Kiểm tra đầu vào'
        : (getLessonContent(courseId, Number(lessonId))?.en || 'Present Simple') + ' Quiz',
      answers,
      questions,
      score: correctCount,
      score10,
      percentage,
      level: placement ? level : undefined,
      total,
      createdAt: new Date().toISOString(),
    };

    const passed = percentage >= 70;
    const numLessonId = Number(lessonId);

    update((previous) => {
      const nextCompleted =
        !placement && passed && numLessonId > 0
          ? {
              ...previous.completed,
              [courseId]: [...new Set([...(previous.completed[courseId] || []), numLessonId])].sort(
                (a, b) => a - b,
              ),
            }
          : previous.completed;

      return placement
        ? {
            placement: result,
            placementDraft: {},
            profile: { ...previous.profile, level },
          }
        : {
            quizResults: { ...previous.quizResults, [key]: result },
            completed: nextCompleted,
          };
    });
    navigate(placement ? '/placement/result' : '/quiz/' + courseId + '/' + lessonId + '/result');
    notify(
      !placement && passed
        ? 'Đã nộp bài, đạt yêu cầu và tự động hoàn thành bài học!'
        : 'Đã nộp bài và lưu kết quả của bạn.',
    );
  }
  return (
    <>
      <Heading
        title={placement ? 'Kiểm tra đầu vào' : 'Luyện tập: Present Simple'}
        description={
          placement
            ? 'Cùng tìm điểm bắt đầu phù hợp với bạn.'
            : (course?.title || '') + ' · Bài ' + lessonId
        }
      />
      <Progress
        value={Math.round((answered / questions.length) * 100)}
        label={'Đã trả lời ' + answered + ' / ' + questions.length + ' câu'}
      />
      <Card className="quiz-card">
        <Badge>
          {placement ? 'KIỂM TRA ĐẦU VÀO' : 'LUYỆN TẬP'} · Câu {index + 1} / {questions.length}
        </Badge>
        <fieldset className="choice-list">
          <legend>
            <h2>{question.prompt}</h2>
            <p>Chọn một đáp án đúng.</p>
          </legend>
          {question.options.map((option, i) => (
            <Choice
              key={i}
              name={question.id}
              value={i}
              selected={answers[question.id] === i}
              onChange={() => select(i)}
              letter={String.fromCharCode(65 + i)}
            >
              {option}
            </Choice>
          ))}
        </fieldset>
      </Card>
      <div className="split">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Câu trước
        </Button>
        {index < questions.length - 1 ? (
          <Button onClick={() => setIndex(index + 1)}>
            Câu tiếp theo
            <Icon name="arrow-right" />
          </Button>
        ) : (
          <Button onClick={() => setConfirm(true)}>Nộp bài</Button>
        )}
      </div>
      <div className="question-pagination" aria-label="Chuyển câu hỏi">
        {questions.map((q, i) => (
          <button
            key={q.id}
            className={
              (index === i ? 'current ' : '') + (answers[q.id] !== undefined ? 'answered' : '')
            }
            aria-label={
              'Câu ' + (i + 1) + (answers[q.id] !== undefined ? ', đã trả lời' : ', chưa trả lời')
            }
            aria-current={i === index ? 'step' : undefined}
            onClick={() => setIndex(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <small>Câu trả lời được giữ trên trình duyệt khi bạn chuyển câu.</small>
      <Modal open={confirm} title="Nộp bài kiểm tra?" onClose={() => setConfirm(false)}>
        <p>
          Bạn đã trả lời {answered} / {questions.length} câu.{' '}
          {answered < questions.length
            ? 'Các câu chưa trả lời sẽ được tính là chưa đúng.'
            : 'Bạn có thể xem giải thích sau khi nộp.'}
        </p>
        <div className="actions">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Kiểm tra lại
          </Button>
          <Button onClick={submit}>Xác nhận nộp bài</Button>
        </div>
      </Modal>
    </>
  );
}

export function QuizResult({ placement = false }) {
  const { courseId, lessonId } = useParams();
  const { state, update } = useStore();
  const key = courseId + '-' + lessonId;
  const result = placement ? state.placement : state.quizResults[key];
  const [review, setReview] = useState(false);
  if (!result)
    return (
      <Empty
        title="Bạn chưa có kết quả"
        description="Hoàn thành bài kiểm tra để nhận kết quả và giải thích."
        action={
          <Button
            to={placement ? '/placement' : '/quiz/' + courseId + '/' + lessonId}
            onClick={() => update(placement ? { placementDraft: {} } : {})}
          >
            Bắt đầu kiểm tra
          </Button>
        }
      />
    );
  const total = result.total || 20;
  const correct = result.score;
  const percentage =
    result.percentage !== undefined ? result.percentage : Math.round((correct / total) * 100);
  const score10 =
    result.score10 !== undefined ? result.score10 : Math.round((correct / total) * 10 * 10) / 10;
  let level = result.level || state.profile?.level;
  if (!level) {
    if (percentage > 80) level = 'B2';
    else if (percentage >= 60) level = 'B1';
    else if (percentage >= 40) level = 'A2';
    else level = 'A1';
  }
  const strong = placement ? percentage >= 60 : result.score / result.total >= 0.7;

  useEffect(() => {
    if (!placement && strong && lessonId) {
      const numLessonId = Number(lessonId);
      if (numLessonId > 0 && !state.completed[courseId]?.includes(numLessonId)) {
        update((previous) => ({
          completed: {
            ...previous.completed,
            [courseId]: [...new Set([...(previous.completed[courseId] || []), numLessonId])].sort(
              (a, b) => a - b,
            ),
          },
        }));
      }
    }
  }, [placement, strong, courseId, lessonId, state.completed, update]);

  function reset() {
    update((previous) =>
      placement ? { placementDraft: {} } : { quizDrafts: { ...previous.quizDrafts, [key]: {} } },
    );
  }
  return (
    <>
      <Heading
        title={placement ? 'Kết quả Đánh giá Năng lực Đầu vào' : 'Bạn đã hoàn thành bài kiểm tra!'}
        description={
          placement
            ? 'Kết quả phân loại trình độ CEFR và đề xuất lộ trình học tập cá nhân hóa.'
            : 'Xem lại câu trả lời và tiếp tục tiến bộ.'
        }
      />

      {placement && (
        <div className="metrics" style={{ marginBottom: '1.5rem' }}>
          <Metric
            label="Mức điểm đạt được"
            value={`${score10} / 10`}
            note={`${correct} / ${total} câu trả lời đúng`}
          />
          <Metric
            label="Mức độ hoàn thành"
            value={`${percentage}%`}
            note={percentage >= 60 ? 'Đạt chuẩn năng lực mục tiêu' : 'Cần củng cố nền tảng thêm'}
          />
          <Metric
            label="Xếp loại trình độ (Level)"
            value={`CEFR ${level}`}
            note={
              level === 'B2'
                ? 'Trung cao cấp / Nâng cao'
                : level === 'B1'
                  ? 'Trung cấp (Miễn tiên quyết)'
                  : level === 'A2'
                    ? 'Sơ cấp (Elementary)'
                    : 'Mới bắt đầu / Căn bản'
            }
          />
        </div>
      )}

      <Card className="result-card">
        <div className="score-circle">
          <strong>
            {placement ? `${percentage}%` : result.score}
            <span>{placement ? '' : ` / ${result.total}`}</span>
          </strong>
          <small>{placement ? 'Mức hoàn thành' : 'Câu trả lời đúng'}</small>
        </div>
        <div>
          <Badge tone={strong ? 'success' : 'primary'}>
            {placement
              ? `XẾP LỚP: TRÌNH ĐỘ CEFR ${level}`
              : strong
                ? 'NẮM BÀI KHÁ TỐT'
                : 'TIẾP TỤC CỐ GẮNG'}
          </Badge>
          <h2>
            {placement
              ? level === 'B2'
                ? 'Xuất sắc! Bạn đạt trình độ B2 (Nâng cao)'
                : level === 'B1'
                  ? 'Rất tốt! Bạn đạt trình độ B1 (Trung cấp)'
                  : level === 'A2'
                    ? 'Khá tốt! Bạn đạt trình độ A2 (Sơ cấp)'
                    : 'Điểm khởi đầu! Trình độ A1 (Cơ bản)'
              : strong
                ? 'Bạn đang tiến bộ rất tốt'
                : 'Củng cố nền tảng'}
          </h2>
          <p>
            {placement
              ? level === 'B2'
                ? `Bạn đạt ${percentage}% mức hoàn thành (${score10}/10 điểm). Với trình độ B2, bạn được tự động mở khóa toàn bộ các khóa học trên hệ thống và miễn toàn bộ điều kiện tiên quyết.`
                : level === 'B1'
                  ? `Bạn đạt ${percentage}% mức hoàn thành (${score10}/10 điểm). Với trình độ B1, bạn được tự động miễn điều kiện tiên quyết cấp Cơ bản và có thể bắt đầu học ngay các khóa Trung cấp.`
                  : level === 'A2'
                    ? `Bạn đạt ${percentage}% mức hoàn thành (${score10}/10 điểm). Bạn đã có phản xạ ngữ pháp cơ bản. Hệ thống đã chuẩn bị lộ trình phù hợp giúp bạn củng cố kiến thức vững chắc.`
                    : `Bạn đạt ${percentage}% mức hoàn thành (${score10}/10 điểm). Bạn nên bắt đầu từ khóa học Nền tảng (English Foundations) để xây dựng ngữ pháp và phát âm chuẩn từ đầu.`
              : strong
                ? 'Bạn đã hiểu các cấu trúc cơ bản. Hãy áp dụng kiến thức vào bài tập thực hành.'
                : 'Mỗi lần luyện tập giúp bạn hiểu rõ hơn. Xem lại cách chia động từ và thử đặt câu của riêng mình.'}
          </p>
        </div>
      </Card>
      {placement && (
        <Notice
          title={`Lộ trình học tập phù hợp với cấp độ CEFR ${level} đã sẵn sàng`}
          icon="route"
          tone={level === 'B2' || level === 'B1' ? 'success' : 'primary'}
        >
          {level === 'B2'
            ? 'Hệ thống đã mở khóa toàn bộ các môn học Nâng cao và Luyện thi. Bạn có thể bấm "Xem lộ trình của tôi" để bắt đầu học ngay.'
            : level === 'B1'
              ? 'Hệ thống đã mở khóa các môn học Đọc hiểu và Luyện thi nền tảng. Bạn không cần phải học lại khóa ngữ pháp cơ bản.'
              : 'Bắt đầu với khóa English Foundations để xây chắc nền móng, sau đó tiếp tục với Everyday English.'}
        </Notice>
      )}
      <div className="actions">
        <Button to={placement ? '/path' : '/assignments/' + courseId}>
          {placement ? 'Xem lộ trình của tôi' : 'Tiếp tục bài tập'}
        </Button>
        <Button variant="secondary" onClick={() => setReview(!review)}>
          {review ? 'Thu gọn câu trả lời' : 'Xem lại câu trả lời'}
        </Button>
        <Button
          variant="ghost"
          to={placement ? '/placement/test' : '/quiz/' + courseId + '/' + lessonId}
          onClick={reset}
        >
          Làm lại
        </Button>
      </div>
      {review && (
        <div className="stack">
          {result.questions.map((question, index) => {
            const correct = result.answers[question.id] === question.answer;
            return (
              <Card key={question.id}>
                <div className="split">
                  <h3>
                    Câu {index + 1}. {question.prompt}
                  </h3>
                  <Badge tone={correct ? 'success' : 'danger'}>
                    {correct ? 'Đúng' : 'Chưa đúng'}
                  </Badge>
                </div>
                <p>Bạn chọn: {question.options[result.answers[question.id]] || 'Chưa trả lời'}</p>
                <Notice tone="success" title={'Đáp án: ' + question.options[question.answer]}>
                  {question.explanation}
                </Notice>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export function Assignment() {
  const { courseId } = useParams();
  const { state, update, keepFile, notify } = useStore();
  const assignment = state.assignmentEdits[courseId] || defaultAssignment;
  const [file, setFile] = useState(null);
  const [error, setError] = useFormError();
  const [note, setNote] = useState('');
  const [replacing, setReplacing] = useState(false);
  const course = state.courses.find((c) => c.id === courseId && c.status === 'published');
  const submission = state.submissions.find(
    (s) => s.courseId === courseId && s.userId === state.session.userId,
  );
  if (!course || !state.enrolled.includes(courseId))
    return (
      <Empty
        title="Bài tập chưa sẵn sàng"
        description="Đăng ký khóa học để làm bài tập."
        action={<Button to="/courses">Khám phá khóa học</Button>}
      />
    );
  function select(event) {
    const next = event.target.files?.[0];
    const message = validateUpload(next);
    setError(message);
    setFile(message ? null : next);
  }
  function submit(event) {
    event.preventDefault();
    const message = validateUpload(file);
    if (message) return setError(message);
    // TODO(API_SUBMISSIONS): Upload file rồi lưu bài nộp ở BE; chỉ xóa file/form sau khi thành công.
    // Demo giữ 1 bài nộp mỗi học viên/course và nộp lại ghi đè cùng id; xem EXTEND(ASSESSMENTS).
    const id = submission?.id || crypto.randomUUID();
    keepFile(id, file);
    const next = {
      id,
      userId: state.session.userId,
      name: state.profile.name,
      title: assignment.title,
      courseId,
      filename: file.name,
      size: file.size,
      text: note,
      isLocalUpload: true,
      createdAt: new Date().toISOString(),
      status: 'pending',
      score: '',
      feedback: '',
    };
    update((previous) => ({
      submissions: [next, ...previous.submissions.filter((s) => s.id !== id)],
    }));
    setFile(null);
    setReplacing(false);
    notify('Đã nộp bài trong bản dùng thử. Bạn có thể xem bài ở tài khoản Giảng viên.');
  }
  return (
    <>
      <BackLink to={'/courses/' + courseId}>{course.title}</BackLink>
      <Heading
        title={'Writing: ' + assignment.title}
        description={course.title + ' · Bài tập thực hành'}
      />
      <div className="two-column">
        <Card>
          <Badge>BÀI TẬP VIẾT</Badge>
          <h2>{assignment.title}</h2>
          <p>{assignment.prompt}</p>
          <h3>Yêu cầu</h3>
          <ul className="plain-list">
            <li>Độ dài: 100–150 từ</li>
            <li>Sử dụng ít nhất 5 động từ</li>
            <li>Kiểm tra cách chia động từ và dấu câu</li>
          </ul>
          <div className="subtle-panel">
            <strong>Hạn nộp: {formatDate(assignment.due)}</strong>
            <p>Đánh giá: nội dung, ngữ pháp và từ vựng.</p>
          </div>
        </Card>
        <Card>
          <h2>Bài làm của bạn</h2>
          {submission && !replacing ? (
            <>
              <Notice
                tone={submission.status === 'graded' ? 'success' : 'primary'}
                title={
                  submission.status === 'graded' ? 'Bài tập đã được chấm' : 'Đã nộp bài · Chờ chấm'
                }
              >
                {submission.filename} · {formatDate(submission.createdAt)}
              </Notice>
              {submission.status === 'graded' && (
                <>
                  <div className="assignment-grade">
                    {submission.score}
                    <span> / 10</span>
                  </div>
                  <h3>Phản hồi từ giảng viên</h3>
                  <p>{submission.feedback}</p>
                </>
              )}
              <Button variant="secondary" onClick={() => setReplacing(true)}>
                Nộp lại bài
              </Button>
              <small>Nộp lại sẽ thay thế bài làm và điểm hiện tại.</small>
            </>
          ) : (
            <form className="stack" onSubmit={submit}>
              <label className={'upload-zone ' + (file ? 'has-file' : '')}>
                <Icon name={file ? 'file-text' : 'upload'} />
                <strong>{file ? file.name : 'Chọn tệp để tải lên'}</strong>
                <span>
                  {file
                    ? (file.size / 1024).toFixed(1) + ' KB · Nhấn để chọn lại'
                    : 'PDF, DOCX · tối đa 10 MB'}
                </span>
                <input type="file" accept=".pdf,.docx" aria-label="Tệp bài làm" onChange={select} />
              </label>
              <FormError error={error} />
              <Field
                label="Ghi chú cho giảng viên (tùy chọn)"
                as="textarea"
                rows="4"
                maxLength="2000"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <Button type="submit" disabled={!file}>
                Nộp bài
              </Button>
              {replacing && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setReplacing(false);
                    setFile(null);
                  }}
                >
                  Giữ bài đã nộp
                </Button>
              )}
            </form>
          )}
          <small>
            Bản dùng thử lưu tên tệp. Nội dung tệp chỉ xem được trong phiên hiện tại; chọn lại tệp
            sau khi tải lại trang.
          </small>
        </Card>
      </div>
    </>
  );
}
