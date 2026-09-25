import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

let audioContext;
let activeOutput;
let cueVersion = 0;

export function silenceFeedbackSound() {
  cueVersion += 1;
  activeOutput?.disconnect();
  activeOutput = null;
}

// REUSE(FEEDBACK): Dùng notify/useFormError của Store để tôn trọng nút tắt âm.
// Đổi cao độ/âm lượng tại notes và envelope bên dưới; chỉ phát từ action handler.
export async function playFeedbackSound(tone) {
  if (tone !== 'success' && tone !== 'danger') return;
  silenceFeedbackSound();
  const version = cueVersion;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audioContext ||= new Audio();
    if (audioContext.state === 'suspended') await audioContext.resume();
    if (version !== cueVersion || audioContext.state !== 'running') return;
    const output = audioContext.createGain();
    output.connect(audioContext.destination);
    activeOutput = output;
    const notes = tone === 'success' ? [659.25, 880] : [330, 261.63];
    const start = audioContext.currentTime;
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const envelope = audioContext.createGain();
      const at = start + index * 0.11;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(0.07, at + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
      oscillator.connect(envelope);
      envelope.connect(output);
      oscillator.start(at);
      oscillator.stop(at + 0.2);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
        if (index === notes.length - 1) {
          output.disconnect();
          if (activeOutput === output) activeOutput = null;
        }
      };
    });
  } catch {
    // Audio can be blocked by the browser; visual feedback still works.
  }
}

function FeedbackSymbol({ tone }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className={'feedback-symbol ' + tone}
      aria-hidden="true"
      initial={reduced ? false : { scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d={
            tone === 'danger'
              ? 'M7 7l10 10M17 7 7 17'
              : tone === 'success'
                ? 'm5 12 4 4L19 6'
                : 'M12 11v6M12 7v.01'
          }
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        />
      </svg>
    </motion.span>
  );
}

export function FeedbackToast({ toast, onClose }) {
  const reduced = useReducedMotion();
  return (
    <div className="toast-region">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            className={'toast ' + toast.tone}
            role={toast.tone === 'danger' ? 'alert' : 'status'}
            aria-atomic="true"
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : 6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <FeedbackSymbol tone={toast.tone} />
            <div className="toast-copy">
              <strong>
                {toast.tone === 'danger'
                  ? 'Có lỗi xảy ra'
                  : toast.tone === 'success'
                    ? 'Thành công'
                    : 'Thông báo'}
              </strong>
              <span>{toast.message}</span>
            </div>
            <motion.button
              type="button"
              aria-label="Đóng thông báo"
              onClick={onClose}
              whileTap={reduced ? undefined : { scale: 0.92 }}
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FormError({ error, id }) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.p
          key={error.id || error}
          id={id}
          role="alert"
          className="form-error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: reduced ? 0 : [0, -3, 3, -2, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
        >
          <FeedbackSymbol tone="danger" />
          <span>{error.message || error}</span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}
