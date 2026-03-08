import './globals.css'
import { AppProvider } from '@/lib/appContext'

export const metadata = {
  title: 'ZamSchool OS — School Management System',
  description: 'Production-grade school management platform'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}
