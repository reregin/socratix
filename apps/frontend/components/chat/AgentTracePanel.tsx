"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  SkipForward,
  XCircle,
} from "lucide-react";
import type {
  ChatStreamDebugEvent,
  ChatStreamDebugStatus,
} from "@/../../packages/shared-types/src/chat-stream";

interface AgentTracePanelProps {
  events: ChatStreamDebugEvent[];
  isLoading: boolean;
}

interface AgentTraceGroup {
  agent: string;
  status: ChatStreamDebugStatus;
  label: string;
  input?: unknown;
  output?: unknown;
  reason?: string;
  error?: string;
  firstSeen: string;
  updatedAt: string;
  eventCount: number;
}

export default function AgentTracePanel({
  events,
  isLoading,
}: AgentTracePanelProps) {
  const [open, setOpen] = useState(true);
  const groups = useMemo(() => groupTraceEvents(events), [events]);

  if (!isLoading && events.length === 0) {
    return null;
  }

  const latest = events.at(-1);
  const completedCount = groups.filter((group) => group.status === "completed").length;
  const activeLabel = latest?.label ?? "Waiting for agent trace...";

  return (
    <section className="border-t border-[#E8E8F0] bg-white px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 text-left"
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: isLoading ? "#F0ECFF" : "#E6FFF9" }}
        >
          <BrainCircuit
            size={18}
            className={isLoading ? "animate-pulse text-[#7C5CFC]" : "text-[#00A88B]"}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-[#1E1B4B]">
              Thinking mode
            </h3>
            <span className="rounded-full bg-[#FAFBFF] px-2 py-0.5 text-[10px] font-bold text-[#64748B]">
              {completedCount}/{groups.length || 1} agents
            </span>
          </div>
          <p className="truncate text-xs font-semibold text-[#64748B]">
            {activeLabel}
          </p>
        </div>
        {open ? (
          <ChevronDown size={18} className="text-[#64748B]" />
        ) : (
          <ChevronRight size={18} className="text-[#64748B]" />
        )}
      </button>

      {open && (
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
          {groups.map((group) => (
            <AgentTraceRow key={group.agent} group={group} />
          ))}
        </div>
      )}
    </section>
  );
}

function AgentTraceRow({ group }: { group: AgentTraceGroup }) {
  const style = statusStyle(group.status);
  const Icon = style.icon;

  return (
    <details className="rounded-lg border border-[#E8E8F0] bg-[#FAFBFF]">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: style.background, color: style.color }}
        >
          <Icon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold text-[#1E1B4B]">
            {group.agent}
          </p>
          <p className="truncate text-[11px] font-semibold text-[#64748B]">
            {group.reason ?? group.label}
          </p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-extrabold"
          style={{ background: style.background, color: style.color }}
        >
          {statusLabel(group.status)}
        </span>
      </summary>

      <div className="space-y-2 border-t border-[#E8E8F0] px-3 py-3">
        <JsonBlock label="Input" value={group.input} />
        <JsonBlock label="Output" value={group.output} />
        {group.error && <JsonBlock label="Error" value={group.error} />}
      </div>
    </details>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  if (value === undefined) {
    return null;
  }

  return (
    <div>
      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7C5CFC]">
        {label}
      </p>
      <pre className="max-h-44 overflow-auto rounded-lg border border-[#E8E8F0] bg-white p-3 text-[11px] leading-relaxed text-[#1E1B4B]">
        {formatJson(value)}
      </pre>
    </div>
  );
}

function groupTraceEvents(events: ChatStreamDebugEvent[]): AgentTraceGroup[] {
  const map = new Map<string, AgentTraceGroup>();

  for (const event of events) {
    const existing = map.get(event.agent);
    const group =
      existing ??
      ({
        agent: event.agent,
        status: event.status,
        label: event.label,
        firstSeen: event.timestamp,
        updatedAt: event.timestamp,
        eventCount: 0,
      } satisfies AgentTraceGroup);

    group.status = event.status;
    group.label = event.label;
    group.updatedAt = event.timestamp;
    group.eventCount += 1;

    if (event.input !== undefined) {
      group.input = event.input;
    }

    if (event.output !== undefined) {
      group.output = event.output;
    }

    if (event.reason) {
      group.reason = event.reason;
    }

    if (event.error) {
      group.error = event.error;
    }

    map.set(event.agent, group);
  }

  return Array.from(map.values()).sort(
    (a, b) => Date.parse(a.firstSeen) - Date.parse(b.firstSeen),
  );
}

function statusStyle(status: ChatStreamDebugStatus) {
  if (status === "completed") {
    return { icon: CheckCircle2, background: "#E6FFF9", color: "#008F77" };
  }

  if (status === "failed") {
    return { icon: XCircle, background: "#FEF2F2", color: "#DC2626" };
  }

  if (status === "invalid_output") {
    return { icon: AlertTriangle, background: "#FFF8EB", color: "#B45309" };
  }

  if (status === "skipped") {
    return { icon: SkipForward, background: "#F1F5F9", color: "#64748B" };
  }

  return { icon: CircleDashed, background: "#F0ECFF", color: "#7C5CFC" };
}

function statusLabel(status: ChatStreamDebugStatus): string {
  return status.replace(/_/g, " ");
}

function formatJson(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}
