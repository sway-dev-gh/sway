import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function FAQ() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    setLoading(false)
  }, [navigate])

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

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
    },
    {
      question: "How does the visual Builder work?",
      answer: "The Builder is a drag-and-drop canvas where you design custom upload forms. Drag elements from the left sidebar onto the canvas, customize their properties in the right panel, and arrange everything visually. It's like Canva meets Typeform - no coding required."
    },
    {
      question: "What's the difference between Save and Publish?",
      answer: "Save creates a draft that you can continue editing later - it appears in your Tracking page but isn't live yet. Publish makes your form live and generates a shareable link that people can use to upload files. You can edit published forms anytime."
    },
    {
      question: "Can I use templates to start building?",
      answer: "Yes! Free users get 3 professional templates (Simple Contact, Quick Feedback, Basic File Request). Pro users get 5 additional advanced templates (Client Onboarding, Event Registration, Job Application, Survey Form, Document Collection). Just click a template to start customizing."
    },
    {
      question: "What elements can I use in Free vs Pro?",
      answer: "Free gives you 6 essential elements: Text Block, Heading, Text Input, Text Area, File Upload, and Button. Pro unlocks 16 additional elements including Multi-File Upload, Image Gallery, Date Picker, Rich Text Editor, Star Rating, Signature Pad, and more - 22 elements total."
    },
    {
      question: "What keyboard shortcuts are available in the Builder?",
      answer: "Delete key removes selected elements. Cmd+Z/Cmd+Y (or Ctrl+Z/Ctrl+Y on Windows) for undo/redo. Cmd+C/Cmd+V/Cmd+D for copy/paste/duplicate. Arrow keys move selected elements. Shift+click to select multiple elements at once."
    },
    {
      question: "How do I customize form elements?",
      answer: "Click any element on the canvas to select it. The right panel shows all customizable properties - change labels, placeholders, colors, sizes, required fields, and more. Changes apply instantly. Different element types have different properties available."
    },
    {
      question: "Can I move multiple elements at once?",
      answer: "Yes! Hold Shift and click multiple elements to select them together. Once selected, you can drag them as a group or delete them all at once. Click anywhere on the canvas to deselect."
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
        paddingTop: '54px'
      }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '80px 48px',
          paddingBottom: '160px'
        }}>

          {/* Header */}
          <div style={{
            marginBottom: '80px'
          }}>
            <h1 style={{
              fontSize: '40px',
              fontWeight: '500',
              margin: '0 0 16px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.025em',
              lineHeight: '1.2',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
              Frequently Asked Questions
            </h1>
            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.6',
              fontWeight: '400'
            }}>
              Everything you need to know about Sway
            </p>
          </div>

          {/* FAQ Items */}
          <div>
            {faqs.map((faq, index) => {
              const isExpanded = expandedIndex === index

              return (
                <div
                  key={index}
                  style={{
                    marginBottom: '48px',
                    paddingBottom: '48px',
                    borderBottom: index === faqs.length - 1 ? 'none' : `1px solid ${theme.colors.border.light}`
                  }}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    style={{
                      width: '100%',
                      padding: 0,
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '24px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      transition: 'opacity 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.7'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1'
                    }}
                  >
                    <div style={{
                      fontSize: '14px',
                      color: theme.colors.text.primary,
                      fontWeight: '500',
                      lineHeight: '1.5',
                      flex: 1,
                      letterSpacing: '-0.01em'
                    }}>
                      {faq.question}
                    </div>
                    <div style={{
                      fontSize: '18px',
                      color: theme.colors.text.secondary,
                      lineHeight: '1',
                      flexShrink: 0,
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      marginTop: '2px'
                    }}>
                      v
                    </div>
                  </button>

                  <div style={{
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    maxHeight: isExpanded ? '500px' : '0',
                    opacity: isExpanded ? '1' : '0'
                  }}>
                    <div style={{
                      paddingTop: isExpanded ? '20px' : '0',
                      fontSize: '15px',
                      color: theme.colors.text.secondary,
                      lineHeight: '1.7',
                      fontWeight: '400',
                      letterSpacing: '-0.005em',
                      paddingRight: '48px'
                    }}>
                      {faq.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export default FAQ
