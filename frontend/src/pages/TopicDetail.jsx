import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  MessageSquare,
  Clock,
  Send,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { useModerator } from '../hooks/useModerator';
import ModerationWarning from '../components/ModerationWarning';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} ${days === 1 ? 'giorno' : 'giorni'} fa`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'ora' : 'ore'} fa`;
  return `${minutes} min fa`;
}

const AVATAR_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#14b8a6',
];

function Avatar({ initials, userId, size = 10 }) {
  const color = AVATAR_COLORS[(userId - 1) % AVATAR_COLORS.length];
  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`;
  const fontSize = size >= 10 ? '0.875rem' : '0.7rem';
  return (
    <div className={cls} style={{ background: color, fontSize }}>
      {initials}
    </div>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────
function PostCard({ author, userId, content, timestamp, isOriginal, category }) {
  return (
    <div
      className="bg-surface border border-slate-700/50 rounded-2xl p-6"
      style={isOriginal ? { borderColor: 'rgba(99,102,241,0.3)' } : {}}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Avatar initials={author?.avatar || '??'} userId={userId} size={10} />
          <div>
            <div className="font-semibold text-white">{author?.username || 'Anonimo'}</div>
            {isOriginal && category && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 inline-block"
                style={{ background: `${category.color}22`, color: category.color }}
              >
                {category.icon} {category.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 pt-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeAgo(timestamp)}</span>
        </div>
      </div>

      {/* Body */}
      <p className="text-gray-200 leading-relaxed text-sm whitespace-pre-wrap">
        {content}
      </p>

      {/* Original post label */}
      {isOriginal && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <span className="text-xs px-2 py-0.5 rounded-full text-primary bg-primary/10 font-medium">
            📌 Post originale
          </span>
        </div>
      )}
    </div>
  );
}

// ── ReplyCard ─────────────────────────────────────────────────────────────────
function ReplyCard({ reply, author, index }) {
  return (
    <div className="flex gap-4 group">
      {/* Thread line */}
      <div className="flex flex-col items-center">
        <Avatar initials={author?.avatar || '??'} userId={reply.author_id} size={9} />
        <div className="w-px flex-1 mt-2 bg-slate-700/50 group-last:hidden" />
      </div>

      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-white text-sm">
            {author?.username || 'Anonimo'}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="text-slate-600">#{index + 1}</span>
            <Clock className="w-3 h-3" />
            <span>{timeAgo(reply.timestamp)}</span>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl px-4 py-3">
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {reply.content}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TopicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { strikes, isBanned, checkContent, addStrikeAndGetStatus, MAX_STRIKES } = useModerator();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState([]);

  // Reply form state
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Moderation warning state
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningData, setWarningData] = useState(null);

  // ── Fetch topic data ──────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/community/topic/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((json) => {
        setData(json);
        setReplies(json.replies || []);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getUserById = useCallback(
    (uid) => data?.users?.find((u) => u.id === uid),
    [data]
  );

  // ── Submit reply ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // 1. Rifiuta l'invio se il test è vuoto o se in caricamento/bannato
    if (!replyText.trim() || submitting || isBanned) return;
    setSubmitting(true);

    try {
      // 2. Passa il testo alla libreria di moderazione
      const hasProfanity = checkContent(replyText);

      // 3. Se la libreria rileva profanità, INTERROMPI IMMEDIATAMENTE l'esecuzione (Hard stop)
      if (hasProfanity) {
        // Solo se viene bloccata, aggiorna gli strike e mostra il popup
        const status = addStrikeAndGetStatus();
        
        setWarningData({
          matchedTerm: 'Violazione rilevata dalla libreria', // Messaggio generico per bad-words
          newStrikes: status.newStrikes,
          isBanned: status.isBanned
        });
        setWarningVisible(true);
        
        return; // INTERROMPI IMMEDIATAMENTE (Hard Stop). Nessun salvataggio avverrà dopo questa riga.
      }

      // ✅ 4. Solo se l'esecuzione NON viene bloccata (false), permetti al codice di proseguire e salvare la risposta.
      const newReply = {
        id: Date.now(),
        topic_id: parseInt(id, 10),
        author_id: 1, // Mock: current user = Alessandro_T
        content: replyText.trim(),
        timestamp: new Date().toISOString(),
      };

      // Make sure user 1 is in the users array (fallback)
      if (!data.users.find((u) => u.id === 1)) {
        setData((prev) => ({
          ...prev,
          users: [...prev.users, { id: 1, username: 'Alessandro_T', avatar: 'AT' }],
        }));
      }

      setReplies((prev) => [...prev, newReply]);
      setReplyText('');
    } finally {
      // Garantisce che il bottone torni sempre attivo, sia in caso di successo che di blocco
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64 text-gray-400">
        Caricamento topic...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Torna alla Community
        </button>
        <div className="bg-surface border border-slate-700/50 rounded-2xl p-12 text-center text-gray-400">
          Topic non trovato.
        </div>
      </div>
    );
  }

  const { topic, category } = data;
  const author = getUserById(topic.author_id);
  const sortedReplies = [...replies].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  return (
    <>
      {/* ── Moderation Warning Modal ─────────────────────────────────── */}
      {warningVisible && warningData && (
        <ModerationWarning
          strikes={warningData.newStrikes}
          isBanned={warningData.isBanned}
          matchedTerm={warningData.matchedTerm}
          onClose={() => setWarningVisible(false)}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Breadcrumb ────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/community" className="hover:text-primary transition-colors">
            Community
          </Link>
          <span>/</span>
          {category && (
            <>
              <span style={{ color: category.color }}>{category.icon} {category.name}</span>
              <span>/</span>
            </>
          )}
          <span className="text-gray-300 truncate max-w-xs">{topic.title}</span>
        </nav>

        {/* ── Topic Title ───────────────────────────────────────────── */}
        <header>
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/community')}
              className="mt-1 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold text-white leading-snug">
              {topic.title}
            </h1>
          </div>
          <div className="flex items-center gap-4 mt-3 ml-12 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{sortedReplies.length} risposte</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Pubblicato {timeAgo(topic.timestamp)}</span>
            </div>
          </div>
        </header>

        {/* ── Original Post ─────────────────────────────────────────── */}
        <PostCard
          author={author}
          userId={topic.author_id}
          content={topic.content}
          timestamp={topic.timestamp}
          category={category}
          isOriginal
        />

        {/* ── Replies ───────────────────────────────────────────────── */}
        {sortedReplies.length > 0 && (
          <section className="space-y-0">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5 px-1">
              Risposte ({sortedReplies.length})
            </h2>
            <div>
              {sortedReplies.map((reply, i) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  author={getUserById(reply.author_id)}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Reply Form ────────────────────────────────────────────── */}
        <section className="bg-surface border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-white">Lascia una risposta</h2>
          </div>

          {isBanned ? (
            /* ── Banned state ── */
            <div
              className="flex items-start gap-4 rounded-xl p-5"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-400 mb-1">Account sospeso</div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Hai raggiunto il limite massimo di violazioni ({MAX_STRIKES} strike). Non puoi pubblicare nella Community.
                </p>
              </div>
            </div>
          ) : (
            /* ── Normal reply form ── */
            <>
              {/* Strike warning bar — shows after first strike */}
              {strikes > 0 && (
                <div
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4 text-xs"
                  style={{
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    color: '#fbbf24',
                  }}
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Hai {strikes} / {MAX_STRIKES} strike. Rispetta le linee guida della community.
                  </span>
                  {/* Pip display */}
                  <div className="flex gap-1 ml-auto">
                    {Array.from({ length: MAX_STRIKES }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: i < strikes ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {/* Avatar placeholder for current user */}
                <Avatar initials="AT" userId={1} size={9} />

                <div className="flex-1 space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Scrivi la tua risposta... (Ctrl+Invio per inviare)"
                    rows={4}
                    className="w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none transition-all"
                    style={{
                      '--tw-ring-color': 'rgba(99,102,241,0.5)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(99,102,241,0.5)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = '';
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {replyText.length > 0 && `${replyText.length} caratteri`}
                    </span>
                    <button
                      onClick={handleSubmit}
                      disabled={!replyText.trim() || submitting}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                      }}
                    >
                      <Send className="w-4 h-4" />
                      Invia Risposta
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
};

export default TopicDetail;
