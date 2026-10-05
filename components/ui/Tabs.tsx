'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { cva } from 'class-variance-authority';

const tabListVariants = cva(
  'relative flex bg-neu-bg/50 rounded-xl p-1 border border-white/10',
  {
    variants: {
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      fullWidth: false,
    },
  }
);

const tabTriggerVariants = cva(
  'relative z-10 flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neu-bg',
  {
    variants: {
      variant: {
        default: 'text-white/70 hover:text-white data-[state=active]:text-white',
        soft: 'text-white/70 hover:text-white data-[state=active]:text-white data-[state=active]:neu-btn-primary',
        underline: 'bg-transparent text-white/70 hover:text-white data-[state=active]:text-accent-2',
      },
    },
    defaultVariants: {
      variant: 'soft',
    },
  }
);

interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  variant?: 'default' | 'soft' | 'underline';
  fullWidth?: boolean;
  className?: string;
  children: (value: string) => ReactNode;
}

export function Tabs({
  items,
  defaultValue,
  value: controlledValue,
  onChange,
  variant = 'soft',
  fullWidth = false,
  className = '',
  children,
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || items[0]?.value || '');
  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : uncontrolledValue;

  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  const updateIndicator = () => {
    if (!tabsRef.current || !indicatorRef.current) return;
    const activeTab = tabsRef.current.querySelector('[data-state="active"]') as HTMLElement;
    if (activeTab) {
      const { offsetLeft, offsetWidth } = activeTab;
      setIndicatorStyle({
        transform: `translateX(${offsetLeft}px)`,
        width: `${offsetWidth}px`,
      });
    }
  };

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeValue, items.length]);

  const handleTabClick = (itemValue: string) => {
    if (!isControlled) setUncontrolledValue(itemValue);
    onChange?.(itemValue);
  };

  return (
    <div className={className}>
      <div
        ref={tabsRef}
        className={tabListVariants({ fullWidth })}
        role="tablist"
        aria-orientation="horizontal"
      >
        <div
          ref={indicatorRef}
          className="absolute top-1 bottom-1 neu-btn-primary rounded-lg pointer-events-none transition-transform duration-200 ease-out"
          style={indicatorStyle}
        />

        {items.map((item) => (
          <button
            key={item.value}
            role="tab"
            aria-selected={activeValue === item.value}
            aria-controls={`panel-${item.value}`}
            id={`tab-${item.value}`}
            data-state={activeValue === item.value ? 'active' : 'inactive'}
            disabled={item.disabled}
            className={tabTriggerVariants({ variant })}
            onClick={() => !item.disabled && handleTabClick(item.value)}
          >
            {item.icon && <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${activeValue}`} aria-labelledby={`tab-${activeValue}`}>
        {children(activeValue)}
      </div>
    </div>
  );
}

export { tabListVariants, tabTriggerVariants };
export type { TabsProps, TabItem };