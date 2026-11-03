import React from 'react'
import { Link } from 'react-router-dom'
import Icon from './icons.jsx'
import Brand from './Brand.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'

const features = [
  { icon: 'rocket', title: 'Launch workspaces', text: 'Bring launch plans, owners, timelines and deliverables into one shared space.' },
  { icon: 'users', title: 'Cross-team alignment', text: 'Give product, engineering, marketing and operations a clear view of the work.' },
  { icon: 'shield', title: 'Launch readiness', text: 'Make approvals, unresolved blockers and release checks visible before launch day.' }
]

export default function PublicHomePage() {
  return (
    <div className="v2-marketing">
      <header className="v2-marketing-header">
        <Brand to="/" />
        <nav className="v2-marketing-nav">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
        </nav>
        <div className="v2-marketing-actions">
          <ThemeToggle style={{ padding: "7px 11px", fontSize: 11 }} />
          <Link to="/app/login" className="v2-marketing-signin">Sign in</Link>
          <Link to="/app/signup" className="v2-button v2-button-primary">Get started <Icon name="arrow" size={16}/></Link>
        </div>
      </header>

      <main>
        <section className="v2-marketing-hero">
          <div className="v2-marketing-copy">
            <span className="v2-marketing-badge"><span/> PRODUCT LAUNCH MANAGEMENT</span>
            <h1>Make every launch feel <em>in control.</em></h1>
            <p>PLTK brings your people, launch plans and deliverables together, so every team knows what needs to happen before release day.</p>
            <div className="v2-marketing-hero-actions">
              <Link to="/app/signup" className="v2-button v2-button-primary">Create your workspace <Icon name="arrow" size={17}/></Link>
              <Link to="/app/login" className="v2-marketing-secondary-link">Already have an account? Sign in</Link>
            </div>
            <div className="v2-marketing-points">
              <span><Icon name="check" size={15}/> Built for multiple teams</span>
              <span><Icon name="check" size={15}/> Clear ownership and deadlines</span>
            </div>
          </div>

          <div className="v2-marketing-preview" aria-label="Illustrative PLTK dashboard preview">
            <div className="v2-preview-window">
              <div className="v2-preview-top"><span className="v2-preview-logo"><img src="/pltk-rocket-brand.svg?v=20261103" alt="" /></span><strong>PLTK</strong><span className="v2-preview-company">Northstar Labs <Icon name="chevronDown" size={12}/></span><span className="v2-preview-avatar">J</span></div>
              <div className="v2-preview-body">
                <div className="v2-preview-sidebar">
                  <span className="selected"><Icon name="grid" size={13}/> Overview</span>
                  <span><Icon name="rocket" size={13}/> Launches</span>
                  <span><Icon name="check" size={13}/> My tasks</span>
                  <span><Icon name="flag" size={13}/> Milestones</span>
                  <span><Icon name="users" size={13}/> Teams</span>
                </div>
                <div className="v2-preview-content">
                  <div className="v2-preview-greeting"><div><small>MONDAY, MAY 19</small><strong>Launch overview</strong><span>Good morning, Jordan. Here's your team's progress.</span></div><span className="v2-preview-cta">+ New launch</span></div>
                  <div className="v2-preview-stats">
                    <div><small>Active launches</small><strong>04</strong><span>Across 3 teams</span></div>
                    <div><small>Tasks completed</small><strong>68%</strong><span>+12% this week</span></div>
                    <div><small>Needs attention</small><strong>03</strong><span>Open blockers</span></div>
                  </div>
                  <div className="v2-preview-projects">
                    <div className="v2-preview-section-title"><strong>Active launches</strong><small>View all →</small></div>
                    <div className="v2-preview-project"><span className="v2-preview-project-icon">N</span><div><strong>Nova mobile app</strong><small>Engineering · Marketing</small></div><b>76%</b></div>
                    <div className="v2-preview-project"><span className="v2-preview-project-icon violet">A</span><div><strong>Atlas platform release</strong><small>Product · Operations</small></div><b>42%</b></div>
                    <div className="v2-preview-project"><span className="v2-preview-project-icon amber">S</span><div><strong>Summit launch campaign</strong><small>Marketing · Sales</small></div><b>89%</b></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="v2-preview-float"><span className="v2-preview-float-check"><Icon name="check" size={15}/></span><span><strong>Milestone approved</strong><small>Engineering sign-off completed</small></span></div>
          </div>
        </section>

        <section className="v2-marketing-proof" id="how-it-works">
          <span>ONE CLEAR PLACE TO MOVE FROM PLAN TO LAUNCH</span>
          <div><strong>Plan</strong><Icon name="arrow" size={17}/><strong>Coordinate</strong><Icon name="arrow" size={17}/><strong>Validate</strong><Icon name="arrow" size={17}/><strong>Launch</strong></div>
        </section>

        <section className="v2-marketing-features" id="features">
          <div className="v2-marketing-section-heading"><span className="v2-eyebrow">THE PLTK WORKSPACE</span><h2>Everything your launch team needs to move together.</h2><p>Bring the moving parts of a launch into focus without adding unnecessary process.</p></div>
          <div className="v2-marketing-feature-grid">
            {features.map(feature => <article className="v2-marketing-feature" key={feature.title}><span><Icon name={feature.icon} size={21}/></span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}
          </div>
        </section>

        <section className="v2-marketing-cta">
          <div><span className="v2-eyebrow">YOUR NEXT LAUNCH STARTS HERE</span><h2>Bring your launch plan into focus.</h2><p>Create an organisation workspace and give every team a clear path to release.</p></div>
          <Link to="/app/signup" className="v2-button v2-button-primary">Get started with PLTK <Icon name="arrow" size={17}/></Link>
        </section>
      </main>
      <footer className="v2-marketing-footer"><Brand to="/" /><span>Product Launch Tracker · Plan clearly. Launch confidently.</span><span>© 2026 Peregrine Solution. All rights reserved.</span></footer>
    </div>
  )
}
