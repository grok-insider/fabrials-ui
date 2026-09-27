import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Comparison } from "../../registry/components/comparison";
import { CoffeeMachine } from "../../components/coffee-machine";
import {
  selectionMotion as motion,
  easeBetween,
  cursorAt,
  choosePath,
  reviewPath,
} from "./motion";
import { coffeeProducts } from "../../lib/coffee-demo";
import timing from "./timing.json";
import { narration } from "./script";
import captions from "./captions.json";
const ink = "#20271f",
  muted = "#72786b",
  paper = "#f4f5ed",
  line = "#dce0d4",
  lime = "#d2f597";
const mono = "ui-monospace, SFMono-Regular, monospace";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const tween = (f: number, a: number, b: number, x = 0, y = 1) =>
  interpolate(f, [a, b], [x, y], clamp);
function In({
  children,
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const f = useCurrentFrame();
  const p = spring({
    frame: f - delay,
    fps: 30,
    config: { damping: 25, stiffness: 130 },
  });
  return (
    <div
      style={{
        opacity: tween(f, delay, delay + 12),
        transform: `translateY(${(1 - p) * 28}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
function Mark() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM15 14l6 6m0-6-6 6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
function Base({
  index,
  children,
  dark = false,
}: {
  index: number;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <AbsoluteFill
      style={{
        background: dark ? ink : paper,
        color: dark ? paper : ink,
        fontFamily: "Plex, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 55,
          left: 80,
          right: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            fontSize: 28,
          }}
        >
          <Mark />
          fabrials <span style={{ opacity: 0.4 }}>/ ui</span>
        </div>
        <span
          style={{
            fontFamily: mono,
            fontSize: 16,
            letterSpacing: 2,
            opacity: 0.55,
          }}
        >
          A SHARED INTERFACE / {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      {children}
      <div
        style={{
          position: "absolute",
          bottom: 43,
          left: 80,
          right: 80,
          display: "flex",
          gap: 10,
        }}
      >
        {narration.map((s, i) => (
          <div
            key={s.id}
            style={{
              height: 3,
              flex: 1,
              background:
                i === index ? (dark ? lime : ink) : dark ? "#47513e" : line,
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}
function Chapter({ index }: { index: number }) {
  return (
    <In
      style={{
        position: "absolute",
        top: 140,
        left: 85,
        right: 85,
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
      }}
    >
      <h1
        style={{
          fontSize: 57,
          fontWeight: 500,
          letterSpacing: -2.4,
          margin: 0,
          whiteSpace: "pre-line",
          lineHeight: 1.05,
        }}
      >
        {narration[index].title.replace("\n", " ")}
      </h1>
      <span
        style={{
          fontSize: 16,
          fontFamily: mono,
          color: muted,
          letterSpacing: 1.3,
        }}
      >
        {narration[index].eyebrow}
      </span>
    </In>
  );
}
function Pointer({
  x,
  y,
  clickFrame,
}: {
  x: number;
  y: number;
  clickFrame?: number;
}) {
  const f = useCurrentFrame();
  const age = clickFrame === undefined ? -1 : f - clickFrame;
  const clicking = age >= 0 && age < 18;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 7,
        transform: `scale(${clicking ? 1 - Math.sin((age / 18) * Math.PI) * 0.14 : 1})`,
      }}
    >
      {clicking && (
        <div
          style={{
            position: "absolute",
            left: -23,
            top: -23,
            width: 70,
            height: 70,
            border: `3px solid ${ink}`,
            borderRadius: 99,
            opacity: tween(age, 0, 18, 0.5, 0),
            transform: `scale(${tween(age, 0, 18, 0.5, 1.4)})`,
          }}
        />
      )}
      <svg width="34" height="42" viewBox="0 0 30 36">
        <path
          d="M3 2L26 23L15 24L10 34Z"
          fill={ink}
          stroke="white"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
function Intro() {
  const f = useCurrentFrame();
  return (
    <Base index={0} dark>
      <div style={{ position: "absolute", left: 90, top: 235, width: 1080 }}>
        <In>
          <div
            style={{
              fontFamily: mono,
              fontSize: 21,
              letterSpacing: 3,
              color: lime,
            }}
          >
            MORE THAN A TOOL CALL
          </div>
        </In>
        <In delay={12}>
          <h1
            style={{
              fontSize: 130,
              letterSpacing: -6,
              lineHeight: 1.04,
              fontWeight: 500,
              margin: "30px 0",
            }}
          >
            Help people
            <br />
            <span style={{ color: lime }}>finish the task.</span>
          </h1>
        </In>
        <In delay={45}>
          <p style={{ fontSize: 29, color: "#bdc7b2", lineHeight: 1.5 }}>
            A real need. A visible answer.
            <br />A decision that stays yours.
          </p>
        </In>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1160,
          top: 240,
          width: 680,
          height: 610,
          transform: `translateY(${tween(f, 0, 300, 20, -10)}px)`,
        }}
      >
        <In delay={28}>
          <div
            style={{
              background: "#d7ddc9",
              borderRadius: 200,
              width: 590,
              height: 590,
              display: "grid",
              placeItems: "center",
              transform: `rotate(${tween(f, 0, 250, -4, 1)}deg)`,
            }}
          >
            <CoffeeMachine
              color="#e5e2d6"
              style={{ width: 650, marginLeft: -25 }}
            />
          </div>
        </In>
        <In
          delay={80}
          style={{
            position: "absolute",
            bottom: 0,
            left: 80,
            background: paper,
            color: ink,
            padding: "19px 30px",
            borderRadius: 16,
            fontSize: 27,
            boxShadow: "0 14px 40px #0003",
          }}
        >
          Better mornings, together. ↗
        </In>
      </div>
    </Base>
  );
}
function Shop({ step }: { step: number }) {
  const f = useCurrentFrame();
  const highlighted = step > 1 || (step === 1 && f > 295);
  const chosen = step > 3 || (step === 3 && f >= motion.machineArrives);
  const filter =
    (step === 3 && f >= motion.filterArrives) ||
    (step === 4 && f < motion.removeClick);
  const review = step === 4 && f >= motion.reviewClick + 10;
  const arrival =
    step === 3
      ? spring({
          frame: f - motion.machineArrives,
          fps: 30,
          config: { damping: 20, stiffness: 180 },
        })
      : 1;
  const filterProgress =
    step === 3
      ? easeBetween(f, motion.filterArrives, motion.filterArrives + 18)
      : 1 - easeBetween(f, motion.removeClick, motion.removeClick + 18);
  const total = Math.round(1290 + filterProgress * 24);
  const typed = "Two flat whites. A 32 cm counter. Keep my 58 mm accessories.";
  const title =
    step === 1
      ? "Your starting point"
      : step === 2
        ? "A reason you can see"
        : step === 3
          ? "Your selection"
          : "Your final decision";
  return (
    <Base index={step}>
      <Chapter index={step} />
      <div
        style={{
          position: "absolute",
          left: 80,
          top: 245,
          width: 1760,
          height: 640,
          border: `1px solid ${line}`,
          borderRadius: 25,
          background: "white",
          boxShadow: "0 28px 70px #25311b12",
          overflow: "hidden",
          transform: "translateY(0)",
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${line}`,
            padding: "0 30px",
            fontSize: 22,
          }}
        >
          <span>▣ &nbsp; The morning ritual</span>
          <span style={{ fontFamily: mono, fontSize: 15, color: muted }}>
            INTERACTIVE STORE / FICTIONAL PRODUCTS
          </span>
        </div>
        <div style={{ display: "flex", height: 576 }}>
          <div style={{ width: 1210, padding: "22px 28px" }}>
            <Comparison
              caption="Find your fit"
              columns={coffeeProducts.map((p) => ({
                id: p.id,
                title: p.name,
                subtitle: `€${p.price.toLocaleString("en")}`,
                visual: (
                  <CoffeeMachine
                    color={p.color}
                    style={{ height: 145, width: 230 }}
                  />
                ),
                action: (
                  <div
                    style={{
                      display: "inline-block",
                      border: `1px solid ${chosen && p.id === "studio" ? ink : line}`,
                      borderRadius: 9,
                      padding: "11px 24px",
                      background: chosen && p.id === "studio" ? lime : "white",
                      fontSize: 21,
                      transform: `scale(${step === 3 && p.id === "studio" && f >= motion.chooseClick && f < motion.chooseClick + 18 ? 1 - Math.sin(((f - motion.chooseClick) / 18) * Math.PI) * 0.05 : 1})`,
                    }}
                  >
                    {chosen && p.id === "studio" ? "✓ Selected" : "+ Choose"}
                  </div>
                ),
              }))}
              rows={[
                {
                  id: "width",
                  label: "Counter space",
                  highlighted: step === 2 ? f > 70 : highlighted,
                  values: {
                    studio: (
                      <span>
                        29 cm{" "}
                        <small>{highlighted ? "✓ Fits your space" : ""}</small>
                      </span>
                    ),
                    atelier: (
                      <span>
                        36 cm <small>{highlighted ? "Too wide" : ""}</small>
                      </span>
                    ),
                  },
                },
                {
                  id: "fitting",
                  label: "Accessory fit",
                  highlighted: step === 2 ? f > 150 : highlighted,
                  values: {
                    studio: (
                      <span>
                        58 mm{" "}
                        <small>
                          {highlighted ? "✓ Keep your accessories" : ""}
                        </small>
                      </span>
                    ),
                    atelier: (
                      <span>
                        54 mm{" "}
                        <small>{highlighted ? "Different fitting" : ""}</small>
                      </span>
                    ),
                  },
                },
                {
                  id: "milk",
                  label: "Two flat whites",
                  values: {
                    studio: "Independent steam",
                    atelier: "Independent steam",
                  },
                },
              ]}
            />
          </div>
          <div
            style={{
              flex: 1,
              borderLeft: `1px solid ${line}`,
              background: "#f7f8f2",
              padding: "30px 30px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 18,
                color: muted,
                marginBottom: 22,
              }}
            >
              <span>{title}</span>
              <span
                style={{
                  border: `1px solid ${line}`,
                  borderRadius: 20,
                  padding: "5px 10px",
                  fontSize: 13,
                }}
              >
                Guided simulation
              </span>
            </div>
            {step < 3 ? (
              <>
                <div
                  style={{
                    fontSize: 31,
                    lineHeight: 1.4,
                    letterSpacing: -0.5,
                    minHeight: 135,
                  }}
                >
                  {step === 1 ? (
                    <>
                      “
                      {typed.slice(
                        0,
                        Math.floor(tween(f, 20, 115) * typed.length),
                      )}
                      ”
                    </>
                  ) : (
                    <div
                      style={{
                        fontFamily: mono,
                        fontSize: 23,
                        lineHeight: 1.8,
                      }}
                    >
                      <span style={{ color: muted, fontSize: 15 }}>
                        STRUCTURED ACTION
                      </span>
                      <br />
                      <span>
                        {"compare_coffee_machines".slice(
                          0,
                          Math.floor(
                            tween(f, 0, 40) * "compare_coffee_machines".length,
                          ),
                        )}
                      </span>
                      <br />
                      <span style={{ opacity: tween(f, 35, 55) }}>
                        {"{ maxWidth: 32,"}
                        <br />
                        {'  fitting: "58 mm" }'}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 25,
                    background: ink,
                    color: paper,
                    padding: "16px 20px",
                    borderRadius: 11,
                    fontSize: 22,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {step === 1
                      ? "Find the right fit"
                      : f < 170
                        ? "Checking requirements…"
                        : "✓ Comparison complete"}
                  </span>
                  <span>→</span>
                </div>
                <In delay={step === 1 ? 295 : 195} style={{ marginTop: 28 }}>
                  <div
                    style={{
                      padding: 20,
                      borderRadius: 13,
                      background: lime,
                      fontSize: 25,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ fontWeight: 500 }}>
                      Studio Dual fits.
                    </strong>
                    <br />
                    <span style={{ fontSize: 21 }}>
                      29 cm wide. Your accessories carry over.
                    </span>
                  </div>
                </In>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 26,
                    marginTop: 32,
                    opacity: chosen
                      ? tween(
                          f,
                          step === 3 ? motion.machineArrives : -20,
                          step === 3 ? motion.machineArrives + 12 : -1,
                        )
                      : 0,
                    transform: `translateY(${(1 - arrival) * 18}px)`,
                  }}
                >
                  <span>Studio Dual</span>
                  <span>€1,290</span>
                </div>
                <div
                  style={{
                    marginTop: 25,
                    padding: 20,
                    border: `1px solid ${filter ? ink : line}`,
                    borderRadius: 12,
                    background: `rgb(${255 - Math.round(filterProgress * 45)}, ${255 - Math.round(filterProgress * 10)}, ${255 - Math.round(filterProgress * 104)})`,
                    transform: `scale(${1 + Math.sin(filterProgress * Math.PI) * 0.025})`,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 22,
                  }}
                >
                  <span>
                    {filter ? "✓ Water filter" : "+ Compatible filter"}
                    <small
                      style={{
                        display: "block",
                        marginTop: 6,
                        fontSize: 17,
                        color: muted,
                      }}
                    >
                      Universal · €24
                    </small>
                  </span>
                  <span>{filter ? "−" : "+"}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 29,
                    marginTop: 30,
                    paddingTop: 25,
                    borderTop: `1px solid ${line}`,
                  }}
                >
                  <span>Total</span>
                  <span>{chosen ? `€${total.toLocaleString("en")}` : "—"}</span>
                </div>
                <div
                  style={{
                    marginTop: 28,
                    borderRadius: 10,
                    padding: "17px 20px",
                    background: ink,
                    color: paper,
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 23,
                    opacity: chosen ? 1 : 0.4,
                  }}
                >
                  <span>
                    {chosen ? "Review selection" : "Choose a machine first"}
                  </span>
                  <span>→</span>
                </div>
                <p style={{ fontSize: 16, color: muted, lineHeight: 1.5 }}>
                  Demo only. No payment or order is created.
                </p>
              </>
            )}
          </div>
        </div>
        {review && (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#17200e66",
                opacity: tween(f, 155, 172),
              }}
            />
            <In
              delay={155}
              style={{
                position: "absolute",
                left: 490,
                top: 120,
                width: 780,
                background: paper,
                borderRadius: 23,
                padding: 40,
                boxShadow: "0 25px 90px #0003",
              }}
            >
              <div style={{ fontSize: 43, letterSpacing: -1 }}>
                Your morning setup
              </div>
              <p style={{ fontSize: 23, color: muted, lineHeight: 1.5 }}>
                Review your selection.
                <br />
                The final decision stays with you.
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "24px 0",
                  borderTop: `1px solid ${line}`,
                  fontSize: 28,
                }}
              >
                <span>Studio Dual</span>
                <span>€1,290</span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 15,
                  justifyContent: "flex-end",
                  marginTop: 15,
                  fontSize: 22,
                }}
              >
                <span
                  style={{
                    padding: "14px 24px",
                    border: `1px solid ${line}`,
                    borderRadius: 10,
                  }}
                >
                  Go back
                </span>
                <span
                  style={{
                    padding: "14px 24px",
                    background: ink,
                    color: paper,
                    borderRadius: 10,
                  }}
                >
                  Save demo selection →
                </span>
              </div>
            </In>
          </>
        )}
      </div>
      {step === 3 && f >= motion.chooseClick && f < motion.machineArrives && (
        <div
          style={{
            position: "absolute",
            left: easeBetween(
              f,
              motion.chooseClick,
              motion.machineArrives,
              442,
              1340,
            ),
            top:
              easeBetween(
                f,
                motion.chooseClick,
                motion.machineArrives,
                345,
                385,
              ) -
              Math.sin(
                easeBetween(f, motion.chooseClick, motion.machineArrives) *
                  Math.PI,
              ) *
                80,
            width: 170,
            transform: `scale(${easeBetween(f, motion.chooseClick, motion.machineArrives, 1, 0.45)})`,
            transformOrigin: "top left",
            background: paper,
            borderRadius: 20,
            boxShadow: "0 14px 40px #20271f25",
            zIndex: 6,
            opacity: tween(
              f,
              motion.machineArrives - 5,
              motion.machineArrives,
              1,
              0,
            ),
          }}
        >
          <CoffeeMachine style={{ width: 170 }} />
        </div>
      )}
      {step === 3 && !chosen && (
        <div
          style={{
            position: "absolute",
            left: 1320,
            top: 399,
            fontSize: 23,
            color: muted,
            opacity: 1 - tween(f, motion.chooseClick, motion.machineArrives),
          }}
        >
          Your setup starts with a machine.
        </div>
      )}
      {step === 1 && f > 225 && f < 325 && (
        <Pointer
          {...cursorAt(f, [
            [225, 1790, 900],
            [280, 1540, 580],
            [325, 1540, 580],
          ])}
          clickFrame={295}
        />
      )}
      {step === 3 && f < 156 && (
        <Pointer
          {...cursorAt(f, choosePath)}
          clickFrame={f < 80 ? motion.chooseClick : motion.filterClick}
        />
      )}
      {step === 4 && !review && (
        <Pointer
          {...cursorAt(f, reviewPath)}
          clickFrame={f < 100 ? motion.removeClick : motion.reviewClick}
        />
      )}
    </Base>
  );
}
function Outro() {
  const f = useCurrentFrame();
  return (
    <Base index={5} dark>
      <In style={{ position: "absolute", left: 90, top: 225 }}>
        <p
          style={{
            fontFamily: mono,
            fontSize: 21,
            letterSpacing: 3,
            color: lime,
          }}
        >
          YOUR COMPONENTS. YOUR CODE.
        </p>
        <h1
          style={{
            fontSize: 119,
            lineHeight: 1.04,
            letterSpacing: -5,
            fontWeight: 500,
            margin: "30px 0",
          }}
        >
          Build something
          <br />
          <span style={{ color: lime }}>worth acting on.</span>
        </h1>
      </In>
      <In
        delay={45}
        style={{
          position: "absolute",
          left: 95,
          top: 585,
          display: "flex",
          gap: 18,
        }}
      >
        {["Comparison", "WebMCP provider", "Human confirmation"].map((t, i) => (
          <In key={t} delay={45 + i * 16}>
            <div
              style={{
                border: "1px solid #616c55",
                borderRadius: 12,
                padding: "18px 26px",
                fontSize: 27,
              }}
            >
              {t} ↗
            </div>
          </In>
        ))}
      </In>
      <In
        delay={105}
        style={{
          position: "absolute",
          left: 95,
          top: 695,
          fontSize: 23,
          color: "#bbc7b0",
        }}
      >
        Experimental browser access. Familiar controls everywhere.
      </In>
      <In
        delay={165}
        style={{ position: "absolute", left: 95, top: 790, fontSize: 42 }}
      >
        <span style={{ borderBottom: `2px solid ${lime}`, paddingBottom: 9 }}>
          ui.fabrials.com
        </span>{" "}
        <span style={{ color: lime }}>↗</span>
      </In>
      <div
        style={{
          position: "absolute",
          right: 140,
          top: 500,
          opacity: tween(f, 45, 100),
          transform: `translateY(${tween(f, 45, 250, 25, -10)}px)`,
        }}
      >
        <CoffeeMachine color="#d9decf" style={{ width: 540 }} />
      </div>
    </Base>
  );
}
const style = `@font-face{font-family:Plex;src:url('${staticFile("IBMPlexSans.woff2")}')}*{box-sizing:border-box}.comparison-mobile{display:none}.comparison-view table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:24px;text-align:left}.comparison-view caption{display:none}.comparison-view thead th{font-weight:400;padding:0 20px 14px;vertical-align:bottom}.comparison-view thead th:first-child{width:25%;font-size:18px;color:${muted}}.comparison-view thead th>div:first-of-type{font-size:28px;margin-top:0}.comparison-view thead th>div:last-of-type{font-size:23px;color:${muted};margin-top:6px}.comparison-view tbody tr{border-top:1px solid ${line};height:72px}.comparison-view tbody th{font-weight:400;font-size:21px;padding:10px 20px}.comparison-view td{padding:10px 20px}.comparison-view tr[data-highlighted]{background:${lime}}.comparison-view small{display:block;font-size:16px;margin-top:5px}.comparison-view tfoot{border-top:1px solid ${line}}.comparison-view tfoot td:first-child{font-size:18px;color:${muted}}.comparison-view .sr-only{display:none}`;
export function Film() {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const views = [
    <Intro key="intro" />,
    ...[1, 2, 3, 4].map((s) => <Shop key={s} step={s} />),
    <Outro key="outro" />,
  ];
  const caption = captions.find((c) => f / 30 >= c.start && f / 30 < c.end);
  return (
    <AbsoluteFill>
      <style>{style}</style>
      <TransitionSeries>
        {views.flatMap((view, i) => {
          const nodes = [
            <TransitionSeries.Sequence
              key={i}
              durationInFrames={timing.scenes[i].frames + (i < 5 ? 12 : 0)}
            >
              {view}
            </TransitionSeries.Sequence>,
          ];
          if (i < 5)
            nodes.push(
              <TransitionSeries.Transition
                key={`t${i}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: 12 })}
              />,
            );
          return nodes;
        })}
      </TransitionSeries>
      {timing.scenes.map((s, i) => (
        <Sequence
          key={s.id}
          from={s.from + 15}
          durationInFrames={Math.ceil(s.speechSeconds * 30)}
        >
          <Audio src={staticFile(`voice-${i}.mp3`)} />
        </Sequence>
      ))}
      <Audio
        src={staticFile("music.wav")}
        volume={(frame) =>
          Math.min(
            tween(frame, 0, 60, 0, 0.25),
            tween(frame, durationInFrames - 90, durationInFrames, 0.25, 0),
          )
        }
      />
      {caption && (
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 150,
            right: 150,
            textAlign: "center",
            fontFamily: "Plex",
            fontSize: 27,
            lineHeight: 1.45,
          }}
        >
          <span
            style={{
              display: "inline-block",
              maxWidth: 1500,
              padding: "12px 25px",
              borderRadius: 11,
              background: "#20271ff0",
              color: paper,
            }}
          >
            {caption.text}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
}
