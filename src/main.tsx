import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LangProvider } from '@/lib/i18n'
import { DataProvider } from '@/store/DataContext'
import { AuthProvider } from '@/store/AuthContext'
import { ToastProvider } from '@/store/ToastContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <DataProvider>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </DataProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
)
