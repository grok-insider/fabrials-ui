"use client";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/external/magicui/terminal"

/*
 * Terminal demo from Magic UI (https://magicui.design), MIT.
 * Distributed unchanged by ui.fabrials.com under the same license.
 *
 * MIT License
 *
 * Copyright (c) Magic UI
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export default function TerminalDemo() {
  return (
    <Terminal>
      <TypingAnimation>&gt; pnpm dlx shadcn@latest init</TypingAnimation>

      <AnimatedSpan className="text-green-500">
        ✔ Preflight checks.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Verifying framework. Found Next.js.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Validating Tailwind CSS.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Validating import alias.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Writing components.json.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Checking registry.
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Updating tailwind.config.ts
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Updating app/globals.css
      </AnimatedSpan>

      <AnimatedSpan className="text-green-500">
        ✔ Installing dependencies.
      </AnimatedSpan>

      <AnimatedSpan className="text-blue-500">
        <span>ℹ Updated 1 file:</span>
        <span className="pl-2">- lib/utils.ts</span>
      </AnimatedSpan>

      <TypingAnimation className="text-muted-foreground">
        Success! Project initialization completed.
      </TypingAnimation>

      <TypingAnimation className="text-muted-foreground">
        You may now add components.
      </TypingAnimation>
    </Terminal>
  )
}
