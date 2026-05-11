import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Dizionari per le 5 lingue
const resources = {
  en: {
    translation: {
      sidebar: {
        dashboard: 'Dashboard',
        markets: 'Markets',
        watchlist: 'Watchlist',
        community: 'Community',
        dailyNews: 'Daily News',
        settings: 'Settings',
        logout: 'Log out',
      },
      community: {
        title: 'Community Hub',
        subtitle: 'Discuss, analyze and share ideas with the trader community.',
        newTopic: 'New Topic',
        members: 'Members',
        activeTopics: 'Active Topics',
        totalReplies: 'Total Replies',
        categories: 'Categories',
        all: 'All',
        allTopics: 'All topics',
      },
    },
  },
  it: {
    translation: {
      sidebar: {
        dashboard: 'Dashboard',
        markets: 'Mercati',
        watchlist: 'Watchlist',
        community: 'Community',
        dailyNews: 'Notizie del Giorno',
        settings: 'Impostazioni',
        logout: 'Esci',
      },
      community: {
        title: 'Community Hub',
        subtitle: 'Discuti, analizza e condividi idee con la community di trader.',
        newTopic: 'Nuovo Topic',
        members: 'Membri',
        activeTopics: 'Topic attivi',
        totalReplies: 'Risposte totali',
        categories: 'Categorie',
        all: 'Tutto',
        allTopics: 'Tutti i topic',
      },
    },
  },
  fr: {
    translation: {
      sidebar: {
        dashboard: 'Tableau de bord',
        markets: 'Marchés',
        watchlist: 'Liste de suivi',
        community: 'Communauté',
        dailyNews: 'Nouvelles du jour',
        settings: 'Paramètres',
        logout: 'Se déconnecter',
      },
      community: {
        title: 'Hub Communauté',
        subtitle: 'Discutez, analysez et partagez des idées avec la communauté des traders.',
        newTopic: 'Nouveau Sujet',
        members: 'Membres',
        activeTopics: 'Sujets actifs',
        totalReplies: 'Réponses totales',
        categories: 'Catégories',
        all: 'Tout',
        allTopics: 'Tous les sujets',
      },
    },
  },
  de: {
    translation: {
      sidebar: {
        dashboard: 'Dashboard',
        markets: 'Märkte',
        watchlist: 'Beobachtungsliste',
        community: 'Gemeinschaft',
        dailyNews: 'Tagesnachrichten',
        settings: 'Einstellungen',
        logout: 'Abmelden',
      },
      community: {
        title: 'Community Hub',
        subtitle: 'Diskutieren, analysieren und teilen Sie Ideen mit der Trader-Community.',
        newTopic: 'Neues Thema',
        members: 'Mitglieder',
        activeTopics: 'Aktive Themen',
        totalReplies: 'Gesamte Antworten',
        categories: 'Kategorien',
        all: 'Alle',
        allTopics: 'Alle Themen',
      },
    },
  },
  es: {
    translation: {
      sidebar: {
        dashboard: 'Panel',
        markets: 'Mercados',
        watchlist: 'Lista de seguimiento',
        community: 'Comunidad',
        dailyNews: 'Noticias Diarias',
        settings: 'Ajustes',
        logout: 'Cerrar sesión',
      },
      community: {
        title: 'Hub de Comunidad',
        subtitle: 'Discute, analiza y comparte ideas con la comunidad de traders.',
        newTopic: 'Nuevo Tema',
        members: 'Miembros',
        activeTopics: 'Temas activos',
        totalReplies: 'Respuestas totales',
        categories: 'Categorías',
        all: 'Todo',
        allTopics: 'Todos los temas',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'it', // Italiano come lingua di default
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });

export default i18n;
