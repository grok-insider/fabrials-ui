import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Avatar, AvatarFallback, AvatarGroup, avatarTint } from "../../packages/ui/src/index";

const styles = readFileSync(new URL("../../packages/ui/src/styles.css", import.meta.url), "utf8");
const rule = (selector: string) => {
  const at = styles.indexOf(selector);
  assert.ok(at >= 0, `missing rule ${selector}`);
  return styles.slice(at, styles.indexOf("}", at) + 1);
};

test("initials pick one of five hues from themselves: the same text, the same hue, on the server and in the browser", () => {
  assert.deepEqual(["AL", "KN", "PS", "RK", "LF"].map(avatarTint), [3, 2, 1, 4, 5]);
  assert.equal(avatarTint(" al "), avatarTint("AL"));
  const counts = [0, 0, 0, 0, 0];
  for (let a = 65; a <= 90; a += 1) for (let b = 65; b <= 90; b += 1) counts[avatarTint(String.fromCharCode(a, b)) - 1]! += 1;
  assert.ok(Math.min(...counts) > 120 && Math.max(...counts) < 150, `the hues share the pairs of letters evenly: ${counts}`);
  const fallback = (element: React.ReactElement) => renderToStaticMarkup(<Avatar>{element}</Avatar>);
  assert.match(fallback(<AvatarFallback>KN</AvatarFallback>), /data-tint="2"/);
  assert.doesNotMatch(fallback(<AvatarFallback tint={false}>KN</AvatarFallback>), /data-tint/);
  assert.doesNotMatch(fallback(<AvatarFallback>{" "}</AvatarFallback>), /data-tint/);
});

test("a group sizes the avatars in it unless they have their own size, and a count of one shows the face", () => {
  const group = renderToStaticMarkup(
    <AvatarGroup size="sm">
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>KN</AvatarFallback>
      </Avatar>
    </AvatarGroup>,
  );
  assert.deepEqual([...group.matchAll(/data-slot="avatar" data-size="(\w+)"/g)].map((match) => match[1]), ["sm", "lg"]);
  assert.match(renderToStaticMarkup(<Avatar>x</Avatar>), /data-size="md"/);
  const faces = (count: number, max: number) =>
    renderToStaticMarkup(
      <AvatarGroup max={max}>
        {Array.from({ length: count }, (_, index) => (
          <Avatar key={index}>
            <AvatarFallback>{`P${index}`}</AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>,
    );
  assert.equal((faces(4, 3).match(/data-slot="avatar"/g) ?? []).length, 4);
  assert.doesNotMatch(faces(4, 3), /\+1/);
  assert.equal((faces(5, 3).match(/data-slot="avatar"/g) ?? []).length, 3);
  assert.match(faces(5, 3), /aria-label="2 more" role="img">\+2</);
});

test("a tinted fallback is painted from its hue; the ring and a badge's edge are the surface's colour, a card's inside a card", () => {
  const paint = rule(".fui-avatar-fallback[data-tint] {");
  assert.match(paint, /--fui-avatar-ink: var\(--fui-avatar-tint, var\(--fui-avatar-hue\)\);/);
  assert.match(paint, /background: color-mix\(in oklab, var\(--fui-avatar-ink\) var\(--fui-tint-edge\), var\(--card\)\);/);
  for (const n of [1, 2, 3, 4, 5]) assert.match(rule(`.fui-avatar-fallback[data-tint="${n}"] {`), new RegExp(`--fui-avatar-hue: var\\(--chart-${n}\\);`));
  assert.match(rule(".fui-avatar-group > .fui-avatar {"), /box-shadow: 0 0 0 2px var\(--fui-avatar-ring, var\(--background\)\);/);
  assert.match(rule(".fui-avatar-badge {"), /border: 2px solid var\(--fui-avatar-ring, var\(--background\)\);/);
  assert.match(styles, /\.fui-card \{\s*--fui-avatar-ring: var\(--card\);/);
});
