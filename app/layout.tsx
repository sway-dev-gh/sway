import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthWrapper } from '@/components/AuthWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sway - Collaborative Document Editor',
  description: 'Real-time collaborative document editing and management platform. Work together on documents with live editing, version control, and team collaboration features.',
  keywords: ['collaborative editing', 'document collaboration', 'real-time editing', 'team productivity', 'document management', 'version control', 'online editor'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-terminal-bg text-terminal-text antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen bg-terminal-bg">
              <AuthWrapper>
                {children}
              </AuthWrapper>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}