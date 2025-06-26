import './App.css'
import '@radix-ui/themes/styles.css';
import { Route, Routes } from "react-router-dom";
import { Landing } from './screens/Landing';
import { Game } from './screens/Game';
import { MultiplayerDashboard } from './screens/MultiplayerDashboard';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

function App() {
  return (
    <div className='h-screen bg-slate-950'>
      <Routes>
        <Route path="/" element={
          <>
            <SignedIn>
              <MultiplayerDashboard />
            </SignedIn>
            <SignedOut>
              <Landing />
            </SignedOut>
          </>
        } /> 
        <Route path="/game/:gameId" element={<Game />} /> 
        <Route path="/dashboard" element={
          <SignedIn>
            <MultiplayerDashboard />
          </SignedIn>
        } />
      </Routes>
    </div>
  )
}

export default App
