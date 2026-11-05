import type { GameTemplate } from '@/lib/flow/types';

const ROBO_HEAD = '/brand/agents/robo-head.svg';

function Dots() {
  return (
    <>
      <circle cx="14" cy="12" r="1.6" fill="#FFFFFF" />
      <circle cx="60" cy="10" r="1.4" fill="#FFFFFF" />
      <circle cx="150" cy="30" r="1.6" fill="#FFFFFF" />
      <circle cx="70" cy="88" r="1.4" fill="#FFFFFF" />
      <circle cx="122" cy="88" r="1.4" fill="#FFFFFF" />
    </>
  );
}

function CollectArt() {
  return (
    <>
      <circle cx="116" cy="50" r="17" fill="none" stroke="#FFC233" strokeWidth="3" strokeDasharray="4 4" />
      <use href="#token" x="84" y="8" width="24" height="24" />
      <use href="#token" x="104" y="38" width="24" height="24" />
      <use href="#token" x="96" y="68" width="22" height="22" />
      <use href="#token" x="132" y="64" width="22" height="22" />
      <use href="#sparkle" x="138" y="10" width="14" height="14" />
      <image href={ROBO_HEAD} x="10" y="28" width="62" height="56" />
    </>
  );
}

function RunnerArt() {
  return (
    <>
      <path d="M0 78Q80 66 160 78V96H0Z" fill="#C9CED6" stroke="#13283A" strokeWidth="2.5" />
      <use href="#gate" x="86" y="46" width="22" height="30" />
      <use href="#gate" x="118" y="48" width="22" height="30" />
      <use href="#sparkle" x="104" y="12" width="16" height="16" />
      <use href="#sparkle" x="140" y="22" width="10" height="10" />
      <image href={ROBO_HEAD} x="16" y="24" width="56" height="50" />
    </>
  );
}

function QuizBattleArt() {
  return (
    <>
      <use href="#sparkle" x="110" y="10" width="22" height="22" />
      <use href="#sparkle" x="138" y="34" width="12" height="12" />
      <image href={ROBO_HEAD} x="18" y="8" width="56" height="50" />
      <rect x="30" y="64" width="40" height="22" rx="7" fill="#FFFFFF" stroke="#13283A" strokeWidth="2.5" />
      <rect x="90" y="64" width="40" height="22" rx="7" fill="#FFC233" stroke="#13283A" strokeWidth="2.5" />
      <text x="50" y="80" textAnchor="middle" fontSize="14" fill="#13283A">
        ?
      </text>
      <text x="110" y="80" textAnchor="middle" fontSize="14" fill="#13283A">
        ?
      </text>
    </>
  );
}

const ART: Record<GameTemplate, () => React.JSX.Element> = {
  collect: CollectArt,
  runner: RunnerArt,
  quiz_battle: QuizBattleArt,
};

export function GamePreview({ template }: { template: GameTemplate }) {
  const Art = ART[template] ?? CollectArt;

  return (
    <svg viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <Dots />
      <Art />
    </svg>
  );
}

function NeutralScene() {
  return (
    <>
      <circle cx="30" cy="34" r="2.4" fill="#FFFFFF" />
      <circle cx="210" cy="166" r="2" fill="#FFFFFF" />
      <circle cx="312" cy="34" r="2.4" fill="#FFFFFF" />
      <circle cx="470" cy="36" r="2" fill="#FFFFFF" />
      <circle cx="600" cy="166" r="2.4" fill="#FFFFFF" />
      <circle cx="700" cy="34" r="2" fill="#FFFFFF" />
      <circle cx="860" cy="100" r="2.4" fill="#FFFFFF" />
      <image href={ROBO_HEAD} x="50" y="40" width="160" height="140" />
      <use href="#sparkle" x="250" y="40" width="44" height="44" />
      <use href="#token" x="330" y="50" width="52" height="52" />
      <use href="#token" x="430" y="112" width="52" height="52" />
      <use href="#token" x="530" y="46" width="52" height="52" />
      <use href="#token" x="640" y="108" width="52" height="52" />
      <use href="#gate" x="740" y="70" width="60" height="80" />
      <use href="#sparkle" x="820" y="30" width="34" height="34" />
    </>
  );
}

type PaintingSceneProps = {
  imageUrl: string | null;
  done: boolean;
};

export function PaintingScene({ imageUrl, done }: PaintingSceneProps) {
  const revealClass = done ? 'reveal full' : 'reveal';
  const picture =
    imageUrl === null ? (
      <NeutralScene />
    ) : (
      <image href={imageUrl} width="900" height="200" preserveAspectRatio="xMidYMid slice" />
    );

  return (
    <svg viewBox="0 0 900 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="reveal-clip-wide">
          <rect className={revealClass} width="900" height="200" />
        </clipPath>
      </defs>
      <g className="ghost">{picture}</g>
      <g clipPath="url(#reveal-clip-wide)">{picture}</g>
      {!done && (
        <g className="brush brush-wide">
          <g transform="translate(0 40) rotate(-30 0 80)">
            <rect x="-5" y="18" width="10" height="50" rx="3" fill="#FF6FA5" stroke="#13283A" strokeWidth="2.5" />
            <rect x="-7" y="64" width="14" height="11" rx="2" fill="#C9CED6" stroke="#13283A" strokeWidth="2.5" />
            <path
              d="M-7 75Q0 98 7 75Z"
              fill="#2ED3A0"
              stroke="#13283A"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>
        </g>
      )}
    </svg>
  );
}
