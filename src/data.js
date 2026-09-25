export const roles = { student: 'Học viên', instructor: 'Giảng viên', admin: 'Quản trị viên' };
export const roleHome = {
  student: '/dashboard',
  instructor: '/instructor/courses',
  admin: '/admin',
};
export const goals = [
  'Củng cố nền tảng',
  'Giao tiếp hằng ngày',
  'Học tập và công việc',
  'Chuẩn bị thi cử',
];

export const initialCourses = [
  {
    id: 'foundations',
    title: 'English Foundations',
    art: 'Aa',
    color: 'indigo',
    level: 'Cơ bản',
    category: 'Ngữ pháp',
    description: 'Nắm chắc ngữ pháp căn bản và cách dùng từ.',
    reason: 'Phù hợp với mục tiêu củng cố nền tảng và kết quả đầu vào của bạn.',
    lessons: 12,
    hours: 3,
    teacher: 'Linh Trần',
    learners: 64,
    status: 'published',
    prerequisite: '',
    outcomes: [
      'Sử dụng cấu trúc câu và các thì cơ bản.',
      'Mở rộng từ vựng trong tình huống quen thuộc.',
      'Áp dụng kiến thức qua quiz và bài tập thực hành.',
    ],
  },
  {
    id: 'everyday',
    title: 'Everyday English',
    art: 'Hi!',
    color: 'teal',
    level: 'Cơ bản',
    category: 'Giao tiếp',
    description: 'Giao tiếp tự nhiên trong những tình huống quen thuộc.',
    reason: 'Gợi ý từ mục tiêu giao tiếp và lịch sử học của bạn.',
    lessons: 10,
    hours: 3,
    teacher: 'Linh Trần',
    learners: 48,
    status: 'published',
    prerequisite: '',
    outcomes: [
      'Giới thiệu bản thân một cách tự tin.',
      'Hỏi đường, gọi món và giao tiếp khi mua sắm.',
      'Duy trì những cuộc hội thoại ngắn.',
    ],
  },
  {
    id: 'reading',
    title: 'Reading Essentials',
    art: 'Read',
    color: 'peach',
    level: 'Trung cấp',
    category: 'Đọc hiểu',
    description: 'Đọc hiểu ý chính và mở rộng vốn từ từng ngày.',
    reason: 'Hoàn thành khóa nền tảng để sẵn sàng học.',
    lessons: 10,
    hours: 4,
    teacher: 'Thanh Nguyễn',
    learners: 32,
    status: 'published',
    prerequisite: 'foundations',
    outcomes: [
      'Tìm ý chính và thông tin cụ thể.',
      'Đoán nghĩa từ trong ngữ cảnh.',
      'Tóm tắt các đoạn văn ngắn.',
    ],
  },
  {
    id: 'listening',
    title: 'Listening Starter',
    art: 'Listen',
    color: 'lilac',
    level: 'Cơ bản',
    category: 'Nghe',
    description: 'Làm quen với giọng nói và những hội thoại ngắn.',
    reason: 'Luyện nghe từ những tình huống quen thuộc.',
    lessons: 8,
    hours: 2,
    teacher: 'Linh Trần',
    learners: 16,
    status: 'published',
    prerequisite: '',
    outcomes: [
      'Nhận biết thông tin trong hội thoại.',
      'Nghe số, giờ và địa điểm.',
      'Làm quen với nối âm cơ bản.',
    ],
  },
  {
    id: 'grammar',
    title: 'Grammar in Use',
    art: 'Verb',
    color: 'teal',
    level: 'Trung cấp',
    category: 'Ngữ pháp',
    description: 'Thực hành cấu trúc câu và các thì phổ biến.',
    reason: 'Ôn lại phần ngữ pháp còn cần cải thiện.',
    lessons: 8,
    hours: 3,
    teacher: 'Linh Trần',
    learners: 0,
    status: 'draft',
    prerequisite: 'foundations',
    outcomes: [
      'Phân biệt các thì thông dụng.',
      'Viết câu đúng ngữ pháp.',
      'Sử dụng cấu trúc trong ngữ cảnh.',
    ],
  },
  {
    id: 'exam',
    title: 'Exam Foundations',
    art: 'Exam',
    color: 'peach',
    level: 'Trung cấp',
    category: 'Luyện thi',
    description: 'Chuẩn bị kiến thức nền tảng cho mục tiêu thi cử.',
    reason: 'Xây nền tảng trước khi bắt đầu lộ trình luyện thi.',
    lessons: 12,
    hours: 5,
    teacher: 'Thanh Nguyễn',
    learners: 24,
    status: 'published',
    prerequisite: 'foundations',
    outcomes: [
      'Làm quen với các dạng câu hỏi.',
      'Cải thiện tốc độ đọc hiểu.',
      'Lập kế hoạch ôn tập phù hợp.',
    ],
  },
];

const curricula = {
  foundations: [
    'Chào hỏi và giới thiệu',
    'Danh từ và đại từ',
    'Động từ to be',
    'Thì hiện tại đơn',
    'Câu phủ định và câu hỏi',
    'Trạng từ tần suất',
    'Giới từ thời gian',
    'Thì hiện tại tiếp diễn',
    'Thì quá khứ đơn',
    'Từ vựng hằng ngày',
    'Luyện tập tổng hợp',
    'Ôn tập cuối khóa',
  ],
  everyday: [
    'Saying hello',
    'Introducing yourself',
    'Talking about your day',
    'At the café',
    'Asking for directions',
    'Going shopping',
    'Making plans',
    'At work',
    'Talking on the phone',
    'Let’s have a conversation',
  ],
  reading: [
    'Finding the main idea',
    'Reading for details',
    'Understanding context',
    'Everyday messages',
    'Short stories',
    'News and articles',
    'Making inferences',
    'Connecting ideas',
    'Summarising a text',
    'Reading practice',
  ],
  listening: [
    'Sounds and words',
    'Numbers and time',
    'Where are you from?',
    'Everyday conversations',
    'Directions',
    'Making arrangements',
    'Listen for details',
    'Listening practice',
  ],
};
// EXTEND(DATA_MODEL): course.lessons là SỐ LƯỢNG; lesson.id là số 1..N trong từng course.
// Nếu BE dùng UUID hoặc cho xóa/đổi thứ tự bài, đổi đồng bộ routes, completed và các khóa *Edits.
export function getLessons(course) {
  const titles = course.lessonTitles ||
    curricula[course.id] || [
      'Getting started',
      'Words in context',
      'Sentence structure',
      'Practice together',
      'Common mistakes',
      'Apply your knowledge',
      'Practice and review',
      'Final review',
    ];
  return Array.from({ length: course.lessons }, (_, index) => ({
    id: index + 1,
    title: titles[index] || 'Thực hành mở rộng ' + (index + 1),
    minutes: index === 3 ? 12 : 10,
  }));
}

export const lessonCopy = {
  1: {
    en: 'Hello, I’m Minh Anh.',
    sub: 'Nice to meet you. How are you today?',
    body: 'Dùng “Hello” hoặc “Hi” để chào hỏi. Giới thiệu tên bằng “I’m…” hoặc “My name is…”.',
    examples: [
      'Hello, my name is Anna.',
      'Nice to meet you, Anna.',
      'How are you? — I’m well, thank you.',
    ],
  },
  2: {
    en: 'Nouns & Pronouns',
    sub: 'I · you · he · she · it · we · they',
    body: 'Danh từ gọi tên người, vật và địa điểm. Đại từ giúp thay thế danh từ để tránh lặp lại.',
    examples: [
      'Anna is a student. She studies English.',
      'These are my books. They are new.',
      'Tom and I are friends. We live nearby.',
    ],
  },
  3: {
    en: 'To be',
    sub: 'I am. You are. She is.',
    body: 'Dùng am, is, are để giới thiệu bản thân, nghề nghiệp và trạng thái. Thêm “not” để tạo câu phủ định.',
    examples: ['I am a student.', 'She is not tired.', 'Are you ready? — Yes, I am.'],
  },
  4: {
    en: 'Present Simple',
    sub: 'I work.   You work.   She works.',
    body: 'Thì hiện tại đơn diễn tả thói quen, sự thật và các hoạt động lặp lại. Thêm -s hoặc -es với chủ ngữ he, she, it.',
    examples: [
      'I study English every afternoon.',
      'She goes to school every morning.',
      'They do not work on Sundays.',
    ],
  },
  5: {
    en: 'Questions & Negatives',
    sub: 'Do you…? Does she…?',
    body: 'Dùng do/does để đặt câu hỏi. Dùng don’t/doesn’t để phủ định. Động từ chính giữ nguyên mẫu.',
    examples: ['Do you like English?', 'She doesn’t drink coffee.', 'Does he live here?'],
  },
};

const q = (id, prompt, options, answer, explanation) => ({
  id,
  prompt,
  options,
  answer,
  explanation,
});
export const quizQuestions = [
  q(
    'q1',
    'Choose the correct sentence.',
    [
      'She go to school every morning.',
      'She goes to school every morning.',
      'She going to school every morning.',
      'She gone to school every morning.',
    ],
    1,
    'Với chủ ngữ “she”, động từ “go” thêm -es trong thì hiện tại đơn.',
  ),
  q(
    'q2',
    'They ___ football on Sundays.',
    ['plays', 'playing', 'play', 'played'],
    2,
    'Chủ ngữ “they” đi với động từ nguyên mẫu “play”.',
  ),
  q(
    'q3',
    'He ___ coffee.',
    ['don’t drink', 'doesn’t drink', 'doesn’t drinks', 'not drinks'],
    1,
    'Sau “doesn’t”, động từ chính dùng dạng nguyên mẫu.',
  ),
  q(
    'q4',
    '___ you speak English?',
    ['Does', 'Are', 'Do', 'Is'],
    2,
    'Dùng “do” cho câu hỏi với chủ ngữ “you”.',
  ),
  q(
    'q5',
    'My father ___ at a hospital.',
    ['work', 'works', 'working', 'to work'],
    1,
    '“My father” là ngôi thứ ba số ít, nên thêm -s.',
  ),
  q(
    'q6',
    'The sun ___ in the east.',
    ['rise', 'rising', 'rises', 'to rise'],
    2,
    'Hiện tại đơn diễn tả sự thật. “The sun” là số ít.',
  ),
  q(
    'q7',
    'We ___ breakfast at seven.',
    ['has', 'have', 'having', 'had'],
    1,
    '“We” đi với “have” để nói về thói quen.',
  ),
  q(
    'q8',
    'Where ___ your sister live?',
    ['do', 'is', 'does', 'are'],
    2,
    'Câu hỏi với “your sister” dùng trợ động từ “does”.',
  ),
  q(
    'q9',
    'Choose the correct negative sentence.',
    ['I doesn’t like tea.', 'I not like tea.', 'I don’t like tea.', 'I don’t likes tea.'],
    2,
    'Dùng “don’t + động từ nguyên mẫu” với chủ ngữ “I”.',
  ),
  q(
    'q10',
    'She usually ___ her homework after dinner.',
    ['do', 'does', 'doing', 'did'],
    1,
    '“Usually” chỉ thói quen; “she” đi với “does”.',
  ),
];
export const placementQuestions = [
  ...quizQuestions,
  q('p11', 'I ___ a student.', ['is', 'are', 'am', 'be'], 2, '“I” luôn đi với “am”.'),
  q(
    'p12',
    'What is the opposite of “early”?',
    ['fast', 'late', 'slow', 'soon'],
    1,
    '“Late” có nghĩa là muộn, trái nghĩa với “early”.',
  ),
  q(
    'p13',
    'There ___ two books on the table.',
    ['is', 'am', 'be', 'are'],
    3,
    '“Two books” là số nhiều nên dùng “are”.',
  ),
  q(
    'p14',
    'I went to the park ___.',
    ['yesterday', 'tomorrow', 'now', 'every day'],
    0,
    '“Went” là quá khứ của “go”, phù hợp với “yesterday”.',
  ),
  q(
    'p15',
    'Anna takes a bus to work. How does she travel?',
    ['By train', 'By bus', 'On foot', 'By bike'],
    1,
    'Đoạn văn nói rõ Anna đi bằng xe buýt.',
  ),
  q(
    'p16',
    'This book is ___ than that one.',
    ['interesting', 'most interesting', 'more interesting', 'interest'],
    2,
    'So sánh hơn của “interesting” dùng “more interesting”.',
  ),
  q(
    'p17',
    'We have lived here ___ 2020.',
    ['for', 'in', 'since', 'at'],
    2,
    '“Since” đi với mốc thời gian bắt đầu.',
  ),
  q(
    'p18',
    'If it rains, I ___ at home.',
    ['stay yesterday', 'will stay', 'stayed', 'have stay'],
    1,
    'Câu điều kiện loại một: if + hiện tại đơn, will + động từ.',
  ),
  q(
    'p19',
    'Could you ___ me a hand?',
    ['make', 'do', 'give', 'take'],
    2,
    '“Give someone a hand” nghĩa là giúp đỡ ai đó.',
  ),
  q(
    'p20',
    'The library closes at 6 p.m. Can you enter at 7 p.m.?',
    ['Yes, always.', 'No, it is closed.', 'Only on Fridays.', 'The text does not say.'],
    1,
    'Thư viện đóng cửa lúc 6 giờ tối, nên 7 giờ đã đóng cửa.',
  ),
];

export const initialUsers = [
  { id: 'minh-anh', name: 'Minh Anh', email: 'minhanh@example.com', role: 'student', active: true },
  {
    id: 'linh-tran',
    name: 'Linh Trần',
    email: 'linhtran@example.com',
    role: 'instructor',
    active: true,
  },
  {
    id: 'hoang-nam',
    name: 'Hoàng Nam',
    email: 'hoangnam@example.com',
    role: 'student',
    active: true,
  },
  { id: 'thu-ha', name: 'Thu Hà', email: 'thuha@example.com', role: 'student', active: false },
  { id: 'admin', name: 'Quản trị viên', email: 'admin@example.com', role: 'admin', active: true },
];
export const sampleWriting =
  'I usually wake up at six thirty. I have breakfast with my family and go to university at seven. I study English every afternoon.\n\nIn the evening, I finish my homework and read a book. My sister help me practise new words. We sometimes watch a short video together.\n\nI go to bed at ten thirty because I want to feel ready for the next day.';
export const initialSubmissions = [
  {
    id: 'sub-minh',
    userId: 'minh-anh',
    name: 'Minh Anh',
    title: 'My daily routine',
    courseId: 'foundations',
    filename: 'minh-anh-daily-routine.pdf',
    text: sampleWriting,
    createdAt: '2026-09-25T09:30:00+07:00',
    status: 'pending',
    score: '',
    feedback: '',
  },
  {
    id: 'sub-nam',
    userId: 'hoang-nam',
    name: 'Hoàng Nam',
    title: 'My daily routine',
    courseId: 'foundations',
    filename: 'daily-routine.docx',
    text: 'I get up at seven. I go to work by bus. In the evening, I cook dinner and study English. My family watches television together.',
    createdAt: '2026-09-25T08:15:00+07:00',
    status: 'pending',
    score: '',
    feedback: '',
  },
  {
    id: 'sub-ha',
    userId: 'thu-ha',
    name: 'Thu Hà',
    title: 'My daily routine',
    courseId: 'foundations',
    filename: 'thu-ha-routine.pdf',
    text: 'Every morning I take a walk before breakfast. I work from nine to five. After work, I visit my parents or read a book.',
    createdAt: '2026-09-24T21:40:00+07:00',
    status: 'graded',
    score: 8,
    feedback: 'Bố cục rõ ràng, sử dụng tốt thì hiện tại đơn.',
  },
];
export const initialReports = [
  {
    id: 'RP-024',
    title: 'Quảng cáo ngoài khóa học',
    context: 'Bình luận trong Present Simple',
    reporter: 'Minh Anh',
    content: 'Liên hệ để mua tài khoản và tài liệu ngoài khóa học.',
    status: 'pending',
    note: '',
    createdAt: '2026-09-25T09:20:00+07:00',
  },
  {
    id: 'RP-023',
    title: 'Nội dung không liên quan',
    context: 'Thảo luận tại Everyday English',
    reporter: 'Hoàng Nam',
    content: 'Một bình luận không liên quan tới nội dung bài học.',
    status: 'pending',
    note: '',
    createdAt: '2026-09-25T08:45:00+07:00',
  },
  {
    id: 'RP-022',
    title: 'Tài liệu không truy cập được',
    context: 'Tài liệu Reading Essentials',
    reporter: 'Thu Hà',
    content: 'Đường dẫn tài liệu bài 2 không mở được.',
    status: 'pending',
    note: '',
    createdAt: '2026-09-24T18:12:00+07:00',
  },
];
// EXTEND(DATA_MODEL): Thêm field demo tại đây; sửa readState() khi đổi schema đã lưu.
// Dữ liệu riêng học viên cần thêm vào sessionFor().fields để không trộn giữa tài khoản mẫu.
export function createInitialState() {
  return {
    version: 1,
    session: null,
    learnerId: 'minh-anh',
    learnerRecords: {},
    profile: { name: 'Minh Anh', email: 'minhanh@example.com', goal: goals[0], dailyMinutes: 20 },
    courses: initialCourses,
    users: initialUsers,
    enrolled: ['foundations', 'everyday', 'listening'],
    completed: { foundations: [1, 2, 3], everyday: [1, 2], listening: [1, 2] },
    quizResults: {},
    quizDrafts: {},
    placement: null,
    placementDraft: {},
    submissions: initialSubmissions,
    reports: initialReports,
    courseEdits: {},
    lessonEdits: {},
    questionEdits: {},
    assignmentEdits: {},
    discussions: [
      {
        id: 'discussion-1',
        userId: 'minh-anh',
        name: 'Minh Anh',
        text: 'Khi nào dùng do và khi nào dùng does ạ?',
        reply:
          'Dùng do với I, you, we, they; dùng does với he, she, it. Sau do/does, động từ chính giữ nguyên mẫu.',
        courseId: 'foundations',
        lessonId: 4,
      },
    ],
    notifications: [
      {
        id: 'n1',
        userId: 'minh-anh',
        title: 'Chào mừng bạn đến với Luma',
        body: 'Lộ trình của bạn đã sẵn sàng. Cùng bắt đầu một bài học nhé.',
        to: '/path',
        read: false,
      },
      {
        id: 'n2',
        userId: 'minh-anh',
        title: 'Tài liệu mới: Present Simple',
        body: 'Tóm tắt và ví dụ đã được cập nhật trong bài học.',
        to: '/learn/foundations/4',
        read: false,
      },
    ],
    logs: [
      {
        id: 'log-1',
        actor: 'Admin',
        action: 'Tạm khóa tài khoản',
        target: 'Thu Hà',
        createdAt: '2026-09-24T16:20:00+07:00',
      },
    ],
  };
}

export function sessionFor(state, user) {
  const session = { userId: user.id, role: user.role, name: user.name, email: user.email };
  if (user.role !== 'student') return { session };
  const fields = [
    'profile',
    'enrolled',
    'completed',
    'quizResults',
    'quizDrafts',
    'placement',
    'placementDraft',
  ];
  const records = {
    ...state.learnerRecords,
    [state.learnerId]: Object.fromEntries(fields.map((key) => [key, state[key]])),
  };
  const learner = records[user.id] || {
    profile: { name: user.name, email: user.email, goal: goals[0], dailyMinutes: 20 },
    enrolled: [],
    completed: {},
    quizResults: {},
    quizDrafts: {},
    placement: null,
    placementDraft: {},
  };
  return {
    ...learner,
    profile: { ...learner.profile, name: user.name, email: user.email },
    learnerId: user.id,
    learnerRecords: records,
    session,
  };
}

export function notificationsFor(state) {
  return state.notifications.filter((item) => item.userId === state.session?.userId);
}

export const defaultAssignment = {
  title: 'My daily routine',
  prompt:
    'Write a short paragraph about your daily routine. Use the present simple tense and include at least five activities.',
  due: '2026-09-28T23:59',
};

export function progressOf(course, completed) {
  return Math.min(100, Math.round(((completed[course.id]?.length || 0) / course.lessons) * 100));
}
export function canEnroll(course, courses, completed) {
  if (course.status !== 'published') return false;
  if (!course.prerequisite) return true;
  const prerequisite = courses.find((c) => c.id === course.prerequisite);
  return Boolean(prerequisite && progressOf(prerequisite, completed) === 100);
}
// TODO(API_QUIZ): Chấm điểm tại client chỉ phục vụ demo; BE chấm từ đáp án gốc.
// API đề thi cho học viên không trả answer/explanation trước khi được phép xem kết quả.
export function scoreAnswers(questions, answers) {
  return questions.reduce(
    (total, question) => total + (answers[question.id] === question.answer ? 1 : 0),
    0,
  );
}
export function validateUpload(file) {
  if (!file) return 'Vui lòng chọn một tệp.';
  if (!/\.(pdf|docx)$/i.test(file.name)) return 'Chỉ hỗ trợ tệp PDF hoặc DOCX.';
  if (file.size > 10 * 1024 * 1024) return 'Tệp vượt quá 10 MB. Vui lòng chọn tệp nhỏ hơn.';
  if (file.size === 0) return 'Tệp đang trống. Vui lòng chọn lại.';
  return '';
}
export function normalizeSearch(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}
export function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}
export function formatDate(value) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
