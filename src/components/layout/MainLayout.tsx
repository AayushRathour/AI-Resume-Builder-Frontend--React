import React, { ReactNode } from 'react'
import Navbar from '../Navbar'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="app-container min-h-screen bg-slate-50">
      <Navbar />
      <div className="page-container">
        {children}
      </div>
    </div>
  )
}
