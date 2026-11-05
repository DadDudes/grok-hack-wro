export function SceneDefs() {
  return (
    <svg className="svg-defs" aria-hidden="true" focusable="false">
      <defs>
        <symbol id="sparkle" viewBox="0 0 24 24">
          <path
            d="M12 2Q13 10 22 12Q13 14 12 22Q11 14 2 12Q11 10 12 2Z"
            fill="#FFC233"
            stroke="#13283A"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="token" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="17" fill="#FFF0C2" stroke="#13283A" strokeWidth="2.5" />
          <circle cx="20" cy="20" r="9" fill="#FFC233" stroke="#13283A" strokeWidth="2" />
        </symbol>
        <symbol id="gate" viewBox="0 0 24 32">
          <path d="M3 32V12a9 9 0 0 1 18 0V32" fill="none" stroke="#13283A" strokeWidth="7" />
          <path d="M3 32V12a9 9 0 0 1 18 0V32" fill="none" stroke="#FF6FA5" strokeWidth="3" />
        </symbol>
        <symbol id="star-st" viewBox="0 0 52 52">
          <path
            d="M24 3 29.6 16.3 44 17.5 33 26.9 36.3 41 24 33.5 11.7 41 15 26.9 4 17.5 18.4 16.3Z"
            transform="translate(4.5 5.5)"
            fill="#13283A"
            stroke="#13283A"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M24 3 29.6 16.3 44 17.5 33 26.9 36.3 41 24 33.5 11.7 41 15 26.9 4 17.5 18.4 16.3Z"
            transform="translate(1.5 1.5)"
            fill="#FFC233"
            stroke="#13283A"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}
