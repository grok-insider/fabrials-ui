import type { CoffeeProduct } from "@/lib/coffee-demo";

// Every figure uses the same scale, so a 41 cm machine is visibly wider than
// an 18 cm one. The box is 46 cm wide and 46 cm tall.
const K = 3;
const SIZE = 46 * K;
const FLOOR = SIZE - 6;
const CX = SIZE / 2;

const line = { stroke: "color-mix(in oklab, currentColor 55%, transparent)", strokeWidth: 1 };
const recess = "#1f2429";
const metal = "#9aa1a8";
const cup = "#f1efe8";

function Group({ x, top, handle }: { x: number; top: number; handle: -1 | 1 }) {
  return (
    <g>
      <path d={`M${x - 7} ${top}H${x + 7}L${x + 5} ${top + 7}H${x - 5}Z`} fill={metal} />
      <path d={`M${x} ${top + 5}L${x + handle * 17} ${top + 9}`} stroke="#2a2f35" strokeWidth={3.5} strokeLinecap="round" />
      <path d={`M${x - 5} ${top + 22}H${x + 5}L${x + 4} ${top + 32}H${x - 4}Z`} fill={cup} />
    </g>
  );
}

function Wand({ x, top, side }: { x: number; top: number; side: -1 | 1 }) {
  return <path d={`M${x} ${top}V${top + 16}L${x + side * 5} ${top + 30}`} stroke={metal} strokeWidth={2.5} strokeLinecap="round" fill="none" />;
}

/**
 * A fictional machine drawn to scale. With `counter`, the counter is drawn
 * under it: dashed edges show its width and any part of the machine beyond
 * them is marked, so "too wide" can be seen, not just read.
 */
export function MachineFigure({
  product,
  counter,
  className,
}: {
  product: Pick<CoffeeProduct, "width" | "height" | "shape" | "steam" | "color">;
  counter?: number;
  className?: string;
}) {
  const w = product.width * K;
  const h = product.height * K;
  const x0 = CX - w / 2;
  const x1 = CX + w / 2;
  const top = FLOOR - h;
  const cw = counter ? Math.min(counter, 46) * K : 0;
  const c0 = CX - cw / 2;
  const c1 = CX + cw / 2;

  let body;
  if (product.shape === "lever") {
    // A column on a wide base, with the lever raised above the group.
    const cw2 = w * 0.46;
    const colTop = top + 18;
    body = (
      <g>
        <path d={`M${CX + 2} ${colTop + 10}L${CX + w * 0.42} ${top}`} stroke="#2a2f35" strokeWidth={4} strokeLinecap="round" />
        <circle cx={CX + w * 0.42} cy={top} r={3.5} fill="#2a2f35" />
        <rect x={CX - cw2 / 2} y={colTop} width={cw2} height={FLOOR - 10 - colTop} rx={2} fill={product.color} {...line} />
        <Group x={CX} top={colTop + 30} handle={-1} />
        <rect x={x0} y={FLOOR - 10} width={w} height={7} rx={2} fill={product.color} {...line} />
      </g>
    );
  } else {
    const panel = top + h * 0.34;
    const trayTop = FLOOR - 11;
    const groups = product.shape === "twin" ? [x0 + w * 0.3, x0 + w * 0.7] : [CX - w * 0.06];
    const gauges = product.shape === "twin" ? 3 : product.steam === "independent" ? 2 : 1;
    body = (
      <g>
        <path d={`M${x0 + 4} ${top}V${top - 5}H${x1 - 4}V${top}`} stroke={metal} strokeWidth={1.5} fill="none" />
        <rect x={x0} y={top} width={w} height={FLOOR - 3 - top} rx={3} fill={product.color} {...line} />
        {Array.from({ length: gauges }, (_, i) => (
          <circle
            key={i}
            cx={x0 + (w * (i + 1)) / (gauges + 1)}
            cy={top + h * 0.17}
            r={Math.min(7, w / 12)}
            fill={cup}
            stroke="#5b636b"
            strokeWidth={1.5}
          />
        ))}
        <rect x={x0 + 4} y={panel} width={w - 8} height={trayTop - panel} rx={1.5} fill={recess} />
        {groups.map((x, i) => (
          <Group key={i} x={x} top={panel} handle={i === 0 && groups.length > 1 ? -1 : 1} />
        ))}
        {product.steam !== "none" && <Wand x={x1 - 9} top={panel} side={-1} />}
        {product.shape === "twin" && <Wand x={x0 + 9} top={panel} side={1} />}
        <rect x={x0 + 3} y={trayTop} width={w - 6} height={5} rx={1} fill={metal} />
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={className} aria-hidden="true">
      {counter ? (
        <g>
          <rect x={c0} y={FLOOR} width={cw} height={4} rx={1} fill="currentColor" opacity={0.28} />
          <path d={`M${c0} ${FLOOR + 4}V${8}M${c1} ${FLOOR + 4}V${8}`} stroke="currentColor" strokeOpacity={0.35} strokeDasharray="3 3" />
        </g>
      ) : (
        <rect x={x0 - 6} y={FLOOR} width={w + 12} height={4} rx={1} fill="currentColor" opacity={0.14} />
      )}
      {body}
      <path d={`M${x0 + 6} ${FLOOR - 3}V${FLOOR}M${x1 - 6} ${FLOOR - 3}V${FLOOR}`} stroke="#2a2f35" strokeWidth={4} />
      {counter && x0 < c0 && (
        <g style={{ fill: "var(--fui-danger-ink)" }} opacity={0.45}>
          <rect x={x0} y={top} width={c0 - x0} height={FLOOR - top} />
          <rect x={c1} y={top} width={x1 - c1} height={FLOOR - top} />
        </g>
      )}
    </svg>
  );
}
