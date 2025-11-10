import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function FAQ() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    setLoading(false)
  }, [navigate])

  const faqs = [
    {
      question: "Can I change my plan at any time?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate your billing."
    },
    {
      question: "What happens if I hit my upload limit?",
      answer: "On the Free plan, you can have up to 20 active requests with 2GB total storage. You'll need to upgrade to Pro for 200 active requests and 50GB storage."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, we'll refund you in full. No questions asked."
    },
    {
      question: "Is my data secure?",
      answer: "Yes. All uploads are protected with HTTPS encryption, malware scanning, filename sanitization, magic byte validation, and rate limiting. We block executable files (.exe, .sh, .bat) and scan for malicious content. Your data is never shared with third parties."
    },
    {
      question: "What file types can I request?",
      answer: "You can request any file type - documents, images, videos, PDFs, and more. Pro users can create custom request types and specify exactly what they need."
    },
    {
      question: "How does password protection work?",
      answer: "Pro users can add password protection to any request. Recipients will need to enter the password before they can upload files, adding an extra layer of security."
    },
    {
      question: "Can I use Sway for business?",
      answer: "Yes! Many businesses use Sway to collect client documents, vendor files, and team submissions. Pro gives you the tools you need for professional use."
    },
    {
      question: "What's the difference between Free and Pro analytics?",
      answer: "Free users get basic stats like total requests and uploads. Pro users get advanced insights including file type breakdown, top performing requests, upload trends, and detailed analytics per request."
    },
    {
      question: "How long are files stored?",
      answer: "Files are stored indefinitely as long as you stay within your storage limit. You can delete requests and files anytime to free up space."
    },
    {
      question: "Why is Sway better than email attachments?",
      answer: "Email has size limits (usually 25MB), gets lost in inboxes, and lacks organization. Sway gives you a dedicated link, unlimited file types, up to 50MB per file, automatic notifications, and all uploads in one organized dashboard."
    },
    {
      question: "Can people upload without creating an account?",
      answer: "Yes! Recipients just click your link and upload - no signup required. They can optionally provide their name and email, making it incredibly easy for anyone to send you files."
    },
    {
      question: "What happens when someone uploads a file?",
      answer: "You get an instant notification, and the file appears in your dashboard. You can download individual files or use the bulk download feature (Pro) to get everything at once as a zip file."
    },
    {
      question: "Can I try Pro features before paying?",
      answer: "Start with Free to test the core features. When you're ready for password protection, custom fields, advanced analytics, and bulk downloads, upgrade to Pro. Plus, we offer a 30-day money-back guarantee."
    },
    {
      question: "How do I get my files out if I cancel?",
      answer: "You keep full access to download all your files even after canceling. No lock-in, no hostage situations - your data is always yours. Just download everything before your storage limit decreases."
    },
    {
      question: "Do you sell my data or show ads?",
      answer: "Never. We make money from Pro subscriptions, not from your data. No ads, no tracking, no selling your information to third parties. Your files and privacy are sacred."
    },
    {
      question: "What makes Sway different from Dropbox or Google Drive?",
      answer: "Sway is purpose-built for collecting files FROM others, not sharing files TO others. No folders to navigate, no permissions to manage - just send a link and receive. It's the reverse of traditional file sharing."
    },
    {
      question: "Can I set expiration dates on requests?",
      answer: "Yes! Every request can have a custom expiration date. After the date passes, the upload link stops accepting new files. Perfect for deadlines, time-sensitive collections, or limiting exposure."
    },
    {
      question: "Is there a mobile app?",
      answer: "Sway works perfectly in any mobile browser - no app needed. The interface is fully responsive, and uploaders can send files from their phones just as easily as desktop. Simple and universal."
    }
  ]

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.bg.page
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: `2px solid ${theme.colors.border.medium}`,
          borderTopColor: theme.colors.white,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        marginTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: theme.spacing[6],
          paddingBottom: '120px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: theme.spacing[6], textAlign: 'center' }}>
            <h1 style={{
              fontSize: theme.fontSize.xl,
              fontWeight: '500',
              margin: 0,
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Frequently Asked Questions
            </h1>
            <p style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              margin: '6px 0 0 0',
              lineHeight: '1.6'
            }}>
              Everything you need to know about Sway
            </p>
          </div>

          {/* FAQ Grid */}
          <div style={{
            display: 'grid',
            gap: theme.spacing[4],
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                style={{
                  background: theme.colors.bg.secondary,
                  padding: '20px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.colors.border.light}`,
                  boxShadow: theme.shadows.md
                }}
              >
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[2],
                  fontWeight: theme.weight.medium
                }}>
                  {faq.question}
                </div>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.text.secondary,
                  lineHeight: '1.6'
                }}>
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>

          {/* Still have questions CTA */}
          <div style={{
            marginTop: theme.spacing[6],
            textAlign: 'center',
            padding: '20px',
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '10px',
            maxWidth: '600px',
            margin: `${theme.spacing[6]} auto 0`
          }}>
            <h3 style={{
              fontSize: theme.fontSize.base,
              fontWeight: theme.weight.medium,
              color: theme.colors.text.primary,
              margin: '0 0 8px 0'
            }}>
              Still have questions?
            </h3>
            <p style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.text.secondary,
              margin: '0 0 20px 0',
              lineHeight: '1.6'
            }}>
              Can't find the answer you're looking for? Feel free to reach out.
            </p>
            <a
              href="mailto:support@swayfiles.com"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: theme.colors.white,
                color: theme.colors.black,
                borderRadius: '8px',
                fontSize: theme.fontSize.xs,
                fontWeight: '500',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export default FAQ
