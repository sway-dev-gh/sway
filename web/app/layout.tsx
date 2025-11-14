import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { CollaborationProvider } from '@/contexts/CollaborationContext'
import { AdaptiveRoleProvider } from '@/contexts/AdaptiveRoleContext'
import { AIContextProvider } from '@/contexts/AIContextEngine'
import { AuthWrapper } from '@/components/AuthWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SwayFiles - Versionless Collaborative Workspace',
  description: 'The world\'s first truly versionless collaborative workspace. Streamline team collaboration with powerful review workflows.',
  keywords: ['collaboration', 'workspace', 'productivity', 'team', 'versionless'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-terminal-bg text-terminal-text antialiased`}>
        <AuthProvider>
          <CollaborationProvider>
            <AdaptiveRoleProvider>
              <AIContextProvider>
                <div className="min-h-screen bg-terminal-bg">
                  <AuthWrapper>
                    {children}
                  </AuthWrapper>
                </div>
              </AIContextProvider>
            </AdaptiveRoleProvider>
          </CollaborationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}