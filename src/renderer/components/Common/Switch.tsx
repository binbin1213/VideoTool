// Mac 风格开关组件
// 统一的开关组件，适用于所有页面

import { ChangeEvent } from 'react';
import styles from '../../styles/components/Switch.module.scss';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  color?: 'default' | 'success' | 'warning' | 'danger';
  id?: string;
}

export const Switch = ({
  checked,
  onChange,
  disabled = false,
  label,
  size = 'medium',
  color = 'default',
  id,
}: SwitchProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  // 组合样式类
  const containerClasses = [
    styles.switchContainer,
    size === 'small' && styles.switchSmall,
    size === 'large' && styles.switchLarge,
    color === 'success' && styles.switchSuccess,
    color === 'warning' && styles.switchWarning,
    color === 'danger' && styles.switchDanger,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label htmlFor={switchId} className={containerClasses}>
      <input
        type="checkbox"
        id={switchId}
        className={styles.switchInput}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <span className={styles.switchTrack}>
        <span className={styles.switchThumb} />
      </span>
      {label && <span className={styles.switchLabel}>{label}</span>}
    </label>
  );
};

export default Switch;

