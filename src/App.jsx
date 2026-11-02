import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import LandingPage from './pages/LandingPage.jsx'
import CreateProjectPage from './pages/CreateProjectPage.jsx'
import ProjectPage from './pages/ProjectPage.jsx'
import V2App from './v2/V2App.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<CreateProjectPage />} />
          <Route path="/project/:projectId" element={<ProjectPage />} />
          <Route path="/app/*" element={<V2App />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
