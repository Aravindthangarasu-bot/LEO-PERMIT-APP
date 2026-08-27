import { useState } from 'react';
import Navbar from '../Navbar/Navbar';
import styles from './PortalLayout.module.css';

interface NavItem {
  path: string;
  icon?: React.ReactNode;
  label: string;
}

interface PortalLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  portalName: string;
  accentColor?: string;
}

export default function PortalLayout({ children, navItems, portalName }: PortalLayoutProps) {
  return (
    <div className={styles.layout}>
      {/* 1. Global Navbar with Portal-specific Links */}
      <Navbar variant="portal" navItems={navItems} />

      {/* 2. Portal Header (Breadcrumb/Title) */}
      <div className={styles.portalHeaderBar}>
        <div className="container">
          <h2>{portalName}</h2>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <div className={styles.main}>
        <main className={styles.content}>
          <div className="container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
