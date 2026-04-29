import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { init } from '@tma.js/sdk-react'
import { MemberProvider } from './context/MemberContext'
import { LevelProvider } from './context/LevelContext'
import { HistoryProvider } from './context/HistoryContext'
import { LeaderboardProvider } from './context/LeaderboardContext'
import './index.css'
import App from './App.tsx'

// Initialize Telegram SDK
try {
  init()
} catch (e) {
  // Initialization might fail if outside Telegram
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemberProvider>
      <LevelProvider>
        <HistoryProvider>
          <LeaderboardProvider>
            <App />
          </LeaderboardProvider>
        </HistoryProvider>
      </LevelProvider>
    </MemberProvider>
  </StrictMode>,
)
