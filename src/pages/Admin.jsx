import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  Empty,
  Field,
  Heading,
  Metric,
  Modal,
  Notice,
  SectionHeading,
} from '../components';
import { formatDate, normalizeSearch, roles } from '../data';
import { useFormError, useStore } from '../store';
import { CourseStatus } from './Instructor';

// TODO(API_ADMIN): Cả module đang thao tác users/courses/reports/logs trong cache chung của demo.
// Nối danh sách/số liệu và các lệnh đổi vai trò, khóa tài khoản, ẩn khóa; BE kiểm quyền từng lệnh.
export function AdminDashboard() {
  const { state } = useStore();
  const reports = state.reports.filter((r) => r.status === 'pending');
  return (
    <>
      <Heading
        title="Tổng quan nền tảng"
        description="Theo dõi hoạt động và các nội dung cần xử lý."
      />
      <div className="metrics">
        <Metric
          label="Người dùng"
          value={state.users.length}
          note="Học viên, giảng viên và quản trị"
        />
        <Metric
          label="Khóa học công khai"
          value={state.courses.filter((c) => c.status === 'published').length}
          note="Trên nền tảng dùng thử"
        />
        <Metric label="Báo cáo chờ xử lý" value={reports.length} note="Cần kiểm tra nội dung" />
      </div>
      <SectionHeading title="Nội dung cần xem xét" to="/admin/reports" action="Xử lý báo cáo" />
      <DataTable
        rows={reports}
        caption="Báo cáo đang chờ xử lý"
        empty="Các báo cáo đều đã được xử lý."
        columns={[
          { key: 'context', label: 'Nội dung' },
          { key: 'title', label: 'Lý do báo cáo' },
          { key: 'createdAt', label: 'Thời gian', render: (row) => formatDate(row.createdAt) },
          {
            key: 'status',
            label: 'Trạng thái',
            render: () => <Badge tone="warning">Chờ xử lý</Badge>,
          },
        ]}
      />
      <SectionHeading title="Hoạt động gần đây" to="/admin/logs" />
      <div className="activity-list">
        {state.logs.slice(0, 4).map((log) => (
          <Card key={log.id}>
            <div className="split">
              <strong>{log.action}</strong>
              <small>{formatDate(log.createdAt)}</small>
            </div>
            <p>
              {log.actor} · {log.target}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}

export function AdminUsers() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const rows = state.users.filter(
    (user) =>
      normalizeSearch(user.name + ' ' + user.email).includes(normalizeSearch(query)) &&
      (!role || user.role === role) &&
      (!status || user.active === (status === 'active')),
  );
  return (
    <>
      <Heading
        title="Quản lý người dùng"
        description="Xem tài khoản, vai trò và trạng thái truy cập."
      />
      <div className="filter-grid">
        <Field
          label="Tìm kiếm"
          type="search"
          placeholder="Tên hoặc email"
          value={query}
          onChange={(event) =>
            setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })
          }
        />
        <Field
          label="Vai trò"
          as="select"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="">Tất cả</option>
          {Object.entries(roles).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Field>
        <Field
          label="Trạng thái"
          as="select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="active">Đang hoạt động</option>
          <option value="locked">Tạm khóa</option>
        </Field>
      </div>
      <DataTable
        rows={rows}
        caption="Danh sách người dùng"
        columns={[
          {
            key: 'name',
            label: 'Người dùng',
            render: (row) => (
              <div className="table-person">
                <Avatar name={row.name} />
                <strong>{row.name}</strong>
              </div>
            ),
          },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Vai trò', render: (row) => roles[row.role] },
          {
            key: 'active',
            label: 'Trạng thái',
            render: (row) => (
              <Badge tone={row.active ? 'success' : 'neutral'}>
                {row.active ? 'Hoạt động' : 'Tạm khóa'}
              </Badge>
            ),
          },
          {
            key: 'action',
            label: 'Thao tác',
            render: (row) => (
              <Button variant="ghost" onClick={() => setSelected(row)}>
                Quản lý
              </Button>
            ),
          },
        ]}
      />
      <Modal open={Boolean(selected)} title="Quản lý tài khoản" onClose={() => setSelected(null)}>
        {selected && (
          <UserForm key={selected.id} user={selected} onDone={() => setSelected(null)} />
        )}
      </Modal>
    </>
  );
}
function UserForm({ user, onDone }) {
  const { state, notify, logChange } = useStore();
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.active);
  const self = user.id === state.session.userId;
  function save(event) {
    event.preventDefault();
    const users = state.users.map((item) =>
      item.id === user.id ? { ...item, role, active } : item,
    );
    if (!users.some((item) => item.role === 'admin' && item.active))
      return notify('Cần giữ ít nhất một quản trị viên hoạt động.', 'danger');
    logChange(
      'Cập nhật tài khoản',
      user.name + ' · ' + roles[role] + ' · ' + (active ? 'Hoạt động' : 'Tạm khóa'),
      { users },
    );
    notify('Đã cập nhật tài khoản.');
    onDone();
  }
  return (
    <form className="stack" onSubmit={save}>
      <div className="profile-identity">
        <Avatar name={user.name} />
        <div>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      </div>
      <Field
        label="Vai trò"
        as="select"
        value={role}
        disabled={self}
        onChange={(event) => setRole(event.target.value)}
      >
        {Object.entries(roles).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Field>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={active}
          disabled={self}
          onChange={(event) => setActive(event.target.checked)}
        />
        Cho phép tài khoản hoạt động
      </label>
      {self && (
        <Notice tone="primary">
          Tài khoản đang đăng nhập giữ vai trò và quyền truy cập hiện tại.
        </Notice>
      )}
      <Button type="submit" disabled={self || (role === user.role && active === user.active)}>
        Lưu thay đổi
      </Button>
    </form>
  );
}

export function AdminCourses() {
  const { state, logChange, notify } = useStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const rows = state.courses.filter(
    (course) =>
      normalizeSearch(course.title + ' ' + course.teacher).includes(normalizeSearch(query)) &&
      (!status || course.status === status),
  );
  function toggle() {
    const next = selected.status === 'published' ? 'hidden' : 'published';
    logChange(next === 'hidden' ? 'Ẩn khóa học' : 'Hiển thị khóa học', selected.title, {
      courses: state.courses.map((c) => (c.id === selected.id ? { ...c, status: next } : c)),
    });
    setSelected(null);
    notify(
      next === 'hidden' ? 'Đã ẩn khóa học khỏi danh sách học viên.' : 'Đã hiển thị lại khóa học.',
    );
  }
  return (
    <>
      <Heading
        title="Quản lý khóa học"
        description="Kiểm tra thông tin và trạng thái hiển thị của khóa học."
      />
      <div className="catalog-filters">
        <Field
          label="Tìm kiếm"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tên khóa học hoặc giảng viên"
        />
        <Field
          label="Trạng thái"
          as="select"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="published">Công khai</option>
          <option value="draft">Bản nháp</option>
          <option value="hidden">Đã ẩn</option>
        </Field>
      </div>
      <DataTable
        rows={rows}
        caption="Quản lý khóa học trên nền tảng"
        columns={[
          { key: 'title', label: 'Khóa học', render: (row) => <strong>{row.title}</strong> },
          { key: 'teacher', label: 'Giảng viên' },
          { key: 'learners', label: 'Học viên' },
          {
            key: 'status',
            label: 'Trạng thái',
            render: (row) => <CourseStatus status={row.status} />,
          },
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
        title={selected?.title || 'Chi tiết khóa học'}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <CourseStatus status={selected.status} />
            <p>{selected.description}</p>
            <p>
              Giảng viên: {selected.teacher}
              <br />
              {selected.lessons} bài học · {selected.hours} giờ
            </p>
            <Notice tone={selected.status === 'published' ? 'warning' : 'primary'}>
              {selected.status === 'published'
                ? 'Ẩn khóa học sẽ ngừng hiển thị nội dung này với học viên. Tiến độ đã học được giữ lại.'
                : selected.status === 'draft'
                  ? 'Giảng viên cần hoàn thiện và xuất bản bản nháp này.'
                  : 'Hiển thị lại để học viên tiếp tục truy cập khóa học.'}
            </Notice>
            {selected.status !== 'draft' && (
              <Button
                variant={selected.status === 'published' ? 'danger' : 'primary'}
                onClick={toggle}
              >
                {selected.status === 'published' ? 'Xác nhận ẩn khóa học' : 'Hiển thị lại khóa học'}
              </Button>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

export function AdminReports() {
  const { state } = useStore();
  const [status, setStatus] = useState('pending');
  const [selectedId, setSelectedId] = useState(null);
  const reports = state.reports.filter((report) => !status || report.status === status);
  const selected = reports.find((r) => r.id === selectedId) || reports[0];
  return (
    <>
      <Heading title="Báo cáo nội dung" description="Xem ngữ cảnh trước khi xử lý báo cáo." />
      <Field
        label="Trạng thái báo cáo"
        as="select"
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          setSelectedId(null);
        }}
      >
        <option value="pending">Chờ xử lý</option>
        <option value="resolved">Đã xử lý</option>
        <option value="dismissed">Đã bỏ qua</option>
        <option value="">Tất cả báo cáo</option>
      </Field>
      {reports.length ? (
        <div className="report-layout">
          <div className="report-list">
            {reports.map((report) => (
              <button
                key={report.id}
                className={selected?.id === report.id ? 'selected' : ''}
                onClick={() => setSelectedId(report.id)}
              >
                <strong>{report.title}</strong>
                <small>
                  {report.id} · {formatDate(report.createdAt)}
                </small>
                <Badge tone={report.status === 'pending' ? 'warning' : 'success'}>
                  {report.status === 'pending'
                    ? 'Chờ xử lý'
                    : report.status === 'resolved'
                      ? 'Đã xử lý'
                      : 'Đã bỏ qua'}
                </Badge>
              </button>
            ))}
          </div>
          {selected && <ReportDetail key={selected.id} report={selected} />}
        </div>
      ) : (
        <Empty
          title="Không có báo cáo trong mục này"
          description="Các báo cáo mới sẽ xuất hiện ở đây."
          icon="shield-check"
        />
      )}
    </>
  );
}
// TODO(API_ADMIN): BE lưu quyết định + ẩn nội dung + audit cùng thao tác; FE hiển thị kết quả trả về.
function ReportDetail({ report }) {
  const { state, logChange, notify } = useStore();
  const [note, setNote] = useState(report.note);
  const [error, setError] = useFormError();
  function resolve(status) {
    if (!note.trim()) return setError('Nhập ghi chú để lưu lý do xử lý.');
    setError('');
    logChange(status === 'resolved' ? 'Xử lý báo cáo' : 'Bỏ qua báo cáo', report.id, {
      reports: state.reports.map((r) =>
        r.id === report.id ? { ...r, status, note: note.trim() } : r,
      ),
      discussions: state.discussions.map((item) =>
        status === 'resolved' && report.postId === item.id ? { ...item, hidden: true } : item,
      ),
    });
    notify(
      status === 'resolved'
        ? 'Đã xử lý báo cáo và ẩn bình luận liên quan (nếu có).'
        : 'Đã lưu quyết định bỏ qua báo cáo.',
    );
  }
  return (
    <Card>
      <h2>{report.context}</h2>
      <p>
        Người báo cáo: {report.reporter}
        <br />
        Thời điểm: {formatDate(report.createdAt)}
        <br />
        Lý do: {report.title}
      </p>
      <div className="subtle-panel">
        <h3>Nội dung bị báo cáo</h3>
        <blockquote>{report.content}</blockquote>
      </div>
      <Field
        as="textarea"
        label="Ghi chú xử lý"
        rows="4"
        value={note}
        maxLength="1000"
        disabled={report.status !== 'pending'}
        onChange={(event) => setNote(event.target.value)}
        error={error}
      />
      {report.status === 'pending' ? (
        <div className="actions">
          <Button variant="danger" onClick={() => resolve('resolved')}>
            {report.postId || report.title.includes('Quảng cáo')
              ? 'Ẩn nội dung và xử lý'
              : 'Đánh dấu đã xử lý'}
          </Button>
          <Button variant="secondary" onClick={() => resolve('dismissed')}>
            Bỏ qua báo cáo
          </Button>
        </div>
      ) : (
        <Notice tone="success" title="Báo cáo đã được xem xét">
          Thao tác được ghi trong Nhật ký hoạt động.
        </Notice>
      )}
    </Card>
  );
}

export function AuditLog() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const logs = state.logs.filter(
    (log) =>
      normalizeSearch(log.actor + ' ' + log.action + ' ' + log.target).includes(
        normalizeSearch(query),
      ) &&
      (!date || new Date(log.createdAt).toLocaleDateString('en-CA') === date),
  );
  return (
    <>
      <Heading
        title="Nhật ký hoạt động"
        description="Tra cứu các thao tác quản trị và thay đổi quan trọng."
      />
      <div className="catalog-filters">
        <Field
          label="Tìm kiếm thao tác"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Người thực hiện, thao tác hoặc đối tượng"
        />
        <Field
          label="Ngày thực hiện"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        {(query || date) && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery('');
              setDate('');
            }}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>
      <DataTable
        rows={logs}
        caption="Nhật ký hoạt động"
        columns={[
          { key: 'createdAt', label: 'Thời gian', render: (row) => formatDate(row.createdAt) },
          { key: 'actor', label: 'Người thực hiện' },
          { key: 'action', label: 'Thao tác' },
          { key: 'target', label: 'Đối tượng' },
          {
            key: 'result',
            label: 'Kết quả',
            render: () => <Badge tone="success">Thành công</Badge>,
          },
        ]}
      />
    </>
  );
}
