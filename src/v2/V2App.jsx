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
import { MyTasksPage, MilestonesPage, ReportsPage, NotificationsPage, OrganisationSettingsPage } from './AdvancedWorkspacePages.jsx'
import {
  LaunchesPage,
  NewLaunchPage,
  OverviewPage
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
      <Route element={<RequireAuth/>}>
        <Route element={<ProtectedWorkspace/>}>
          <Route index element={<Navigate to="/app/overview" replace/>}/>
          <Route path="overview" element={<OverviewPage/>}/>
          <Route path="launches" element={<LaunchesPage/>}/>
          <Route path="launches/new" element={<NewLaunchPage/>}/>
          <Route path="launches/:projectId" element={<LaunchWorkspacePage/>}/>
          <Route path="tasks" element={<MyTasksPage/>}/>
          <Route path="milestones" element={<MilestonesPage/>}/>
          <Route path="teams" element={<TeamManagementPage/>}/>
          <Route path="reports" element={<ReportsPage/>}/>
          <Route path="notifications" element={<NotificationsPage/>}/>
          <Route path="settings" element={<OrganisationSettingsPage/>}/>
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

export function V2InvitationApp() {
  return (
    <AuthProvider>
      <InviteAcceptancePage/>
    </AuthProvider>
  )
}
