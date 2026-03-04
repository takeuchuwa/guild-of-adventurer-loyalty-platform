import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const isStrict =
    import.meta.env.VITE_STRICT_MODE === "development"; // strict only in dev

const Root = isStrict ? (
    <StrictMode>
        <App />
    </StrictMode>
) : (
    <App />
);

createRoot(document.getElementById('root')!).render(
  Root,
)
