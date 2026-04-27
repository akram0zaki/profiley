import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from './ui/utils';

interface SimpleDropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  className?: string;
}

export function SimpleDropdown({ trigger, children, align = 'end', className }: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            'absolute top-full mt-2 min-w-[12rem] rounded-md border border-border bg-popover text-popover-foreground shadow-md z-50 py-1',
            align === 'end' ? 'end-0' : 'start-0',
            className
          )}
          style={{
            [align === 'end' ? 'insetInlineEnd' : 'insetInlineStart']: 0,
          }}
        >
          <div onClick={() => setIsOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

export function SimpleDropdownItem({ children, onClick, className, variant = 'default' }: DropdownItemProps) {
  return (
    <div
      className={cn(
        'relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
        variant === 'destructive' && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function SimpleDropdownSeparator() {
  return <div className="my-1 h-px bg-border" />;
}

export function SimpleDropdownLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-2 py-1.5 text-sm font-medium', className)}>{children}</div>;
}
