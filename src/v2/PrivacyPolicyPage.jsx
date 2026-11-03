import React from 'react'
import { Link } from 'react-router-dom'
import Brand from './Brand.jsx'

export default function PrivacyPolicyPage() {
  return (
    <main className="v2-marketing v2-privacy-page">
      <header className="v2-marketing-header"><Brand to="/" /><Link className="v2-button v2-button-secondary" to="/">Back to PLTK</Link></header>
      <article className="v2-privacy-content">
        <span className="v2-eyebrow">PEREGRINE SOLUTION · PLTK</span>
        <h1>Privacy policy</h1>
        <p className="v2-privacy-updated">Last updated: 3 November 2026</p>
        <p>This policy explains how Peregrine Solution ("Peregrine", "we", "us") handles personal information when you visit or use PLTK (Product Launch Tracker), a workspace for planning product launches, coordinating teams and storing related project material.</p>
        <h2>1. Who is responsible?</h2>
        <p>Peregrine Solution operates PLTK. Peregrine determines how account administration, service security and our direct relationship with account holders are handled. Where a customer organisation uploads information about its employees, contractors, customers or business activities, that organisation normally determines the purpose of that processing. Peregrine provides the platform to process that workspace information on the organisation's instructions, subject to our service and legal obligations.</p>
        <h2>2. Information we handle</h2>
        <ul>
          <li><strong>Account information:</strong> name, email address, Firebase user identifier, email-verification status and account preferences.</li>
          <li><strong>Organisation and access information:</strong> organisation and team names, member details, roles, project assignments and invitations.</li>
          <li><strong>Workspace content:</strong> launch names and briefs, target dates, tasks, task status, milestones, comments, readiness evidence, activity records and team assignments.</li>
          <li><strong>Files and images:</strong> documents, launch assets, complaint evidence and screenshots uploaded to a workspace, plus file names and upload details.</li>
          <li><strong>Technical information:</strong> authentication, security, diagnostic and service logs handled by PLTK and its infrastructure providers.</li>
        </ul>
        <p>Please do not upload passwords, payment-card details, government identifiers, health information or other sensitive personal information unless your organisation has a clear lawful reason and has assessed whether PLTK is suitable for it.</p>
        <h2>3. Why we use information</h2>
        <ul>
          <li>To create accounts, authenticate users and verify email addresses.</li>
          <li>To provide workspaces, invitations, access controls and collaboration features.</li>
          <li>To store, display and export launch tasks, milestones, comments, files and images.</li>
          <li>To protect the service, investigate errors, prevent misuse and maintain workspace activity records.</li>
          <li>To respond to support, privacy and legal requests and meet applicable legal obligations.</li>
        </ul>
        <p>Depending on the activity, we rely on contract performance, legitimate interests, consent where appropriate, or compliance with a legal obligation. Customer organisations are responsible for determining and communicating the lawful basis for personal information they place in their workspaces.</p>
        <h2>4. Who can see workspace information?</h2>
        <p>Workspace content is not intended to be public. Access is controlled by sign-in and organisation membership. Active non-guest members of an organisation can currently view that organisation's launch records. Guest users are limited to projects to which they have been explicitly granted access. Project managers and organisation administrators can manage project access and content according to their roles.</p>
        <p>People authorised to administer the underlying hosting or Firebase infrastructure may have technical access to service data where necessary for maintenance, security, support or legal compliance. We do not claim that customer content is inaccessible to all infrastructure administrators; we aim to limit access to authorised operational needs.</p>
        <h2>5. Service providers and international processing</h2>
        <p>PLTK uses Google Firebase for authentication, database and file storage, and uses Render for application hosting and backend services. These providers process information to supply their services under their applicable terms and privacy commitments. Depending on configuration and service locations, information may be processed or stored outside Nigeria. We do not promise that all PLTK data is stored in Nigeria.</p>
        <p>We do not sell workspace documents or personal information, and we do not use customer workspace content for advertising.</p>
        <h2>6. Security</h2>
        <p>PLTK uses authentication, organisation membership checks, role-based application permissions and Firebase security rules to restrict access. No online service can guarantee absolute security. Customers should use strong passwords, protect invitation links, remove access when people leave and avoid sharing direct file links outside their organisation. We continue to test and strengthen file-download controls and access isolation.</p>
        <h2>7. Retention and deletion</h2>
        <p>Information is retained while needed to operate accounts, provide the service, meet contractual requirements, resolve disputes and comply with applicable law. Organisation administrators can remove workspace members. Organisation owners and administrators can delete a launch, including its tasks, comments, milestones, activity records, uploaded files and images. Deletion from the active service may not immediately remove provider backups or records that must be retained by law.</p>
        <p>Deleting a launch does not automatically delete a user's PLTK login or other organisations and projects. Account deletion is a separate request and may require identity and ownership verification.</p>
        <h2>8. Your privacy rights</h2>
        <p>Subject to applicable law, individuals may request access to, correction of, deletion of, restriction of or objection to processing of their personal information, and may exercise applicable data-portability and consent-withdrawal rights. If information is held in a customer organisation's workspace, contact that organisation's administrator first. You may also contact Peregrine using the details below. We may need to verify your identity and coordinate with the relevant organisation before responding.</p>
        <p>This policy is intended to support transparency under the Nigeria Data Protection Act 2023 and other applicable privacy laws. You may also have the right to complain to the Nigeria Data Protection Commission or another competent supervisory authority.</p>
        <h2>9. Children's information</h2>
        <p>PLTK is a business collaboration service and is not designed for children. Do not create an account for a child or upload children's personal information unless your organisation has confirmed an appropriate lawful basis and safeguards.</p>
        <h2>10. Changes</h2>
        <p>We may update this policy when PLTK's features, providers or legal requirements change. The latest version will be published here with its updated date.</p>
        <h2>11. Contact</h2>
        <p>For privacy questions or data-rights requests, contact Peregrine Solution at <a href="mailto:daanimasaun@gmail.com">daanimasaun@gmail.com</a>. Customer organisation members should also contact their organisation administrator about workspace content.</p>
      </article>
      <footer className="v2-marketing-footer"><Brand to="/" /><span>© 2026 Peregrine Solution. All rights reserved.</span></footer>
    </main>
  )
}
