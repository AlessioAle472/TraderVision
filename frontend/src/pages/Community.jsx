import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Plus, Clock, ChevronRight, Users, Hash, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Helper to format timestamp as relative time
function timeAgo(isoString) {
  const now = Date.now();
  const diff = now - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} ${days === 1 ? 'giorno' : 'giorni'} fa`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'ora' : 'ore'} fa`;
  return `${minutes} min fa`;
}

// Avatar circle for author
function Avatar({ initials, color }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

// Avatar colors pool
const avatarColors = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#14b8a6',
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const Community = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ categories: [], topics: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetch(`${API_BASE}/api/community`)
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getUserById = (id) => data.users.find((u) => u.id === id) || { username: 'Anonimo', avatar: 'AN' };
  const getCategoryById = (id) => data.categories.find((c) => c.id === id);

  const filteredTopics = selectedCategory
    ? data.topics.filter((t) => t.category_id === selectedCategory)
    : data.topics;

  // Sort by timestamp desc
  const sortedTopics = [...filteredTopics].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">{t('community.title')}</h1>
          </div>
          <p className="text-gray-400 ml-12">
            {t('community.subtitle')}
          </p>
        </div>

        <button
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white text-sm shadow-lg transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          }}
        >
          <Plus className="w-4 h-4" />
          {t('community.newTopic')}
        </button>
      </header>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Users className="w-4 h-4" />, label: t('community.members'), value: data.users.length || '—' },
          { icon: <Hash className="w-4 h-4" />, label: t('community.activeTopics'), value: data.topics.length || '—' },
          {
            icon: <TrendingUp className="w-4 h-4" />,
            label: t('community.totalReplies'),
            value: data.topics.reduce((acc, t) => acc + (t.replyCount || 0), 0) || '—',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface border border-slate-700/50 rounded-xl px-5 py-4 flex items-center gap-3"
          >
            <div className="text-primary">{stat.icon}</div>
            <div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main layout: two columns ── */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          Caricamento community...
        </div>
      ) : (
        <div className="flex gap-6 items-start">

          {/* ── LEFT: Categories ── */}
          <aside className="w-72 flex-shrink-0 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1 mb-4">
              {t('community.categories')}
            </h2>

            {/* "All" filter */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                selectedCategory === null
                  ? 'border-primary/60 bg-primary/10 text-white'
                  : 'border-slate-700/50 bg-surface text-gray-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🏠</span>
                <div className="text-left">
                  <div className="font-semibold text-sm">{t('community.all')}</div>
                  <div className="text-xs text-gray-400">{t('community.allTopics')}</div>
                </div>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}
              >
                {data.topics.length}
              </span>
            </button>

            {data.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  selectedCategory === cat.id
                    ? 'border-primary/60 bg-primary/10 text-white'
                    : 'border-slate-700/50 bg-surface text-gray-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{cat.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-sm">{cat.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[120px]">{cat.description}</div>
                  </div>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: `${cat.color}22`, color: cat.color }}
                >
                  {cat.topicCount}
                </span>
              </button>
            ))}
          </aside>

          {/* ── RIGHT: Topics list ── */}
          <main className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                {selectedCategory
                  ? getCategoryById(selectedCategory)?.name
                  : 'Ultimi Topic'}
              </h2>
              <span className="text-xs text-gray-500">{sortedTopics.length} topic</span>
            </div>

            {sortedTopics.length === 0 && (
              <div className="bg-surface border border-slate-700/50 rounded-xl p-10 text-center text-gray-400">
                Nessun topic in questa categoria.
              </div>
            )}

            {sortedTopics.map((topic) => {
              const author = getUserById(topic.author_id);
              const category = getCategoryById(topic.category_id);
              const colorIndex = (topic.author_id - 1) % avatarColors.length;

              return (
                <div
                  key={topic.id}
                  onClick={() => navigate(`/community/topic/${topic.id}`)}
                  className="bg-surface border border-slate-700/50 rounded-xl px-5 py-4 flex items-start gap-4 hover:border-slate-600 transition-all cursor-pointer group"
                >
                  {/* Avatar */}
                  <Avatar initials={author.avatar} color={avatarColors[colorIndex]} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-white group-hover:text-primary transition-colors leading-snug line-clamp-2">
                        {topic.title}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      {/* Category badge */}
                      {category && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: `${category.color}22`, color: category.color }}
                        >
                          {category.icon} {category.name}
                        </span>
                      )}

                      {/* Author */}
                      <span className="text-xs text-gray-400">
                        <span className="text-gray-500">di</span>{' '}
                        <span className="text-gray-300 font-medium">{author.username}</span>
                      </span>

                      {/* Replies */}
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{topic.replyCount} risposte</span>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timeAgo(topic.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </main>
        </div>
      )}
    </div>
  );
};

export default Community;
