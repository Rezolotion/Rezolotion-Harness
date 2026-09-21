import { ThemeProvider } from '@/context/theme-provider'
import { StudioPage } from '@/pages/studio'
import { KitchenSinkPage } from '@/pages/kitchen-sink'

export function App() {
  const path = window.location.pathname
  const isKitchenSink = path === '/kitchen-sink'

  return (
    <ThemeProvider>
      {isKitchenSink ? <KitchenSinkPage /> : <StudioPage />}
    </ThemeProvider>
  )
}
