import { ref } from 'vue'

// Simple theme composable: toggles 'dark' class on <html> and persists to localStorage
export function useTheme() {
  const theme = ref(localStorage.getItem('theme') || 'light')

  const applyClass = () => {
    const root = document.documentElement
    if (theme.value === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const initTheme = () => {
    // Respect saved preference or system preference if nothing saved
    if (!localStorage.getItem('theme')) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
    }
    applyClass()
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', theme.value)
    applyClass()
  }

  return { theme, initTheme, toggleTheme }
}