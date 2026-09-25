import { useEffect, useId, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, NavLink } from 'react-router-dom';
import { canEnroll, getLessons, initials, progressOf } from './data';
import { useStore } from './store';
import { FormError } from './feedback';

const MotionLink = motion.create(Link);

export function Icon({ name, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={'icon ' + className}
      style={{ maskImage: 'url(/icons/' + name + '.svg)' }}
    />
  );
}
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Luma English — Trang chủ">
      <span className="brand-mark">
        <img src="/icons/brand-book.svg" alt="" />
      </span>
      <span>
        <strong>luma</strong>
        <small>ENGLISH LEARNING</small>
      </span>
    </Link>
  );
}
// REUSE(UI_COMPONENTS): Button có hover/tap + reduced motion; to="..." tạo Link,
// type="submit" dùng trong form. Field/Modal/FormError có hướng dẫn ở docs/HANDOFF.md.
export function Button({
  to,
  children,
  variant = 'primary',
  icon,
  className = '',
  type = 'button',
  ...props
}) {
  const reduced = useReducedMotion();
  const gestures =
    props.disabled || reduced
      ? {}
      : {
          whileHover: { y: -1 },
          whileTap: { scale: 0.97, y: 0 },
          transition: { duration: 0.16, ease: 'easeOut' },
        };
  const classes = 'button button-' + variant + ' ' + className;
  const content = (
    <>
      {icon && <Icon name={icon} />}
      {children}
    </>
  );
  return to ? (
    <MotionLink to={to} className={classes} {...gestures} {...props}>
      {content}
    </MotionLink>
  ) : (
    <motion.button type={type} className={classes} {...gestures} {...props}>
      {content}
    </motion.button>
  );
}
export function SoundToggle() {
  const { soundEnabled, toggleSound } = useStore();
  return (
    <Button
      variant="ghost"
      className="icon-button sound-toggle"
      onClick={toggleSound}
      aria-label="Âm thanh phản hồi"
      aria-pressed={soundEnabled}
      title={soundEnabled ? 'Tắt âm thanh phản hồi' : 'Bật âm thanh phản hồi'}
    >
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m11 5-6 4H2v6h3l6 4z" />
        {soundEnabled ? (
          <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
        ) : (
          <path d="m16 9 5 6m0-6-5 6" />
        )}
      </svg>
    </Button>
  );
}
export function IconButton({ name, label, to, ...props }) {
  return (
    <Button
      to={to}
      variant="secondary"
      className="icon-button"
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon name={name} />
    </Button>
  );
}
export function Badge({ children, tone = 'primary' }) {
  return <span className={'badge badge-' + tone}>{children}</span>;
}
export function Card({ children, className = '', ...props }) {
  return (
    <section className={'card ' + className} {...props}>
      {children}
    </section>
  );
}
export function Heading({ title, description, actions, eyebrow }) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}
export function SectionHeading({ title, to, action = 'Xem tất cả' }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {to && (
        <Button to={to} variant="ghost">
          {action}
          <Icon name="arrow-right" />
        </Button>
      )}
    </div>
  );
}
export function Field({ label, help, error, as = 'input', children, className = '', ...props }) {
  const generated = useId();
  const { playFeedback } = useStore();
  const id = props.id || generated;
  const Control = as;
  return (
    <div className={'field ' + className}>
      <label htmlFor={id}>{label}</label>
      <Control
        {...props}
        onInvalid={(event) => {
          if (event.target === event.target.form?.querySelector(':invalid')) playFeedback('danger');
          props.onInvalid?.(event);
        }}
        id={id}
        className={error ? 'invalid' : ''}
        aria-invalid={Boolean(error)}
        aria-describedby={help || error ? id + '-help' : undefined}
      >
        {children}
      </Control>
      <FormError error={error} id={id + '-help'} />
      {!error && help && <small id={id + '-help'}>{help}</small>}
    </div>
  );
}
export function Progress({ value, label, compact = false }) {
  return (
    <div className={'progress ' + (compact ? 'compact' : '')}>
      {!compact && (
        <div>
          <span>{label}</span>
          <strong>{value}%</strong>
        </div>
      )}
      <progress max="100" value={value} aria-label={label || 'Tiến độ'} />
    </div>
  );
}
export function Notice({ children, title, tone = 'primary', icon = 'circle-check' }) {
  return (
    <div className={'notice notice-' + tone}>
      <Icon name={icon} />
      <div>
        {title && <strong>{title}</strong>}
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}
export function Empty({ title = 'Chưa có dữ liệu', description, action, icon = 'book-open' }) {
  return (
    <Card className="empty">
      <span className="empty-symbol">
        <Icon name={icon} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </Card>
  );
}
export function Metric({ label, value, note, className = '' }) {
  return (
    <Card className={'metric ' + className}>
      <p>{label}</p>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </Card>
  );
}
export function Avatar({ name }) {
  return (
    <span className="avatar" aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Modal({ open, title, children, onClose }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) {
          const box = ref.current.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <IconButton name="x" label="Đóng hộp thoại" onClick={onClose} />
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function Choice({ name, value, selected, onChange, letter, children }) {
  return (
    <label className={'choice ' + (selected ? 'selected' : '')}>
      <input type="radio" name={name} value={value} checked={selected} onChange={onChange} />
      {letter && <span className="choice-letter">{letter}</span>}
      <span>{children}</span>
    </label>
  );
}
export function Tabs({ items, value, onChange, label = 'Chọn nội dung' }) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className={value === item.value ? 'active' : ''}
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
export function RouteTabs({ items }) {
  return (
    <nav className="tabs" aria-label="Các phần khóa học">
      {items.map((item) => (
        <NavLink end key={item.to} to={item.to}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function CourseArt({ course, large = false }) {
  return (
    <div className={'course-art art-' + course.color + (large ? ' large' : '')}>
      {large ? (
        <div className="course-art-title">
          <Badge>{course.level}</Badge>
          <h1>{course.title}</h1>
        </div>
      ) : (
        <span>{course.art}</span>
      )}
      <span className="course-symbol">
        <Icon name="book-open" />
      </span>
      {large && <p>Xây nền vững. Tự tin tiến xa.</p>}
    </div>
  );
}
export function CourseCard({ course, enrolled = false }) {
  const { state } = useStore();
  const progress = progressOf(course, state.completed);
  const locked = !canEnroll(course, state.courses, state.completed);
  const next =
    getLessons(course).find((lesson) => !state.completed[course.id]?.includes(lesson.id))?.id || 1;
  return (
    <Card className="course-card">
      <CourseArt course={course} />
      <div className="course-body">
        <div className="split">
          <Badge>{course.level}</Badge>
          <small>
            {course.lessons} bài · {course.hours} giờ
          </small>
        </div>
        <h3>
          <Link to={'/courses/' + course.id}>{course.title}</Link>
        </h3>
        <p>{course.description}</p>
        {enrolled ? (
          <Progress
            value={progress}
            label={(state.completed[course.id]?.length || 0) + ' / ' + course.lessons + ' bài học'}
          />
        ) : (
          <div className={'recommendation ' + (locked ? 'locked' : '')}>
            {locked && <Icon name="lock-keyhole" />}
            <small>{course.reason}</small>
          </div>
        )}
        <Button
          variant={enrolled ? 'primary' : 'secondary'}
          to={enrolled ? '/learn/' + course.id + '/' + next : '/courses/' + course.id}
        >
          {enrolled
            ? progress === 100
              ? 'Ôn tập khóa học'
              : 'Tiếp tục học'
            : locked
              ? 'Xem điều kiện'
              : 'Xem khóa học'}
          <Icon name={locked && !enrolled ? 'lock-keyhole' : 'arrow-right'} />
        </Button>
      </div>
    </Card>
  );
}
export function DataTable({ columns, rows, caption, empty = 'Không có kết quả phù hợp.' }) {
  return (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.key} data-label={column.label}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function BackLink({ to, children = 'Quay lại' }) {
  return (
    <Link className="back-link" to={to}>
      <Icon name="arrow-left" />
      {children}
    </Link>
  );
}
