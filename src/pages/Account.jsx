import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  BackLink,
  Badge,
  Brand,
  Button,
  Card,
  Choice,
  Empty,
  Field,
  Heading,
  Icon,
  Modal,
  Notice,
  SoundToggle,
} from '../components';
import { goals, notificationsFor, roleHome, roles, sessionFor } from '../data';
import { useFormError, useStore } from '../store';
import { FormError } from '../feedback';

// TODO(API_AUTH): Thay kiểm tra Demo@123/sessionFor bằng login/register và phiên do BE trả về.
// Dọn cả startDemo(), nút tài khoản mẫu và logout trong Profile khi chuyển sang dữ liệu thật.
export function Auth({ register = false }) {
  const { state, update, startDemo, notify } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useFormError();
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });
  function demo(role) {
    const actual = startDemo(role);
    if (actual) navigate(roleHome[actual]);
  }
  function submit(event) {
    event.preventDefault();
    setError('');
    if (register) {
      if (!form.name.trim()) return setError('Vui lòng nhập họ và tên.');
      if (form.password.length < 8) return setError('Mật khẩu cần ít nhất 8 ký tự.');
      if (form.password !== form.confirm) return setError('Mật khẩu nhập lại chưa khớp.');
      if (state.users.some((user) => user.email.toLowerCase() === form.email.trim().toLowerCase()))
        return setError('Email này đã tồn tại trong dữ liệu mẫu.');
      const user = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: 'student',
        active: true,
      };
      // ponytail: frontend demo only; a backend must replace this session before real authentication.
      update((previous) => ({
        users: [...previous.users, user],
        ...sessionFor(previous, user),
      }));
      navigate('/onboarding/goal');
      notify('Hồ sơ dùng thử đã được tạo. Hãy chọn mục tiêu của bạn.');
    } else {
      const user = state.users.find(
        (user) => user.email.toLowerCase() === form.email.trim().toLowerCase(),
      );
      if (!user || form.password !== 'Demo@123')
        return setError('Dùng email tài khoản mẫu và mật khẩu Demo@123.');
      if (!user.active) return setError('Tài khoản này đang tạm khóa.');
      update((previous) => sessionFor(previous, user));
      navigate(roleHome[user.role]);
      notify('Đăng nhập thành công. Chào mừng bạn trở lại!');
    }
  }
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <strong>luma english</strong>
        <div className="auth-story-content">
          <h1>
            Học đúng hướng.
            <br />
            Tiến bộ mỗi ngày.
          </h1>
          <p>
            Mục tiêu của bạn. Nhịp độ của bạn.
            <br />
            Một lộ trình dành riêng cho bạn.
          </p>
          <ol>
            {['Chọn mục tiêu', 'Khám phá trình độ', 'Bắt đầu lộ trình'].map((text, index) => (
              <li key={text}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {text}
              </li>
            ))}
          </ol>
        </div>
        <small>DATH 261 · Personalized English learning</small>
      </aside>
      <main className="auth-area">
        <Card className="auth-card">
          <div className="auth-brand-row">
            <Brand />
            <SoundToggle />
          </div>
          <Heading
            title={register ? 'Bắt đầu hành trình' : 'Chào mừng trở lại'}
            description={
              register
                ? 'Tạo hồ sơ để xây dựng lộ trình của riêng bạn.'
                : 'Đăng nhập để tiếp tục học cùng Luma.'
            }
          />
          <form onSubmit={submit} className="stack">
            {register && (
              <Field
                label="Họ và tên"
                autoComplete="name"
                required
                maxLength="80"
                value={form.name}
                onChange={set('name')}
              />
            )}
            <Field
              label="Địa chỉ email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              placeholder="minhanh@example.com"
              onChange={set('email')}
            />
            <Field
              label="Mật khẩu"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              required
              minLength={register ? 8 : undefined}
              value={form.password}
              onChange={set('password')}
              help={
                register
                  ? 'Bản dùng thử không lưu mật khẩu.'
                  : 'Tài khoản mẫu: minhanh@example.com · Demo@123'
              }
            />
            {register && (
              <Field
                label="Nhập lại mật khẩu"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirm}
                onChange={set('confirm')}
              />
            )}
            <FormError error={error} />
            <Button type="submit" className="full">
              {register ? 'Tạo hồ sơ dùng thử' : 'Đăng nhập'}
            </Button>
          </form>
          <p className="small">
            {register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <Link className="text-link" to={register ? '/login' : '/register'}>
              {register ? 'Đăng nhập' : 'Tạo tài khoản'}
            </Link>
          </p>
          {!register && (
            <div className="demo-accounts">
              <div className="divider-label">Khám phá với tài khoản mẫu</div>
              <div className="demo-buttons">
                {Object.entries(roles).map(([role, label]) => (
                  <Button key={role} variant="secondary" onClick={() => demo(role)}>
                    {label}
                  </Button>
                ))}
              </div>
              <small>Thay đổi được lưu trên trình duyệt của bạn.</small>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

// TODO(API_PROFILE): save() hiện sửa profile/session/users trong local state.
// PATCH hồ sơ, dùng dữ liệu BE trả về; chỉ notify success sau khi server đã lưu.
export function Profile() {
  const { state, update, notify, resetDemo } = useStore();
  const navigate = useNavigate();
  const student = state.session.role === 'student';
  const [name, setName] = useState(student ? state.profile.name : state.session.name);
  const [email, setEmail] = useState(student ? state.profile.email : state.session.email);
  const [dailyMinutes, setDailyMinutes] = useState(state.profile.dailyMinutes);
  const [resetOpen, setResetOpen] = useState(false);
  function save(event) {
    event.preventDefault();
    if (!name.trim()) return;
    if (
      state.users.some(
        (user) =>
          user.id !== state.session.userId &&
          user.email.toLowerCase() === email.trim().toLowerCase(),
      )
    )
      return notify('Email đã được một hồ sơ khác sử dụng.', 'danger');
    update((previous) => ({
      session: { ...previous.session, name: name.trim(), email },
      profile: student
        ? { ...previous.profile, name: name.trim(), email, dailyMinutes: Number(dailyMinutes) }
        : previous.profile,
      users: previous.users.map((user) =>
        user.id === previous.session.userId ? { ...user, name: name.trim(), email } : user,
      ),
    }));
    notify('Đã lưu thông tin cá nhân.');
  }
  return (
    <>
      <Heading title="Hồ sơ cá nhân" description="Quản lý thông tin và mục tiêu học tập của bạn." />
      <div className="two-column">
        <Card>
          <div className="profile-identity">
            <Avatar name={name || 'Bạn'} />
            <div>
              <h2>{name || 'Hồ sơ của bạn'}</h2>
              <Badge>{roles[state.session.role]}</Badge>
            </div>
          </div>
          <form className="stack" onSubmit={save}>
            <Field
              label="Họ và tên"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength="80"
              required
            />
            <Field
              label="Địa chỉ email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
            />
            {student && (
              <Field
                label="Thời gian học mỗi ngày"
                as="select"
                value={dailyMinutes}
                onChange={(event) => setDailyMinutes(event.target.value)}
              >
                {[10, 20, 30, 45, 60].map((value) => (
                  <option key={value} value={value}>
                    {value} phút
                  </option>
                ))}
              </Field>
            )}
            <Button type="submit">Lưu thay đổi</Button>
          </form>
        </Card>
        <div className="stack">
          {student && (
            <Card>
              <Icon name="route" />
              <h2>Mục tiêu học tập</h2>
              <h3>{state.profile.goal}</h3>
              <p>Mục tiêu này được dùng để đề xuất lộ trình học của bạn.</p>
              <Button to="/onboarding/goal" variant="secondary">
                Cập nhật mục tiêu
              </Button>
              <Button to="/placement" variant="ghost">
                Làm lại kiểm tra đầu vào
              </Button>
            </Card>
          )}
          <Card>
            <h2>Truy cập nhanh</h2>
            {(student
              ? [
                  ['/my-courses', 'Khóa học của tôi'],
                  ['/progress', 'Tiến độ học tập'],
                ]
              : state.session.role === 'admin'
                ? [
                    ['/admin/reports', 'Báo cáo nội dung'],
                    ['/admin/logs', 'Nhật ký hoạt động'],
                  ]
                : [
                    ['/instructor/courses', 'Quản lý khóa học'],
                    ['/instructor/students', 'Tiến độ học viên'],
                  ]
            ).map(([to, text]) => (
              <Button key={to} to={to} variant="secondary">
                {text}
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={() => {
                update({ session: null });
                navigate('/login');
              }}
            >
              Đăng xuất / Đổi tài khoản mẫu
            </Button>
          </Card>
          <Button variant="ghost" onClick={() => setResetOpen(true)}>
            Khôi phục dữ liệu mẫu
          </Button>
        </div>
      </div>
      <Modal open={resetOpen} title="Khôi phục dữ liệu mẫu?" onClose={() => setResetOpen(false)}>
        <p>
          Các thay đổi, bài làm và hồ sơ dùng thử trên trình duyệt này sẽ được xóa. Dữ liệu mẫu ban
          đầu sẽ được khôi phục.
        </p>
        <div className="actions">
          <Button variant="secondary" onClick={() => setResetOpen(false)}>
            Giữ lại
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              resetDemo();
              navigate('/login');
            }}
          >
            Khôi phục
          </Button>
        </div>
      </Modal>
    </>
  );
}

// TODO(API_NOTIFICATIONS): GET danh sách của người đang đăng nhập + PATCH trạng thái đã đọc.
// Thông báo chấm bài/trả lời thảo luận phải được BE tạo, không còn thêm trực tiếp ở page khác.
export function Notifications() {
  const { state, update } = useStore();
  const navigate = useNavigate();
  const notifications = notificationsFor(state);
  function open(item) {
    update((previous) => ({
      notifications: previous.notifications.map((n) =>
        n.id === item.id ? { ...n, read: true } : n,
      ),
    }));
    navigate(item.to);
  }
  return (
    <>
      <Heading
        title="Thông báo"
        description="Cập nhật bài học, bài tập và phản hồi mới."
        actions={
          <Button
            variant="secondary"
            onClick={() =>
              update((previous) => ({
                notifications: previous.notifications.map((n) =>
                  n.userId === previous.session.userId ? { ...n, read: true } : n,
                ),
              }))
            }
          >
            Đánh dấu tất cả đã đọc
          </Button>
        }
      />
      <div className="stack">
        {notifications.map((item) => (
          <button
            key={item.id}
            className={'notification-card ' + (!item.read ? 'unread' : '')}
            onClick={() => open(item)}
          >
            <span className="notification-symbol">
              <Icon name="bell" />
            </span>
            <span>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
              <small>{item.read ? 'Đã đọc' : 'Chưa đọc'}</small>
            </span>
            <Icon name="chevron-right" />
          </button>
        ))}
      </div>
      {!notifications.length && (
        <Empty
          title="Bạn đã xem hết cập nhật"
          description="Thông báo mới dành cho tài khoản này sẽ xuất hiện ở đây."
          icon="bell"
        />
      )}
    </>
  );
}

// TODO(API_PROFILE): Lưu goal vào hồ sơ BE trước khi sang placement; làm mới gợi ý/lộ trình.
export function Goals() {
  const { state, update } = useStore();
  const [goal, setGoal] = useState(state.profile.goal);
  const navigate = useNavigate();
  return (
    <>
      <Badge>BƯỚC 1 / 3</Badge>
      <Heading
        title="Bạn muốn học tiếng Anh để làm gì?"
        description="Chọn mục tiêu chính. Bạn có thể cập nhật sau trong hồ sơ."
      />
      <Card>
        <fieldset className="choice-list">
          <legend className="sr-only">Mục tiêu học tập</legend>
          {goals.map((item, index) => (
            <Choice
              key={item}
              name="goal"
              value={item}
              selected={goal === item}
              onChange={() => setGoal(item)}
              letter={String(index + 1).padStart(2, '0')}
            >
              {item}
            </Choice>
          ))}
        </fieldset>
        <Notice title="Học theo mục tiêu của bạn" icon="route">
          Kết quả kiểm tra đầu vào giúp sắp xếp thứ tự học phù hợp.
        </Notice>
        <Button
          onClick={() => {
            update({ profile: { ...state.profile, goal } });
            navigate('/placement');
          }}
        >
          Lưu và tiếp tục
          <Icon name="arrow-right" />
        </Button>
      </Card>
    </>
  );
}

export function PlacementIntro() {
  return (
    <>
      <Badge>BƯỚC 2 / 3</Badge>
      <Heading
        title="Bắt đầu từ trình độ của bạn"
        description="Bài kiểm tra ngắn giúp chúng mình đề xuất lộ trình phù hợp."
      />
      <Card className="intro-card">
        <Icon name="clipboard-list" />
        <h2>Khám phá điểm mạnh của bạn</h2>
        {[
          ['20', 'câu hỏi', 'Ngữ pháp, từ vựng và đọc hiểu'],
          ['15', 'phút dự kiến', 'Chọn thời điểm bạn có thể tập trung'],
          ['01', 'lộ trình riêng', 'Dựa trên mục tiêu và kết quả của bạn'],
        ].map(([number, title, body]) => (
          <div className="intro-step" key={number}>
            <span>{number}</span>
            <div>
              <strong>{title}</strong>
              <p>{body}</p>
            </div>
          </div>
        ))}
        <p>
          Hãy chọn đáp án theo hiểu biết hiện tại. Câu trả lời giúp điều chỉnh lộ trình học của bạn.
        </p>
        <div className="actions">
          <Button to="/placement/test">Bắt đầu kiểm tra</Button>
          <BackLink to="/onboarding/goal">Đổi mục tiêu</BackLink>
        </div>
      </Card>
    </>
  );
}
