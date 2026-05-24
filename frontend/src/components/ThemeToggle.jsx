import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ThemeToggle = () => {
 const { theme, changeTheme } = useAuth();
 const isDark = theme === 'dark' || (theme === 'auto' && document.documentElement.classList.contains('dark'));

 const toggleTheme = () => {
 changeTheme(isDark ? 'light' : 'dark');
 };

 return (
 <button
 onClick={toggleTheme}
 className="p-2 rounded-xl bg-surface hover: text-text-secondary hover:text-text transition-all focus:outline-none focus: focus:"
 title={isDark ? 'Passa alla modalità chiara' : 'Passa alla modalità scura'}
 >
 {isDark ? (
 <Sun className="w-4 h-4 transition-transform hover:rotate-90"/>
 ) : (
 <Moon className="w-4 h-4 transition-transform hover:-rotate-12"/>
 )}
 </button>
 );
};

export default ThemeToggle;
