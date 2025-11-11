import { AnimatePresence, motion } from 'framer-motion'
import Toast from './Toast'
import { staggerChildren } from '../lib/animations/variants'

function ToastContainer({ toasts, removeToast }) {
  return (
    <motion.div
      variants={staggerChildren}
      initial="initial"
      animate="animate"
      style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none'
    }}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <motion.div
            key={toast.id}
            layout
            style={{
              pointerEvents: 'auto'
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

export default ToastContainer
