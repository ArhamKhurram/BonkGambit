import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Theme } from '@radix-ui/themes';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import { SocketProvider } from './context/SocketProvider';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const ClerkWithRoutes = () => {
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/" 
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <Theme>
        <App />
      </Theme>
    </ClerkProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SocketProvider>
        <ClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          afterSignOutUrl="/"
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
        >
          <ClerkWithRoutes />
        </ClerkProvider>
      </SocketProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
