import type { KidProfile } from '@/lib/flow/types';
import { initialOf, kidColorClass } from './format';

type KidAvatarProps = {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

export function KidAvatar({ name, color = '', size = 'md' }: KidAvatarProps) {
  const classes = ['kav', kidColorClass(color)];

  if (size !== 'md') {
    classes.push(size);
  }

  const className = classes.filter((item) => item !== '').join(' ');

  return (
    <span className={className} aria-hidden="true">
      {initialOf(name)}
    </span>
  );
}

export function kidColor(kid: KidProfile | null): string {
  if (kid === null) {
    return '';
  }

  return kid.color;
}
