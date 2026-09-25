import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Brand, Button, Icon, IconButton, SoundToggle } from './components';
import { notificationsFor, roleHome, roles } from './data';
import { useStore } from './store';

// EXTEND(ROUTES): Sidebar dùng bảng này; bottom nav còn có mobileItems bên dưới.
const navigation = {
  student: [
    ['/dashboard', 'house', 'Tổng quan'],
    ['/courses', 'book-open', 'Khám phá khóa học'],
    ['/my-courses', 'graduation-cap', 'Khóa học của tôi'],
    ['/path', 'route', 'Lộ trình cá nhân'],
    ['/progress', 'chart-column-increasing', 'Tiến độ học tập'],
  ],
  instructor: [
    ['/instructor/courses', 'book-open', 'Khóa học của tôi'],
    ['/instructor/submissions', 'clipboard-list', 'Bài nộp cần chấm'],
    ['/instructor/students', 'chart-column-increasing', 'Tiến độ học viên'],
  ],
  admin: [
    ['/admin', 'house', 'Tổng quan'],
    ['/admin/users', 'users', 'Người dùng'],
    ['/admin/courses', 'book-open', 'Khóa học'],
    ['/admin/reports', 'shield-check', 'Báo cáo nội dung'],
    ['/admin/logs', 'clipboard-list', 'Nhật ký hoạt động'],
  ],
};
const spaces = {
  student: 'Không gian học tập',
  instructor: 'Không gian giảng dạy',
  admin: 'Quản trị nền tảng',
};

// TODO(API_AUTH): Guard chỉ điều hướng UI; nạp phiên BE trước khi redirect và để BE kiểm quyền
// trên từng request/tài nguyên. Không dùng role trong localStorage làm quyền truy cập thật.
export function Guard({ role }) {
  const { state } = useStore();
  if (!state.session) return <Navigate to="/login" replace />;
  if (role && role !== state.session.role)
    return <Navigate to={roleHome[state.session.role]} replace />;
  return <Outlet />;
}

export function Layout({ focus = false }) {
  const reduced = useReducedMotion();
  const { state } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const main = useRef(null);
  const role = state.session.role;
  const items = navigation[role];
  const name = role === 'student' ? state.profile.name : state.session.name;
  const unread = notificationsFor(state).filter((n) => !n.read).length;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.current?.focus({ preventScroll: true });
  }, [pathname]);
  function searchSubmit(event) {
    event.preventDefault();
    const path =
      role === 'student'
        ? '/courses'
        : role === 'instructor'
          ? '/instructor/courses'
          : '/admin/users';
    navigate(path + '?q=' + encodeURIComponent(search));
  }
  const mobileItems =
    role === 'student'
      ? [
          ['/dashboard', 'house', 'Trang chủ'],
          ['/courses', 'book-open', 'Khóa học'],
          ['/path', 'route', 'Lộ trình'],
        ]
      : items.slice(0, 3);
  return (
    <div className={'app-layout ' + (focus ? 'focus-layout' : '')}>
      <a className="skip-link" href="#main-content">
        Bỏ qua điều hướng
      </a>
      {!focus && (
        <aside className="sidebar">
          <Brand />
          <span className="nav-caption">
            {role === 'student' ? 'GÓC HỌC TẬP' : roles[role].toUpperCase()}
          </span>
          <nav aria-label="Điều hướng chính">
            {items.map(([to, icon, label]) => (
              <NavLink key={to} to={to} end={to === '/admin' || to === '/dashboard'}>
                <Icon name={icon} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            {role === 'student' && (
              <div className="goal-note">
                <Icon name="route" />
                <strong>Mỗi ngày một bước</strong>
                <p>Hành trình tiếng Anh bắt đầu từ những tiến bộ nhỏ.</p>
              </div>
            )}
            <Link to="/profile" className="account-link">
              <Avatar name={name} />
              <span>
                <strong>{name}</strong>
                <small>{roles[role]}</small>
              </span>
            </Link>
          </div>
        </aside>
      )}
      <div className="workspace">
        <header className="topbar">
          {focus ? (
            <Brand />
          ) : (
            <>
              <div className="mobile-brand">
                <Brand />
              </div>
              <span className="workspace-name">{spaces[role]}</span>
            </>
          )}
          <div className="topbar-actions">
            <SoundToggle />
            {focus ? (
              <Button to={roleHome[role]} variant="ghost">
                Quay lại
              </Button>
            ) : (
              <>
                <Badge tone="neutral">Demo</Badge>
                <form onSubmit={searchSubmit} className="global-search" role="search">
                  <Icon name="search" />
                  <input
                    aria-label="Tìm kiếm trên nền tảng"
                    placeholder="Tìm kiếm…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <button className="sr-only" type="submit">
                    Tìm
                  </button>
                </form>
                <div className="notification-link">
                  <IconButton
                    to="/notifications"
                    name="bell"
                    label={'Thông báo' + (unread ? ', ' + unread + ' chưa đọc' : '')}
                  />
                  {unread > 0 && <span className="notification-dot" />}
                </div>
              </>
            )}
          </div>
        </header>
        <motion.main
          key={pathname}
          ref={main}
          id="main-content"
          tabIndex="-1"
          className="main-content"
          initial={{ opacity: 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Outlet />
        </motion.main>
      </div>
      {!focus && (
        <nav className="bottom-nav" aria-label="Điều hướng mobile">
          {[...mobileItems, ['/profile', 'user', 'Tài khoản']].map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/admin' || to === '/dashboard'}>
              <Icon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

export function HomeRedirect() {
  const { state } = useStore();
  return <Navigate to={state.session ? roleHome[state.session.role] : '/login'} replace />;
}
