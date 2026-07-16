import { useScrollReveal } from '../../hooks/useScrollReveal';
import { cn } from '../../utils/cn';

export function ScrollReveal({ children, className }) {
  const { ref, visible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={cn('evenly-reveal', visible && 'visible', className)}
    >
      {children}
    </div>
  );
}
