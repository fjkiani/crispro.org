import { useState, useRef, useEffect } from 'react';
import type { AnnotatedVariant, ChatMessage, CopilotMode } from '../types/triage';
import { generateReport, chatWithCopilot } from '../api/evo2Api';
import './CopilotPanel.css';

interface Props {
  variants: AnnotatedVariant[];
  panelName?: string;
}

const SUGGESTED_QUESTIONS = [
  'Which variants should we validate first?',
  'Which pathways look most disrupted?',
  'What RNA splicing assays are recommended?',
  'Are any variants actionable for targeted therapy?',
];

/** Minimal markdown → HTML conversion (bold, headers, bullet lists, line breaks) */
function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)(\n<li>)/g, '$1$2') // consecutive li
    .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>') // wrap single li
    .replace(/<\/ul>\n<ul>/g, '') // merge consecutive lists
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(.+)$/, '<p>$1</p>');
}

export default function CopilotPanel({ variants, panelName }: Props) {
  const [activeReportMode, setActiveReportMode] = useState<Exclude<CopilotMode, 'followup_qa'> | null>(null);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleGenerateReport(mode: Exclude<CopilotMode, 'followup_qa'>) {
    setActiveReportMode(mode);
    setReportLoading(true);
    setReportError(null);
    setReportHtml(null);
    try {
      const res = await generateReport(variants, mode, panelName);
      const md = res.report_markdown ?? '';
      setReportHtml(renderMarkdown(md));
    } catch (e) {
      setReportError(e instanceof Error ? e.message : 'Report generation failed');
    } finally {
      setReportLoading(false);
    }
  }

  async function handleSendMessage(text?: string) {
    const q = (text ?? chatInput).trim();
    if (!q) return;
    setChatInput('');
    setChatError(null);

    const userMsg: ChatMessage = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const history: ChatMessage[] = [...messages, userMsg];
      const res = await chatWithCopilot(variants, q, history, panelName);
      const answer = res.answer ?? res.report_markdown ?? '';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
          input_tokens: res.input_tokens,
          output_tokens: res.output_tokens,
        },
      ]);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : 'Chat request failed');
      setMessages((prev) => prev.slice(0, -1)); // remove optimistic user message
    } finally {
      setChatLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  function handleCopyReport() {
    if (!reportHtml) return;
    const text = reportHtml.replace(/<[^>]+>/g, '');
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function handlePrintReport() {
    window.print();
  }

  return (
    <div className="copilot-panel">
      {/* Reports section */}
      <div className="copilot-reports glass">
        <div className="copilot-section-header">
          <div className="copilot-section-icon">📋</div>
          <div>
            <h3 className="copilot-section-title">AI Reports</h3>
            <p className="copilot-section-desc">
              Generate a structured report powered by Claude AI.
            </p>
          </div>
        </div>

        <div className="copilot-report-btns">
          <button
            className={`copilot-report-btn${activeReportMode === 'triage_report' ? ' copilot-report-btn--active' : ''}`}
            onClick={() => handleGenerateReport('triage_report')}
            disabled={reportLoading}
          >
            {reportLoading && activeReportMode === 'triage_report' ? (
              <span className="copilot-spinner" />
            ) : '📊'}{' '}
            Triage Report
          </button>
          <button
            className={`copilot-report-btn${activeReportMode === 'tumor_board' ? ' copilot-report-btn--active' : ''}`}
            onClick={() => handleGenerateReport('tumor_board')}
            disabled={reportLoading}
          >
            {reportLoading && activeReportMode === 'tumor_board' ? (
              <span className="copilot-spinner" />
            ) : '🏥'}{' '}
            Tumor Board Note
          </button>
        </div>

        {reportLoading && (
          <div className="copilot-report-loading">
            <span className="copilot-spinner copilot-spinner--lg" />
            <span>Generating report with Claude AI…</span>
          </div>
        )}

        {reportError && (
          <div className="copilot-error">{reportError}</div>
        )}

        {reportHtml && !reportLoading && (
          <div className="copilot-report-output fade-up">
            <div className="copilot-report-actions">
              <button className="copilot-action-btn" onClick={handleCopyReport}>
                Copy
              </button>
              <button className="copilot-action-btn" onClick={handlePrintReport}>
                Print / Export
              </button>
            </div>
            <div
              className="copilot-report-content"
              dangerouslySetInnerHTML={{ __html: reportHtml }}
            />
            <div className="copilot-disclaimer">
              ⚠ For research and educational purposes only. Not for clinical decision-making.
            </div>
          </div>
        )}
      </div>

      {/* Chat section */}
      <div className="copilot-chat glass">
        <div className="copilot-section-header">
          <div className="copilot-section-icon">💬</div>
          <div>
            <h3 className="copilot-section-title">Ask the Co-Pilot</h3>
            <p className="copilot-section-desc">
              Ask follow-up questions about your triage panel.
            </p>
          </div>
        </div>

        {/* Suggested questions (shown before first message) */}
        {messages.length === 0 && !chatLoading && (
          <div className="copilot-suggestions">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                className="copilot-suggestion-btn"
                onClick={() => handleSendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Message thread */}
        {messages.length > 0 && (
          <div className="copilot-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`copilot-message copilot-message--${msg.role}`}
              >
                <div className="copilot-message-label">
                  {msg.role === 'user' ? 'You' : 'Co-Pilot'}
                </div>
                {msg.role === 'assistant' ? (
                  <div
                    className="copilot-message-content copilot-message-content--md"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                ) : (
                  <div className="copilot-message-content">{msg.content}</div>
                )}
                {msg.role === 'assistant' && (msg.input_tokens || msg.output_tokens) ? (
                  <div className="copilot-message-tokens">
                    {msg.input_tokens ? `↑ ${msg.input_tokens} in` : ''}
                    {msg.input_tokens && msg.output_tokens ? ' · ' : ''}
                    {msg.output_tokens ? `↓ ${msg.output_tokens} out` : ''}
                  </div>
                ) : null}
              </div>
            ))}
            {chatLoading && (
              <div className="copilot-message copilot-message--assistant">
                <div className="copilot-message-label">Co-Pilot</div>
                <div className="copilot-thinking">
                  <span className="copilot-dot" />
                  <span className="copilot-dot" />
                  <span className="copilot-dot" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {chatError && <div className="copilot-error">{chatError}</div>}

        {/* Input */}
        <div className="copilot-input-row">
          <textarea
            className="copilot-input"
            placeholder="Ask about variants, pathways, actionability… (Enter to send)"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={chatLoading}
          />
          <button
            className="copilot-send-btn"
            onClick={() => handleSendMessage()}
            disabled={chatLoading || !chatInput.trim()}
          >
            {chatLoading ? <span className="copilot-spinner" /> : '→'}
          </button>
        </div>
        <p className="copilot-input-hint">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
