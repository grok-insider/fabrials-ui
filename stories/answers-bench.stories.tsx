import { useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AnnotationList,
  ChoiceFeedback,
  ChoiceGroup,
  ChoiceOption,
  Input,
  MarkedText,
  Progress,
  RatingBar,
  RevealCard,
  StepControls,
  TextDiff,
  useStepPlayer,
  type ProgressSegment,
  type TextRange,
} from "@fabrials/ui";
import { Block, Frame, Page } from "./story-frame";

const meta = {
  title: "Tests/Answers and steps",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// Every piece in fixed states, for the visual suite. Nothing here reads a clock: the one player that can run only runs when
// a test presses play, on the test's own clock.

const question = { margin: 0, fontWeight: 600 } as const;
const stack = { display: "grid", gap: "var(--fui-space-3)", minWidth: 0 } as const;
const note = { margin: 0, color: "var(--muted-foreground)", fontSize: "var(--fui-text-xs)" } as const;

function Evening() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <div style={stack}>
      <p id="q-evening" style={question}>
        Which of these do you say in the evening?
      </p>
      <ChoiceGroup aria-labelledby="q-evening" onValueChange={setValue} shortcuts value={value}>
        <ChoiceOption value="bonjour">
          <span lang="fr">Bonjour</span>
        </ChoiceOption>
        <ChoiceOption value="bonsoir">
          <span lang="fr">Bonsoir</span>
        </ChoiceOption>
        <ChoiceOption ruledOut value="merci">
          <span lang="fr">Merci</span>
        </ChoiceOption>
        <ChoiceOption value="salut">
          <span lang="fr">Salut</span>
        </ChoiceOption>
      </ChoiceGroup>
      <p data-testid="evening-value" style={note}>
        Picked: {value ?? "nothing yet"}
      </p>
      <Input aria-label="Notes" placeholder="Notes" />
    </div>
  );
}

const SESSION: ProgressSegment[] = [
  { id: "warm", label: "Warm-up", weight: 2, state: "done" },
  { id: "new", label: "New words", weight: 5, state: "done" },
  { id: "listen", label: "Listening", weight: 4, state: "current" },
  { id: "speak", label: "Speaking", weight: 3 },
  { id: "review", label: "Review", weight: 6 },
];

const QUIZ: ProgressSegment[] = [
  { id: "q1", label: "Question 1", state: "correct" },
  { id: "q2", label: "Question 2", state: "incorrect" },
  { id: "q3", label: "Question 3", state: "skipped" },
  { id: "q4", label: "Question 4", state: "current" },
  { id: "q5", label: "Question 5" },
  { id: "q6", label: "Question 6" },
];

function Quiz() {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div style={stack}>
      <Progress hint="Go back to any question." label="Questions" onSegmentSelect={setPicked} segments={QUIZ} />
      <p data-testid="quiz-picked" style={note}>
        Opened: {picked == null ? "none" : QUIZ[picked]!.label}
      </p>
    </div>
  );
}

const FRAMES = ["Compare 4 and 7", "Swap 7 and 2", "Compare 7 and 9", "Sorted"];

function LivePlayer() {
  const player = useStepPlayer({ count: FRAMES.length, interval: 1000 });
  return (
    <div style={stack}>
      <p data-testid="frame" style={{ margin: 0 }}>
        {FRAMES[player.index]}
      </p>
      <StepControls {...player} aria-label="Bubble sort" reset speeds={[0.5, 1, 2]} />
    </div>
  );
}

function Rated({ name, children }: { name: string; children: (rate: () => void) => ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <div style={stack}>
      {children(() => setCount((value) => value + 1))}
      <p data-testid={name} style={note}>
        Ratings given: {count}
      </p>
    </div>
  );
}

const RATINGS = [
  { value: "again", label: "Again", hint: "In 1 minute", tone: "danger" },
  { value: "hard", label: "Hard", hint: "In 2 days", tone: "warning" },
  { value: "good", label: "Good", hint: "In 5 days", tone: "success" },
] as const;

const face = { margin: 0, fontSize: "var(--fui-text-xl)", fontWeight: 600 } as const;

const ESSAY = "Yesterday I go to the market and buyed three apple. The weather were nice, so I walked at home.";
const at = (fragment: string) => ({ start: ESSAY.indexOf(fragment), end: ESSAY.indexOf(fragment) + fragment.length });
const RANGES: TextRange[] = [
  { ...at("go"), id: "note-1" },
  { ...at("buyed"), id: "note-2" },
  { ...at("apple"), id: "note-3", severity: "warning" },
  { ...at("at home"), id: "note-4", severity: "note" },
];

function Bench() {
  return (
    <Page description="Answer tiles, a card that reveals, ratings, step controls, a segmented and a marked progress bar, a marked text and a diff, each in fixed states." title="Answers and steps">
      <Block title="One answer" description="Letters, their keys (B picks the second), an option a hint ruled out, and a field beside it where the same key is only a letter.">
        <Frame width={480}>
          <Evening />
        </Frame>
      </Block>
      <Block title="Several answers" description="Numbers, two ticked, with a second line; then two columns where they fit, and a row of two.">
        <Frame width={480}>
          <div style={stack}>
            <p id="q-primes" style={question}>
              Which of these are prime?
            </p>
            <ChoiceGroup aria-labelledby="q-primes" defaultValue={["7", "13"]} markers="numbers" multiple>
              <ChoiceOption description="Seven times one." value="7">
                7
              </ChoiceOption>
              <ChoiceOption description="Three times three." value="9">
                9
              </ChoiceOption>
              <ChoiceOption value="13">13</ChoiceOption>
            </ChoiceGroup>
          </div>
        </Frame>
        <Frame width={640}>
          <div style={stack}>
            <ChoiceGroup aria-label="Capital of Australia" columns={2} defaultValue="canberra" size="sm">
              <ChoiceOption value="sydney">Sydney</ChoiceOption>
              <ChoiceOption value="canberra">Canberra</ChoiceOption>
              <ChoiceOption value="melbourne">Melbourne</ChoiceOption>
              <ChoiceOption value="perth">Perth</ChoiceOption>
            </ChoiceGroup>
            <ChoiceGroup aria-label="Do you know this word?" markers="numbers" orientation="horizontal" size="lg">
              <ChoiceOption value="yes">I know it</ChoiceOption>
              <ChoiceOption value="no">I do not</ChoiceOption>
            </ChoiceGroup>
          </div>
        </Frame>
      </Block>
      <Block title="Answered" description="A right pick; a wrong pick with the right answer it missed; several answers marked one by one. Each has its panel.">
        <div className="catalogue-row" style={{ alignItems: "start" }}>
          <Frame width={360}>
            <div style={stack}>
              <ChoiceGroup aria-label="Evening, answered right" result="correct" value="bonsoir">
                <ChoiceOption value="bonjour">
                  <span lang="fr">Bonjour</span>
                </ChoiceOption>
                <ChoiceOption value="bonsoir">
                  <span lang="fr">Bonsoir</span>
                </ChoiceOption>
                <ChoiceOption value="salut">
                  <span lang="fr">Salut</span>
                </ChoiceOption>
              </ChoiceGroup>
              <ChoiceFeedback tone="correct">Said from about six in the evening.</ChoiceFeedback>
            </div>
          </Frame>
          <Frame width={360}>
            <div style={stack}>
              <ChoiceGroup aria-label="Evening, answered wrong" result="incorrect" value="bonjour">
                <ChoiceOption value="bonjour">
                  <span lang="fr">Bonjour</span>
                </ChoiceOption>
                <ChoiceOption result="missed" value="bonsoir">
                  <span lang="fr">Bonsoir</span>
                </ChoiceOption>
                <ChoiceOption value="salut">
                  <span lang="fr">Salut</span>
                </ChoiceOption>
              </ChoiceGroup>
              <ChoiceFeedback tone="incorrect">
                <span lang="fr">Bonjour</span> is for the day.
              </ChoiceFeedback>
            </div>
          </Frame>
          <Frame width={360}>
            <div style={stack}>
              <ChoiceGroup aria-label="Primes, answered" markers="numbers" multiple value={["7", "9"]}>
                <ChoiceOption result="correct" value="7">
                  7
                </ChoiceOption>
                <ChoiceOption result="incorrect" value="9">
                  9
                </ChoiceOption>
                <ChoiceOption result="missed" value="13">
                  13
                </ChoiceOption>
              </ChoiceGroup>
              <ChoiceFeedback tone="partial">One of two.</ChoiceFeedback>
              <ChoiceFeedback title="A model answer" tone="neutral">
                7 and 13 have no divisor but 1 and themselves.
              </ChoiceFeedback>
            </div>
          </Frame>
        </div>
      </Block>
      <Block title="Right to left" description="An Arabic question: the keycap at the right, the tick at the left, and a step bar whose chevrons turn.">
        <Frame dir="rtl" width={480}>
          <div lang="ar" style={stack}>
            <p id="q-ar" style={question}>
              ما عاصمة مصر؟
            </p>
            <ChoiceGroup aria-labelledby="q-ar" defaultValue="cairo" locale="ar-EG" markers="numbers">
              <ChoiceOption value="alex">الإسكندرية</ChoiceOption>
              <ChoiceOption value="cairo">القاهرة</ChoiceOption>
              <ChoiceOption ruledOut value="giza">
                الجيزة
              </ChoiceOption>
            </ChoiceGroup>
            <StepControls
              aria-label="الخطوات"
              count={12}
              index={4}
              labels={{ previous: "الخطوة السابقة", next: "الخطوة التالية", play: "تشغيل", step: (current, total) => `الخطوة ${current} من ${total}` }}
              locale="ar-EG"
              next={() => {}}
              previous={() => {}}
              toggle={() => {}}
            />
            <Progress
              aria-label="الاختبار"
              hint="أقصر اختبار ينتهي عند العلامة."
              marks={[{ value: 40, label: "أقصر اختبار", caption: true }]}
              value={25}
            />
          </div>
        </Frame>
      </Block>
      <Block title="A card that reveals" description="Hidden with its key, and revealed with its ratings. The keys rate on the second card; the ratings of the first come without keys, since one bar answers to the keys at a time.">
        <div className="catalogue-row" style={{ alignItems: "start" }}>
          <div style={{ width: "100%", maxWidth: 420, minWidth: 0 }}>
            <Rated name="ratings-hidden">
              {(rate) => (
                <RevealCard
                  back={<p style={{ margin: 0 }}>the lighthouse</p>}
                  front={
                    <p lang="fr" style={face}>
                      le phare
                    </p>
                  }
                  label="Card 3 of 20"
                >
                  <RatingBar label="How well did you know it?" onRate={rate} options={RATINGS} shortcuts={false} />
                </RevealCard>
              )}
            </Rated>
          </div>
          <div style={{ width: "100%", maxWidth: 420, minWidth: 0 }}>
            <Rated name="ratings-shown">
              {(rate) => (
                <RevealCard
                  back={<p style={{ margin: 0 }}>the harbour</p>}
                  defaultRevealed
                  front={
                    <p lang="fr" style={face}>
                      le port
                    </p>
                  }
                  label="Card 4 of 20"
                >
                  <RatingBar label="How well did you know it?" onRate={rate} options={RATINGS} />
                </RevealCard>
              )}
            </Rated>
          </div>
        </div>
      </Block>
      <Block title="Step controls" description="At the start, playing in the middle, at the end; then one that runs, with reset and speeds.">
        <Frame width={640}>
          <div style={stack}>
            <StepControls aria-label="At the start" count={12} index={0} next={() => {}} previous={() => {}} toggle={() => {}} />
            <StepControls aria-label="Playing" count={12} index={5} next={() => {}} playing previous={() => {}} toggle={() => {}} />
            <StepControls aria-label="At the end" count={12} index={11} next={() => {}} previous={() => {}} toggle={() => {}} />
            <StepControls aria-label="A pager" count={8} index={2} next={() => {}} previous={() => {}} />
          </div>
        </Frame>
        <Frame width={640}>
          <LivePlayer />
        </Frame>
      </Block>
      <Block title="Progress in segments" description="The blocks of a session, each as wide as its minutes; the questions of a quiz as buttons; and a mark on an ordinary bar.">
        <Frame width={520}>
          <div style={stack}>
            <Progress hint="About 12 minutes left" label="Today's session" segments={SESSION} />
            <Progress aria-label="Session, small" segments={SESSION} size="sm" tone="success" />
            <Progress aria-label="Session, done" segments={SESSION.map((segment) => ({ ...segment, state: "done" as const }))} size="lg" />
            <Quiz />
            <Progress
              hint="The test stops when it is sure, between 10 and 25 questions."
              label="Placement test"
              marks={[
                { value: 10, label: "The shortest test ends here", caption: true },
                { value: 20, label: "Most tests are over by here" },
              ]}
              max={25}
              showValue={false}
              value={6}
            />
          </div>
        </Frame>
      </Block>
      <Block title="A marked text" description="Three kinds of mark, numbered like the notes under the text; then what changed between two versions.">
        <Frame width={560}>
          <div style={stack}>
            <MarkedText lang="en" ranges={RANGES} text={ESSAY} />
            <AnnotationList
              aria-label="Notes"
              items={[
                { id: "note-1", title: "Tense", before: "go", after: "went", children: "Yesterday asks for the past." },
                { id: "note-2", title: "Irregular verb", before: "buyed", after: "bought" },
                { id: "note-3", severity: "warning", title: "Plural", before: "apple", after: "apples", children: "Three of them." },
                { id: "note-4", severity: "note", title: "Preposition", before: "at home", children: "You walk home, with no preposition." },
              ]}
              textLang="en"
            />
            <TextDiff after="Yesterday I went to the market and bought three apples." before="Yesterday I go to the market and buyed three apple." legend />
          </div>
        </Frame>
      </Block>
    </Page>
  );
}

export const Pieces: Story = { render: () => <Bench /> };
