import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import CreateProjectPage from './pages/CreateProjectPage.jsx'
import ProjectPage from './pages/ProjectPage.jsx'
import V2App, { V2InvitationApp } from './v2/V2App.jsx'
import PublicHomePage from './v2/PublicHomePage.jsx'
import PrivacyPolicyPage from './v2/PrivacyPolicyPage.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/create" element={<CreateProjectPage />} />
          <Route path="/project/:projectId" element={<ProjectPage />} />
          <Route path="/app/*" element={<V2App />} />
          <Route path="/invite/:orgId/:inviteId" element={<V2InvitationApp />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
