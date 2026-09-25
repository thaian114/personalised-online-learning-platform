import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createInitialState, roles, sessionFor } from './data';
import { FeedbackToast, playFeedbackSound, silenceFeedbackSound } from './feedback';

const KEY = 'luma-english-demo-v1';
const SOUND_KEY = 'luma-feedback-sound';
const Store = createContext(null);

// TODO(API_STATE): Nạp dữ liệu theo phiên từ BE thay cho seed/localStorage; xem docs/HANDOFF.md.
// Chỉ giữ cache demo này khi chạy demo; lỗi API không được tự chuyển sang dữ liệu mẫu.
function readState() {
  const initial = createInitialState();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || saved.version !== 1) return initial;
    const arrays = [
      'courses',
      'users',
      'enrolled',
      'submissions',
      'reports',
      'discussions',
      'notifications',
      'logs',
    ];
    const objects = [
      'profile',
      'completed',
      'quizResults',
      'quizDrafts',
      'placementDraft',
      'lessonEdits',
      'questionEdits',
    ];
    if (
      arrays.some((key) => !Array.isArray(saved[key])) ||
      objects.some(
        (key) => !saved[key] || typeof saved[key] !== 'object' || Array.isArray(saved[key]),
      )
    )
      return initial;
    if (
      saved.courses.some(
        (c) =>
          !c ||
          typeof c.id !== 'string' ||
          typeof c.title !== 'string' ||
          !Number.isInteger(c.lessons) ||
          c.lessons < 1,
      )
    )
      return initial;
    if (
      Object.values(saved.completed).some(
        (ids) => !Array.isArray(ids) || ids.some((id) => !Number.isInteger(id)),
      )
    )
      return initial;
    if (saved.session && (!roles[saved.session.role] || typeof saved.session.userId !== 'string'))
      return initial;
    return { ...initial, ...saved };
  } catch {
    return initial;
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(readState);
  const [toast, setToast] = useState(null);
  const [storageError, setStorageError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== 'off';
    } catch {
      return true;
    }
  });
  const files = useRef(new Map());
  const playFeedback = useCallback(
    (tone) => {
      if (soundEnabled) void playFeedbackSound(tone);
    },
    [soundEnabled],
  );
  // REUSE(FEEDBACK): notify(message, 'success' | 'danger' | 'primary'); success/danger có âm.
  // Gọi sau kết quả thao tác, ngoài updater/effect để tránh phát âm hoặc thông báo lặp.
  const notify = useCallback(
    (message, tone = 'success') => {
      setToast({ message, tone, id: crypto.randomUUID() });
      playFeedback(tone);
    },
    [playFeedback],
  );
  function toggleSound() {
    const enabled = !soundEnabled;
    setSoundEnabled(enabled);
    if (!enabled) silenceFeedbackSound();
    try {
      localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
    } catch {
      // Keep the preference in memory when storage is unavailable.
    }
  }
  // REUSE(STORE): update() đồng bộ và chỉ merge tầng đầu; object/array lồng nhau cần copy.
  // Await API trong handler trước khi gọi update(); updater phải thuần, không chứa fetch/notify.
  const update = useCallback(
    (change) =>
      setState((previous) => ({
        ...previous,
        ...(typeof change === 'function' ? change(previous) : change),
      })),
    [],
  );

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(
    () => () => {
      for (const file of files.current.values()) URL.revokeObjectURL(file.url);
    },
    [],
  );

  function startDemo(role) {
    const userId = { student: 'minh-anh', instructor: 'linh-tran', admin: 'admin' }[role];
    const user = state.users.find((user) => user.id === userId);
    if (!user?.active) {
      notify('Tài khoản mẫu đang tạm khóa. Hãy mở lại trong trang quản trị.', 'danger');
      return false;
    }
    update((previous) => sessionFor(previous, user));
    return user.role;
  }
  // TODO(API_UPLOADS): Map và blob URL chỉ tồn tại trong phiên, không phải upload lên server.
  // Thay bằng fileId/URL do BE trả về; sửa cả nơi đọc files.current trong Learning/Instructor.
  function keepFile(id, file) {
    const previous = files.current.get(id);
    if (previous) URL.revokeObjectURL(previous.url);
    files.current.set(id, { file, url: URL.createObjectURL(file) });
  }
  function resetDemo() {
    for (const file of files.current.values()) URL.revokeObjectURL(file.url);
    files.current.clear();
    setState(createInitialState());
    notify('Đã khôi phục dữ liệu mẫu.');
  }
  // TODO(API_AUDIT): Đây là nhật ký demo. BE ghi actor/thời gian sau khi kiểm tra và lưu thao tác.
  // Caller quản trị/xuất bản phải chờ API thành công rồi cập nhật state; không tự tạo audit thật.
  function logChange(action, target, extra = {}) {
    update((previous) => ({
      ...extra,
      logs: [
        {
          id: crypto.randomUUID(),
          actor: previous.session?.name || 'Admin',
          action,
          target,
          createdAt: new Date().toISOString(),
        },
        ...previous.logs,
      ],
    }));
  }
  return (
    <Store.Provider
      value={{
        state,
        update,
        notify,
        startDemo,
        keepFile,
        files,
        resetDemo,
        logChange,
        soundEnabled,
        toggleSound,
        playFeedback,
      }}
    >
      {children}
      {storageError && (
        <div className="storage-notice" role="alert">
          Trình duyệt không lưu được thay đổi. Dữ liệu chỉ còn trong phiên này.
        </div>
      )}
      <FeedbackToast toast={toast} onClose={() => setToast(null)} />
    </Store.Provider>
  );
}

export function useStore() {
  return useContext(Store);
}

// REUSE(FEEDBACK): [error, setError] + <FormError error={error} />; setError('') xóa lỗi.
// error là { message, id }, không phải string; mỗi lần báo lỗi tạo animation và âm một lần.
export function useFormError() {
  const [error, setError] = useState(null);
  const { playFeedback } = useStore();
  function reportError(message) {
    setError(message ? { message, id: crypto.randomUUID() } : null);
    if (message) playFeedback('danger');
  }
  return [error, reportError];
}
