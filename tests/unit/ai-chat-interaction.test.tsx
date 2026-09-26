import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ActivityDisclosure,
  AttachmentChip,
  Attachments,
  ChatComposer,
  ChatMessage,
  CopyMessageAction,
  MessageAction,
  MessageActions,
  MessageTimestamp,
  ReasoningDisclosure,
  SearchStepsDisclosure,
  VoiceInputButton,
  VoiceInputButtonView,
  attachmentCategory,
  attachmentDetail,
  countSearches,
  describeMicError,
  formatBytes,
  formatElapsed,
  insertDictation,
  pickRecorderMimeType,
  reasoningLabel,
  searchDoneLabel,
  searchLabel,
  searchPhase,
  searchStepLabel,
  SearchStepList,
} from "../../packages/ai-ui/src/index";

test("search labels and phases follow the turn", () => {
  assert.equal(searchDoneLabel(0), "Searched the web");
  assert.equal(searchDoneLabel(5, 3), "Searched the web · 3 searches · 5 sources");
  assert.equal(searchDoneLabel(1, 1), "Searched the web · 1 search · 1 source");
  assert.equal(searchLabel("searching", 2, 2), "Searching the web…");
  assert.equal(searchLabel("reading", 3), "Reading results…");
  assert.equal(searchPhase({ pending: true, streaming: true, isLast: true }), "searching");
  assert.equal(searchPhase({ pending: false, streaming: true, isLast: true }), "reading");
  assert.equal(searchPhase({ pending: false, streaming: true, isLast: false }), "done");
  assert.equal(searchPhase({ pending: true, streaming: false, isLast: true }), "done");
  assert.equal(
    countSearches([
      { type: "search", query: "a" },
      { type: "open_page", url: "https://x.ai" },
    ]),
    1,
  );
  assert.equal(searchStepLabel({ type: "open_page", url: "https://www.x.ai/news" }), "Opened x.ai");
});

test("reasoning labels", () => {
  assert.equal(reasoningLabel(true, undefined), "Thinking…");
  assert.equal(reasoningLabel(false, 0), "Thinking…");
  assert.equal(reasoningLabel(false, undefined), "Thought for a few seconds");
  assert.equal(reasoningLabel(false, 4), "Thought for 4s");
  assert.equal(reasoningLabel(false, 4, { thoughtFor: (s) => `Pensó ${s} s` }), "Pensó 4 s");
});

test("activity without a body is a plain status row with a live dot and shimmer", () => {
  const html = renderToStaticMarkup(<ActivityDisclosure icon={<svg />} label="Working it out…" live />);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /fui-activity-icon" data-live="true"/);
  assert.match(html, /<span class="fui-shimmer-text"[^>]*>Working it out…<\/span>/);
  assert.doesNotMatch(html, /<button/);
});

test("activity with a body is a disclosure; finished label is plain text", () => {
  const html = renderToStaticMarkup(
    <SearchStepsDisclosure
      phase="done"
      sourceCount={2}
      steps={[
        { type: "search", query: "fabrials design" },
        { type: "open_page", url: "https://example.com/page" },
      ]}
    />,
  );
  assert.match(html, /<button[^>]+aria-label="Searched the web · 1 search · 2 sources. Show search queries"/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /fui-shimmer-text/);
  const open = renderToStaticMarkup(
    <SearchStepsDisclosure
      defaultOpen
      phase="searching"
      steps={[{ type: "open_page", url: "https://example.com/page" }]}
    />,
  );
  assert.match(open, /Searching the web…/);
  assert.match(open, /<a class="fui-search-step-head" href="https:\/\/example.com\/page"/);
  assert.match(open, /Read page/);
  const timeline = renderToStaticMarkup(
    <SearchStepList
      live
      steps={[
        { type: "search", query: "moon phases", sources: ["https://a.example/one", "https://a.example/one", "https://b.example/two"] },
        { type: "search", query: "lunar eclipse", sources: [] },
      ]}
    />,
  );
  assert.match(timeline, /Searched web/);
  assert.match(timeline, /<span class="fui-search-step-count">2<\/span>/);
  assert.match(timeline, /aria-expanded="false"/);
  assert.equal(timeline.match(/fui-shimmer-text/g)?.length, 1);
  assert.match(timeline, /data-last="true"/);
  const page = renderToStaticMarkup(
    <SearchStepList
      steps={[{ type: "open_page", url: "https://en.wikipedia.org/wiki/Lunar_phase", sources: ["https://en.wikipedia.org/wiki/Lunar_phase"] }]}
      titleFor={() => "Lunar phase - Wikipedia"}
    />,
  );
  assert.match(page, /<a class="fui-search-step-head" href="https:\/\/en.wikipedia.org\/wiki\/Lunar_phase"/);
  assert.match(page, /Lunar phase - Wikipedia/);
  assert.doesNotMatch(page, /fui-search-step-count/);
});

test("reasoning opens while streaming and reports duration when done", () => {
  const live = renderToStaticMarkup(
    <ReasoningDisclosure streaming>
      <p>step one</p>
    </ReasoningDisclosure>,
  );
  assert.match(live, /aria-expanded="true"/);
  assert.match(live, /Thinking…/);
  assert.match(live, /step one/);
  const done = renderToStaticMarkup(
    <ReasoningDisclosure durationSeconds={7}>
      <p>step one</p>
    </ReasoningDisclosure>,
  );
  assert.match(done, /Thought for 7s/);
  assert.match(done, /aria-expanded="false"/);
  const pending = renderToStaticMarkup(<ReasoningDisclosure defaultOpen={false} streaming />);
  assert.doesNotMatch(pending, /<button/);
});

test("attachment helpers", () => {
  assert.equal(attachmentCategory("image/png"), "image");
  assert.equal(attachmentCategory("application/pdf"), "document");
  assert.equal(attachmentCategory(""), "unknown");
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(1536), "1.5 KB");
  assert.equal(formatBytes(5 * 1024 * 1024), "5 MB");
  assert.equal(formatBytes(undefined), "");
  assert.equal(attachmentDetail({ id: "a", name: "r.pdf", mediaType: "application/pdf", size: 2048 }), "PDF · 2 KB");
});

test("attachments render variants, states and named remove buttons", () => {
  const html = renderToStaticMarkup(
    <Attachments
      items={[
        { id: "1", name: "photo.png", mediaType: "image/png", url: "/p.png", size: 1024 },
        { id: "2", name: "notes.txt", mediaType: "text/plain", status: "uploading" },
        { id: "3", name: "clip.mov", mediaType: "video/quicktime", status: "error", error: "Too large" },
      ]}
      onRemove={() => {}}
    />,
  );
  assert.match(html, /<ul aria-label="Attachments" class="fui-attachments" data-variant="inline"/);
  assert.match(html, /aria-label="Remove photo.png"/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /aria-label="Uploading notes.txt"/);
  assert.match(html, /data-status="error"/);
  assert.match(html, /role="alert">Too large</);
  assert.equal(renderToStaticMarkup(<Attachments items={[]} />), "");
  assert.match(renderToStaticMarkup(<Attachments empty="No files" items={[]} />), /No files/);
  const grid = renderToStaticMarkup(
    <AttachmentChip item={{ id: "1", name: "photo.png", mediaType: "image/png", url: "/p.png" }} variant="grid" />,
  );
  assert.match(grid, /<img alt="photo.png"/);
  assert.doesNotMatch(grid, /fui-attachment-remove/);
});

test("dictation helpers", () => {
  assert.equal(formatElapsed(0), "0:00");
  assert.equal(formatElapsed(65_400), "1:05");
  assert.deepEqual(insertDictation("hello", 5, 5, "world"), { value: "hello world", caret: 11 });
  assert.deepEqual(insertDictation("ab", 1, 1, " x "), { value: "a x b", caret: 3 });
  assert.equal(pickRecorderMimeType((type) => type === "audio/mp4"), "audio/mp4");
  assert.equal(pickRecorderMimeType(undefined), undefined);
  assert.match(describeMicError({ name: "NotAllowedError" }), /blocked/);
  assert.match(describeMicError(new Error("x")), /Couldn't start/);
});

test("voice input is hidden during SSR and the view covers each state", () => {
  assert.equal(
    renderToStaticMarkup(<VoiceInputButton onRecorded={async () => ""} onTranscript={() => {}} />),
    "",
  );
  const idle = renderToStaticMarkup(<VoiceInputButtonView status="idle" />);
  assert.match(idle, /aria-label="Dictate"/);
  assert.match(idle, /aria-pressed="false"/);
  const recording = renderToStaticMarkup(<VoiceInputButtonView elapsedMs={4200} level={0.5} status="recording" />);
  assert.match(recording, /aria-label="Stop recording"/);
  assert.match(recording, /aria-pressed="true"/);
  assert.match(recording, /0:04/);
  assert.match(recording, /--fui-voice-level:0.500/);
  const transcribing = renderToStaticMarkup(<VoiceInputButtonView status="transcribing" />);
  assert.match(transcribing, /aria-busy="true"/);
  assert.match(transcribing, /Transcribing…/);
  const error = renderToStaticMarkup(<VoiceInputButtonView error="No microphone was found." status="error" />);
  assert.match(error, /data-status="error"/);
  assert.match(error, /role="status">No microphone was found.</);
});

test("chat message separates the user bubble from the assistant column", () => {
  const user = renderToStaticMarkup(
    <ChatMessage
      actions={
        <MessageActions>
          <CopyMessageAction text="hi" />
          <MessageAction label="Edit">
            <svg />
          </MessageAction>
          <MessageTimestamp dateTime="2026-09-26T10:00:00Z" label="10:00" />
        </MessageActions>
      }
      from="user"
    >
      hi
    </ChatMessage>,
  );
  assert.match(user, /class="fui-chat-message" data-role="user"/);
  assert.match(user, /fui-chat-message-body">hi</);
  assert.match(user, /aria-label="Copy"/);
  assert.match(user, /aria-label="Edit"/);
  assert.match(user, /<time class="fui-message-time" datetime="2026-09-26T10:00:00Z">10:00<\/time>/i);
  const assistant = renderToStaticMarkup(
    <ChatMessage from="assistant" pinActions>
      answer
    </ChatMessage>,
  );
  assert.match(assistant, /data-pin-actions="true" data-role="assistant"/);
});

test("composer shell labels the textarea and switches send to stop while busy", () => {
  const ready = renderToStaticMarkup(<ChatComposer label="Message Puck" onSubmit={() => {}} value="" />);
  assert.match(ready, /<form[^>]+data-status="ready"/);
  assert.match(ready, /<textarea[^>]+aria-label="Message Puck"/);
  assert.match(ready, /aria-label="Send message"/);
  assert.match(ready, /disabled=""/);
  const filled = renderToStaticMarkup(<ChatComposer onSubmit={() => {}} value="Hi" />);
  assert.doesNotMatch(filled, /<button[^>]+disabled/);
  const streaming = renderToStaticMarkup(
    <ChatComposer onStop={() => {}} onSubmit={() => {}} status="streaming" value="" />,
  );
  assert.match(streaming, /aria-label="Stop"/);
  assert.doesNotMatch(streaming, /Send message/);
  const queue = renderToStaticMarkup(
    <ChatComposer onStop={() => {}} onSubmit={() => {}} queueWhileBusy status="streaming" value="next" />,
  );
  assert.match(queue, /aria-label="Queue message"/);
  const slots = renderToStaticMarkup(
    <ChatComposer attachments={<span>files</span>} footer="Hint" onSubmit={() => {}} tools={<span>tools</span>} trailing={<span>mic</span>} />,
  );
  assert.match(slots, /fui-composer-attachments"><span>files/);
  assert.match(slots, /fui-composer-tools"><span>tools/);
  assert.match(slots, /fui-composer-actions"><span>mic/);
  assert.match(slots, /fui-composer-footer">Hint/);
});
