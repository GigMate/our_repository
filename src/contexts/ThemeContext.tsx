import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  gradient: string;
  lightGradient: string;
  headerBg: string;
  buttonBg: string;
  buttonHover: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  userType: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeByUserType: Record<string, ThemeColors> = {
  fan: {
    primary: 'rgb(16, 185, 129)',
    primaryHover: 'rgb(5, 150, 105)',
    secondary: 'rgb(52, 211, 153)',
    gradient: 'from-green-600 to-emerald-600',
    lightGradient: 'from-green-50 to-emerald-50',
    headerBg: 'bg-green-600',
    buttonBg: 'bg-green-600',
    buttonHover: 'hover:bg-green-700',
  },
  musician: {
    primary: 'rgb(37, 99, 235)',
    primaryHover: 'rgb(29, 78, 216)',
    secondary: 'rgb(59, 130, 246)',
    gradient: 'from-blue-600 to-indigo-600',
    lightGradient: 'from-gray-50 to-gray-100',
    headerBg: 'bg-blue-600',
    buttonBg: 'bg-blue-600',
    buttonHover: 'hover:bg-blue-700',
  },
  venue: {
    primary: 'rgb(147, 51, 234)',
    primaryHover: 'rgb(126, 34, 206)',
    secondary: 'rgb(168, 85, 247)',
    gradient: 'from-purple-600 to-violet-600',
    lightGradient: 'from-purple-50 to-violet-50',
    headerBg: 'bg-purple-600',
    buttonBg: 'bg-purple-600',
    buttonHover: 'hover:bg-purple-700',
  },
  investor: {
    primary: 'rgb(234, 88, 12)',
    primaryHover: 'rgb(194, 65, 12)',
    secondary: 'rgb(251, 146, 60)',
    gradient: 'from-orange-600 to-amber-600',
    lightGradient: 'from-orange-50 to-amber-50',
    headerBg: 'bg-orange-600',
    buttonBg: 'bg-orange-600',
    buttonHover: 'hover:bg-orange-700',
  },
  consumer: {
    primary: 'rgb(234, 88, 12)',
    primaryHover: 'rgb(194, 65, 12)',
    secondary: 'rgb(251, 146, 60)',
    gradient: 'from-orange-600 to-amber-600',
    lightGradient: 'from-orange-50 to-amber-50',
    headerBg: 'bg-orange-600',
    buttonBg: 'bg-orange-600',
    buttonHover: 'hover:bg-orange-700',
  },
  default: {
    primary: 'rgb(37, 99, 235)',
    primaryHover: 'rgb(29, 78, 216)',
    secondary: 'rgb(59, 130, 246)',
    gradient: 'from-blue-600 to-blue-800',
    lightGradient: 'from-gray-50 to-gray-100',
    headerBg: 'bg-gigmate-blue',
    buttonBg: 'bg-gigmate-blue',
    buttonHover: 'hover:bg-blue-700',
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const userType = profile?.user_type || 'default';
  const colors = themeByUserType[userType] || themeByUserType.default;

  return (
    <ThemeContext.Provider value={{ colors, userType }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
