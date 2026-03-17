"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import type { AnnotatedVariant, CopilotResponse } from "~/utils/panel-api";

interface Message {
  role: "user" | "assistant";
  content: string;
  tokens?: { in: number; out: number };
}

interface CopilotChatProps {
  annotatedVariants: AnnotatedVariant[];
  panelName?: string | null;
  onAsk: (
    question: string,
    history: Array<{ role: "user" | "assistant"; content: string }>
  ) => Promise<CopilotResponse>;
}

const SUGGESTED_QUESTIONS = [
  "Which two variants should we validate first in the lab and why?",
  "Which pathways look most disrupted in this patient?",
  "What RNA splicing assays are recommended for the High priority variants?",
  "How does the splice risk relate to the Evo2 delta score for the top variant?",
];

export function CopilotChat({ annotatedVariants, panelName, onAsk }: CopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function sendMessage(question: string) {
    if (!question.trim() || isLoading) return;

    setError(null);
    const userMsg: Message = { role: "user", content: question };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput("");
    setIsLoading(true);

    try {
      const response = await onAsk(
        question,
        messages.map((m) => ({ role: m.role, content: m.content }))
      );
      const assistantContent = response.answer ?? response.report_markdown ?? "(No response)";
      setMessages([
        ...updatedHistory,
        {
          role: "assistant",
          content: assistantContent,
          tokens: { in: response.input_tokens, out: response.output_tokens },
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get a response");
      // Remove the optimistically added user message on error
      setMessages(messages);
    } finally {
      setIsLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  const highCount = annotatedVariants.filter((av) => av.composite?.priority === "High").length;
  const medCount  = annotatedVariants.filter((av) => av.composite?.priority === "Medium").length;

  return (
    <Card className="w-full border border-[#3c4f3d]/20 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-[#3c4f3d] text-base font-semibold flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Ask the Co-Pilot
        </CardTitle>
        <p className="text-xs text-[#3c4f3d]/60">
          {panelName ?? "Panel"} · {annotatedVariants.length} variants ·{" "}
          {highCount} High, {medCount} Medium priority
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Suggested questions (only shown before first message) */}
        {messages.length === 0 && (
          <div>
            <p className="text-xs text-[#3c4f3d]/50 mb-2 uppercase tracking-wide">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => void sendMessage(q)}
                  disabled={isLoading}
                  className="rounded-full border border-[#3c4f3d]/20 px-3 py-1 text-xs text-[#3c4f3d]
                             hover:bg-[#3c4f3d]/10 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message thread */}
        {messages.length > 0 && (
          <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-xl px-4 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#3c4f3d] text-white rounded-br-sm"
                      : "bg-[#e9eeea] text-[#3c4f3d]/90 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                  {msg.tokens && (
                    <p className="text-[10px] opacity-50 mt-1 text-right">
                      {msg.tokens.in} in / {msg.tokens.out} out tokens
                    </p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#e9eeea] rounded-xl rounded-bl-sm px-4 py-2.5">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="inline-block w-1.5 h-1.5 rounded-full bg-[#3c4f3d]/40 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-[#de8246]/80 border border-[#de8246]/20 rounded px-2 py-1 bg-[#de8246]/5">
          FOR RESEARCH USE ONLY — responses do not constitute clinical advice.
        </p>

        {/* Input */}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            rows={2}
            placeholder="Ask a question about this panel… (Enter to send, Shift+Enter for newline)"
            disabled={isLoading}
            className="flex-1 resize-none rounded-md border border-[#3c4f3d]/20 bg-white px-3 py-2
                       text-sm focus:outline-none focus:ring-2 focus:ring-[#3c4f3d]/40
                       disabled:opacity-50"
          />
          <Button
            onClick={() => void sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="self-end bg-[#3c4f3d] hover:bg-[#3c4f3d]/90 text-white shrink-0"
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
