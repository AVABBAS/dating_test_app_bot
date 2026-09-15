import React from 'react';
import { X, Check } from 'lucide-react';

/**
 * Reusable Button Component
 * 
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg' | 'icon'
 * @param {boolean} loading - Show loading state
 * @param {boolean} disabled - Disable button
 * @param {string} children - Button content
 * @param {function} onClick - Click handler
 * @param {string} ariaLabel - Accessibility label
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  className = '',
  ariaLabel,
  ...props
}) => {
  const baseClasses = `btn btn-${variant} btn-${size}`;
  const loadingClass = loading ? 'btn-loading' : '';
  const disabledClass = disabled || loading ? 'btn-disabled' : '';
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${loadingClass} ${disabledClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg className="spinner-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </span>
      )}
      <span className="btn-content" style={{ opacity: loading ? 0 : 1 }}>
        {children}
      </span>
    </button>
  );
};

/**
 * Icon Button Component
 * 
 * @param {ReactNode} icon - Icon component
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'danger'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} disabled - Disable button
 * @param {string} ariaLabel - Accessibility label (required for icon buttons)
 * @param {function} onClick - Click handler
 */
export const IconButton = ({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  ariaLabel,
  title,
  ...props
}) => {
  if (!ariaLabel && !title) {
    console.warn('IconButton should have either ariaLabel or title for accessibility');
  }

  return (
    <button
      type="button"
      className={`icon-btn icon-btn-${variant} icon-btn-${size} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || title}
      title={title || ariaLabel}
      {...props}
    >
      <Icon size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />
    </button>
  );
};

/**
 * Loading Skeleton Component
 * 
 * @param {string} shape - 'rect' | 'circle' | 'text'
 * @param {string} width - Width of skeleton
 * @param {string} height - Height of skeleton
 * @param {string} className - Additional CSS classes
 */
export const Skeleton = ({
  shape = 'rect',
  width = '100%',
  height = '20px',
  className = '',
  borderRadius = '8px',
}) => {
  const shapeClass = shape === 'circle' ? 'skeleton-circle' : shape === 'text' ? 'skeleton-text' : 'skeleton-rect';
  
  return (
    <div
      className={`skeleton ${shapeClass} ${className}`.trim()}
      style={{ width, height, borderRadius: shape === 'circle' ? '50%' : borderRadius }}
      aria-hidden="true"
    />
  );
};

/**
 * Card Component
 * 
 * @param {ReactNode} children - Card content
 * @param {boolean} clickable - Make card clickable
 * @param {function} onClick - Click handler
 * @param {string} className - Additional CSS classes
 */
export const Card = ({
  children,
  clickable = false,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`card ${clickable ? 'card-clickable' : ''} ${className}`.trim()}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Badge Component
 * 
 * @param {string} variant - 'default' | 'success' | 'warning' | 'error' | 'premium'
 * @param {string} size - 'sm' | 'md'
 * @param {ReactNode} children - Badge content
 * @param {string} className - Additional CSS classes
 */
export const Badge = ({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`badge badge-${variant} badge-${size} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * Toast Notification Component
 * 
 * @param {string} message - Toast message
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 * @param {function} onClose - Close handler
 * @param {number} duration - Auto-close duration in ms
 */
export const Toast = ({
  message,
  type = 'info',
  onClose,
  duration = 3000,
}) => {
  React.useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <Check size={18} />,
    error: <X size={18} />,
    info: null,
    warning: null,
  };

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      {icons[type]}
      <span>{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose} aria-label="بستن اعلان">
          <X size={16} />
        </button>
      )}
    </div>
  );
};

/**
 * Empty State Component
 * 
 * @param {ReactNode} icon - Icon/emoji to display
 * @param {string} title - Main heading
 * @param {string} description - Subtitle/description
 * @param {ReactNode} action - Action button/component
 */
export const EmptyState = ({
  icon = '📭',
  title = 'چیزی یافت نشد',
  description = '',
  action = null,
}) => {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

/**
 * Error State Component
 * 
 * @param {string} title - Error title
 * @param {string} message - Error description
 * @param {function} onRetry - Retry handler
 * @param {boolean} showRetry - Show retry button
 */
export const ErrorState = ({
  title = 'خطا در بارگذاری',
  message = 'لطفاً دوباره تلاش کنید',
  onRetry = null,
  showRetry = true,
}) => {
  return (
    <div className="error-state" role="alert">
      <div className="error-state-icon" aria-hidden="true">⚠️</div>
      <h3 className="error-state-title">{title}</h3>
      {message && <p className="error-state-message">{message}</p>}
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="primary">
          تلاش مجدد
        </Button>
      )}
    </div>
  );
};

export default {
  Button,
  IconButton,
  Skeleton,
  Card,
  Badge,
  Toast,
  EmptyState,
  ErrorState,
};
