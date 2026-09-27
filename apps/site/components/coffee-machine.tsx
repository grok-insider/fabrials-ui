/** Original vector illustration, shared between the live demo and film. */
export function CoffeeMachine({
  color = "#e5e2d6",
  className = "",
  style,
}: {
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 300 210"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <ellipse
        cx="151"
        cy="192"
        rx="105"
        ry="9"
        fill="currentColor"
        opacity=".07"
      />
      <path
        d="M73 39Q73 28 86 28H218Q229 28 229 41V173H73V39Z"
        fill={color}
        stroke="#596158"
        strokeWidth="2"
      />
      <path d="M82 28V17H220V28" stroke="#7d867a" strokeWidth="3" />
      <path
        d="M87 21H213M89 13V23M107 13V23M125 13V23M143 13V23M161 13V23M179 13V23M197 13V23M215 13V23"
        stroke="#a2aa9c"
        strokeWidth="2"
      />
      <path d="M73 84H229V174H73Z" fill="#242b26" />
      <rect x="88" y="45" width="63" height="23" rx="5" fill="#29342b" />
      <path d="M99 57H139" stroke="#d8edb9" strokeWidth="2" />
      <circle
        cx="181"
        cy="57"
        r="15"
        fill="#f4f4eb"
        stroke="#727b70"
        strokeWidth="3"
      />
      <path d="M181 57L187 49" stroke="#414a3b" strokeWidth="2" />
      <circle cx="213" cy="57" r="5" fill="#a5bd89" />
      <path d="M115 86V102H154V86" fill="#a0a79c" />
      <path d="M135 102V109" stroke="#b8c1b2" strokeWidth="7" />
      <path
        d="M152 100H189"
        stroke="#151c17"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M211 88V128L220 146"
        stroke="#bec6b7"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M115 140H154L150 164H121L115 140Z" fill="#f5f3e5" />
      <path d="M154 144H160Q170 154 152 159" stroke="#f5f3e5" strokeWidth="4" />
      <path d="M80 174H223V183H80Z" fill="#b5bbae" />
      <path
        d="M90 177H212"
        stroke="#687360"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <path d="M88 183V190M214 183V190" stroke="#333c32" strokeWidth="7" />
    </svg>
  );
}
