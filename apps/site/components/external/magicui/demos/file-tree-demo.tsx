"use client";
import { Tree } from "@/components/external/magicui/file-tree"
import type { TreeViewElement } from "@/components/external/magicui/file-tree"

/*
 * File Tree demo from Magic UI (https://magicui.design), MIT.
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
export default function FileTreeDemo() {
  return (
    <div className="bg-background relative flex h-[300px] w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-lg border">
      <Tree
        className="bg-background overflow-hidden rounded-md p-2"
        initialSelectedId="button"
        initialExpandedItems={["src", "app", "components", "ui", "lib"]}
        elements={ELEMENTS}
      />
    </div>
  )
}

const ELEMENTS: TreeViewElement[] = [
  {
    id: "src",
    type: "folder",
    isSelectable: true,
    name: "src",
    children: [
      {
        id: "lib",
        type: "folder",
        isSelectable: true,
        name: "lib",
        children: [
          {
            id: "utils",
            isSelectable: true,
            name: "utils.ts",
          },
        ],
      },
      {
        id: "app",
        type: "folder",
        isSelectable: true,
        name: "app",
        children: [
          {
            id: "page",
            isSelectable: true,
            name: "page.tsx",
          },
          {
            id: "layout",
            isSelectable: true,
            name: "layout.tsx",
          },
        ],
      },
      {
        id: "components",
        type: "folder",
        isSelectable: true,
        name: "components",
        children: [
          {
            id: "header",
            isSelectable: true,
            name: "header.tsx",
          },
          {
            id: "ui",
            type: "folder",
            isSelectable: true,
            name: "ui",
            children: [
              {
                id: "button",
                isSelectable: true,
                name: "button.tsx",
              },
            ],
          },
          {
            id: "footer",
            isSelectable: true,
            name: "footer.tsx",
          },
        ],
      },
    ],
  },
]
