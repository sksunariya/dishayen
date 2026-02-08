import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiAlertCircle, FiCheckCircle, FiXCircle, FiInfo, FiX 
} from 'react-icons/fi';

const CustomAlert = ({ 
  show, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  actions,
  autoClose = false,
  autoCloseDelay = 5000
}) => {
  React.useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, autoCloseDelay, onClose]);

  const config = {
    success: {
      icon: FiCheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
      titleColor: 'text-green-900 dark:text-green-300',
      textColor: 'text-green-800 dark:text-green-300'
    },
    error: {
      icon: FiXCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-900 dark:text-red-300',
      textColor: 'text-red-800 dark:text-red-300'
    },
    warning: {
      icon: FiAlertCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      titleColor: 'text-yellow-900 dark:text-yellow-300',
      textColor: 'text-yellow-800 dark:text-yellow-300'
    },
    info: {
      icon: FiInfo,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-900 dark:text-blue-300',
      textColor: 'text-blue-800 dark:text-blue-300'
    }
  };

  const alertConfig = config[type] || config.info;
  const Icon = alertConfig.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`${alertConfig.bgColor} ${alertConfig.borderColor} border-2 rounded-xl p-4 shadow-lg mb-4`}
        >
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 ${alertConfig.iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              {title && (
                <h4 className={`font-bold ${alertConfig.titleColor} mb-1`}>
                  {title}
                </h4>
              )}
              <p className={`text-sm ${alertConfig.textColor}`}>
                {message}
              </p>
              {actions && actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={action.onClick}
                      className={action.className || 'px-4 py-2 text-sm font-semibold rounded-lg transition-colors'}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`flex-shrink-0 ${alertConfig.iconColor} hover:opacity-70 transition-opacity`}
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomAlert;

