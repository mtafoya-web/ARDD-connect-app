import { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, Maximize2, Sparkles, Bot } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getBotIntents, queryBot } from '../services/botService';
import type { BotIntent, BotReply } from '../types';

type BotTurn =
  | { role: 'user'; text: string }
  | { role: 'bot'; reply: BotReply };

export const BotPanel = () => {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [turns, setTurns] = useState<BotTurn[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [intents, setIntents] = useState<BotIntent[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    getBotIntents()
      .then(setIntents)
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  // Greeting on open
  useEffect(() => {
    if (isOpen && turns.length === 0 && user) {
      const honorifics = new Set(['dr.', 'dr', 'prof.', 'prof', 'professor', 'mr.', 'ms.', 'mrs.']);
      const tokens = (user.full_name || user.username).split(/\s+/).filter(Boolean);
      const firstName = tokens.find((t) => !honorifics.has(t.toLowerCase())) || user.username;
      setTurns([
        {
          role: 'bot',
          reply: {
            intent: 'help',
            response: `Hi ${firstName} — I'm the ARDD Claw Bot. Ask me about the program, your matches, or share a quick impression.`,
            attachments: [],
          },
        },
      ]);
    }
  }, [isOpen, user, turns.length]);

  const submit = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setTurns((t) => [...t, { role: 'user', text: trimmed }]);
    setInput('');
    setPending(true);
    try {
      const reply = await queryBot(trimmed);
      setTurns((t) => [...t, { role: 'bot', reply }]);
    } catch (err: any) {
      setTurns((t) => [
        ...t,
        {
          role: 'bot',
          reply: {
            intent: 'help',
            response:
              err.response?.status === 401
                ? 'Please sign in to use the Claw Bot.'
                : 'Something went wrong. Try one of the quick replies below.',
            attachments: [],
          },
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  if (!token || !user) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start">
      {isOpen && (
        <div
          className={`mb-4 flex flex-col overflow-hidden rounded-2xl border border-border-secondary bg-surface shadow-2xl transition-all ${
            isMinimized ? 'h-14 w-72' : 'h-[520px] w-[400px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-secondary bg-accent p-3 text-foreground-inverse">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground-inverse/15">
                <Bot size={16} />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold">ARDD Claw Bot</p>
                <p className="text-[10px] uppercase tracking-wider opacity-70">context-aware · deterministic</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMinimized((v) => !v)} className="hover:opacity-80" aria-label="Minimize">
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:opacity-80" aria-label="Close">
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto bg-canvas p-4">
                {turns.map((t, i) =>
                  t.role === 'user' ? (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-sm text-foreground-inverse">
                        {t.text}
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex justify-start">
                      <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-border-secondary bg-surface px-3 py-2 text-sm text-foreground-primary">
                        <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-foreground-tertiary">
                          <Sparkles size={11} className="text-accent" />
                          {t.reply.intent.replace(/_/g, ' ')}
                        </div>
                        <p className="leading-6">{t.reply.response}</p>
                        {(t.reply.attachments || [])
                          .filter((a) => a.type === 'session' && a.session)
                          .map((a, j) => (
                            <a
                              key={j}
                              href={`/events/${a.session!.id}`}
                              className="mt-2 block rounded-md border border-accent/20 bg-accent-soft/60 p-2 text-xs leading-5 text-foreground-primary hover:bg-accent-soft"
                            >
                              <p className="font-bold">{a.session!.title}</p>
                              {a.session!.start_date && (
                                <p className="mt-0.5 text-foreground-secondary">
                                  {new Date(a.session!.start_date).toLocaleString(undefined, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                  {(a.session!.room || a.session!.location) &&
                                    ` · ${a.session!.room || a.session!.location}`}
                                </p>
                              )}
                            </a>
                          ))}
                      </div>
                    </div>
                  ),
                )}
                {pending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm border border-border-secondary bg-surface px-3 py-2 text-sm text-foreground-tertiary">
                      Thinking…
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick reply chips */}
              {intents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-t border-border-secondary bg-surface px-3 py-2">
                  {intents
                    .filter((i) => i.intent !== 'help')
                    .map((i) => (
                      <button
                        key={i.intent}
                        type="button"
                        onClick={() => submit(i.sample)}
                        disabled={pending}
                        className="rounded-full border border-border-secondary bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-foreground-secondary hover:border-accent/40 hover:text-accent disabled:opacity-50"
                      >
                        {i.label}
                      </button>
                    ))}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit(input);
                }}
                className="flex gap-2 border-t border-border-secondary bg-surface p-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the Claw Bot…"
                  disabled={pending}
                  className="flex-1 rounded-full border border-border-secondary bg-surface-muted px-4 py-1.5 text-sm text-foreground-primary placeholder:text-foreground-tertiary outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/15"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || pending}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-foreground-inverse shadow-sm hover:bg-accent-hover disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-foreground-inverse shadow-lg transition hover:scale-105 hover:bg-accent-hover focus:outline-none focus:ring-4 focus:ring-accent/25"
          aria-label="Open ARDD Claw Bot"
        >
          <Bot size={24} />
        </button>
      )}
    </div>
  );
};
