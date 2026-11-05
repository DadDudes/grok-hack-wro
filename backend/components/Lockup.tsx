import Link from 'next/link';

type LockupProps = {
  href: string;
  tone: 'on-teal' | 'on-light';
  size?: 'sm' | 'md' | 'lg';
};

export function Lockup({ href, tone, size = 'md' }: LockupProps) {
  const className = size === 'md' ? 'lockup' : `lockup ${size}`;
  const wordmarkClass = tone === 'on-light' ? 'wordmark on-light' : 'wordmark';

  return (
    <Link className={className} href={href} aria-label="EduBotGames home">
      <img src="/brand/padbot-mark.svg" alt="" width={56} height={56} />
      <span className={wordmarkClass}>
        EduBot<span>Games</span>
      </span>
    </Link>
  );
}
