import React from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthProvider.jsx'
import AuthPage from './auth/AuthPage.jsx'
import WorkspaceShell from './WorkspaceShell.jsx'
import { WorkspaceProvider } from './WorkspaceContext.jsx'
import LaunchWorkspacePage from './LaunchWorkspacePage.jsx'
import InviteAcceptancePage from './InviteAcceptancePage.jsx'
import MemberManagementPage from './MemberManagementPage.jsx'
import TeamManagementPage from './TeamManagementPage.jsx'
import {
  LaunchesPage,
  NewLaunchPage,
  OverviewPage,
  PlaceholderPage
} from './WorkspacePages.jsx'
import './v2.css'

function AuthLoading() {
  return <div className="v2-loading v2-auth-loading"><span className="v2-spinner"/><span>Checking your account…</span></div>
}

function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading/>
  if (!user) return <Navigate to="/app/login" replace/>
  return <Outlet/>
}

function ProtectedWorkspace() {
  return (
    <WorkspaceProvider>
      <WorkspaceShell/>
    </WorkspaceProvider>
  )
}

function V2Routes() {
  return (
    <Routes>
      <Route path="login" element={<AuthPage mode="login"/>}/>
      <Route path="signup" element={<AuthPage mode="signup"/>}/>
      <Route path="invite/:orgId/:inviteId" element={<InviteAcceptancePage/>}/>
      <Route element={<RequireAuth/>}>
        <Route element={<ProtectedWorkspace/>}>
          <Route index element={<Navigate to="/app/overview" replace/>}/>
          <Route path="overview" element={<OverviewPage/>}/>
          <Route path="launches" element={<LaunchesPage/>}/>
          <Route path="launches/new" element={<NewLaunchPage/>}/>
          <Route path="launches/:projectId" element={<LaunchWorkspacePage/>}/>
          <Route path="tasks" element={<PlaceholderPage title="My tasks" description="One place for the work assigned to you across your projects."/>}/>
          <Route path="milestones" element={<PlaceholderPage title="Milestones" description="Track the deliverables that move your launches forward."/>}/>
          <Route path="teams" element={<TeamManagementPage/>}/>
          <Route path="reports" element={<PlaceholderPage title="Reports" description="Understand launch progress, delays and delivery performance."/>}/>
          <Route path="notifications" element={<PlaceholderPage title="Notifications" description="Stay informed about assignments, deadlines, approvals and launch activity."/>}/>
          <Route path="settings" element={<PlaceholderPage title="Organisation settings" description="Manage organisation details, preferences and workspace configuration."/>}/>
          <Route path="members" element={<MemberManagementPage/>}/>
          <Route path="*" element={<Navigate to="/app/overview" replace/>}/>
        </Route>
      </Route>
    </Routes>
  )
}

export default function V2App() {
  return <AuthProvider><V2Routes/></AuthProvider>
}
