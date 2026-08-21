import React from 'react'
import { useTheme } from '../context/ThemeContext.jsx'

export default function ThemeToggle({ style = {} }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        border: isDark ? '1px solid #1F293D' : '1px solid #DED8CD',
        background: isDark ? '#111827' : '#FFFDF8',
        color: isDark ? '#F9FAFB' : '#24211D',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ...style
      }}
    >
      <span>{isDark ? '☀️ Light' : '🌙 Dark'}</span>
    </button>
  )
}
