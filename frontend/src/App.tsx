import { ThemeProvider } from '@/context/theme-provider'
import { KitchenSinkPage } from '@/pages/kitchen-sink'

export function App() {
  return (
    <ThemeProvider>
      <KitchenSinkPage />
    </ThemeProvider>
  )
}
