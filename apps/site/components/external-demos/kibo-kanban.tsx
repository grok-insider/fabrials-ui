"use client";
// Preview written by Fabrials for Kibo UI's kanban (Kibo publishes no demo). Synthetic tasks.
import { useState } from "react";
import { KanbanBoard, KanbanCard, KanbanCards, KanbanHeader, KanbanProvider } from "@/components/external/kibo/kanban";

const columns = [
  { id: "backlog", name: "Backlog" },
  { id: "doing", name: "In progress" },
  { id: "done", name: "Done" },
];

const initial = [
  { id: "t1", name: "Price the Grok Build session log", column: "backlog" },
  { id: "t2", name: "Add a shim for the select", column: "backlog" },
  { id: "t3", name: "Review the Magic UI snapshot", column: "doing" },
  { id: "t4", name: "Fill the Usage AI band", column: "doing" },
  { id: "t5", name: "Retint Radiant to Highstorm", column: "done" },
];

export default function KiboKanbanDemo() {
  const [data, setData] = useState(initial);
  return (
    <KanbanProvider columns={columns} data={data} onDataChange={setData} className="min-h-72 w-full">
      {(column) => (
        <KanbanBoard id={column.id} key={column.id}>
          <KanbanHeader>{column.name}</KanbanHeader>
          <KanbanCards id={column.id}>
            {(task: (typeof initial)[number]) => (
              <KanbanCard column={column.id} id={task.id} key={task.id} name={task.name}>
                <p className="text-sm">{task.name}</p>
              </KanbanCard>
            )}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  );
}
