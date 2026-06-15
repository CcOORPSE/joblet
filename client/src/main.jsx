import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AppContextProvider } from './context/AppContext.jsx'
import { isFirebaseReady, firebaseInitError } from './config/firebase.js'
import FirebaseSetupError from './components/FirebaseSetupError.jsx'

const root = createRoot(document.getElementById('root'))

if (!isFirebaseReady) {
  root.render(
    <StrictMode>
      <FirebaseSetupError message={firebaseInitError} />
    </StrictMode>
  )
} else {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <AppContextProvider>
          <App />
        </AppContextProvider>
      </BrowserRouter>
    </StrictMode>
  )
}
