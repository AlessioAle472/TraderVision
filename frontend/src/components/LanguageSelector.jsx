import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'it', flag: '🇮🇹', label: 'IT' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'de', flag: '🇩🇪', label: 'DE' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
];

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-surface border border-slate-700/50 rounded-xl px-3 py-2 transition-colors hover:border-text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
      >
        <Globe className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-white flex items-center gap-2">
          <span>{currentLang.flag}</span>
          <span>{currentLang.label}</span>
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-surface border border-slate-700/50 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="py-1">
            {languages.map((lng) => (
              <button
                key={lng.code}
                onClick={() => handleSelect(lng.code)}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-slate-800 transition-colors ${
                  i18n.language === lng.code ? 'bg-primary/10 text-primary font-medium' : 'text-gray-300'
                }`}
              >
                <span>{lng.flag}</span>
                <span>{lng.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
