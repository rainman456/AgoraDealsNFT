import { toast, ToastOptions, Slide } from 'react-toastify';
import { hapticFeedback } from '@/lib/animations';

const defaultOptions: ToastOptions = {
  position: 'top-center',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  transition: Slide,
  style: {
    borderRadius: '12px',
    fontWeight: 500,
  },
};

export const animatedToast = {
  success: (message: string, options?: ToastOptions) => {
    hapticFeedback('light');
    return toast.success(message, { ...defaultOptions, ...options });
  },
  
  error: (message: string, options?: ToastOptions) => {
    hapticFeedback('heavy');
    return toast.error(message, { ...defaultOptions, ...options });
  },
  
  info: (message: string, options?: ToastOptions) => {
    hapticFeedback('light');
    return toast.info(message, { ...defaultOptions, ...options });
  },
  
  warning: (message: string, options?: ToastOptions) => {
    hapticFeedback('medium');
    return toast.warning(message, { ...defaultOptions, ...options });
  },
};
