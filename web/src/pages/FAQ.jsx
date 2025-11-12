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
      question: "How do I create a review project?",
      answer: "Go to the Projects page and click 'Create New Project'. Set up your project details, add sections that need review, and invite team members or collaborators to start the review process."
    },
    {
      question: "What's the difference between project members and external collaborators?",
      answer: "Project members are team members with accounts who can manage the project. External collaborators can review specific sections using secure access links without creating an account."
    },
    {
      question: "How does section-based review work?",
      answer: "Break your project into logical sections (like chapters, features, or components). Each section can have its own review status, comments, and approval workflow. Reviewers can focus on specific areas without getting overwhelmed."
    },
    {
      question: "Can I track version history of my files?",
      answer: "Yes! Pro users get full version history tracking. See exactly what changed, when, and who made the changes. You can compare versions and revert to previous states if needed."
    },
    {
      question: "How do workflow states work?",
      answer: "Projects move through states: Draft → Under Review → Changes Requested → Approved → Delivered. Each state has specific permissions and actions, ensuring clear progress tracking and accountability."
    },
    {
      question: "What happens if I hit my project limit?",
      answer: "Free plans include 5 active review projects. When you reach the limit, you'll need to complete or delete existing projects, or upgrade to Pro for unlimited projects."
    },
    {
      question: "Can external collaborators access all my projects?",
      answer: "No! External access is project-specific and even section-specific. You generate secure access links that only work for the specific content you want them to review, with expiration dates for security."
    },
    {
      question: "How do I invite reviewers to my project?",
      answer: "In your project, click 'Add Collaborator'. For team members, add their email. For external reviewers, generate a secure access link they can use to review without signing up."
    },
    {
      question: "What's the difference between Free and Pro analytics?",
      answer: "Free users get basic project stats like total reviews and completion status. Pro users get advanced insights including review velocity, bottleneck identification, reviewer performance metrics, and timeline analytics."
    },
    {
      question: "Can I customize the review workflow?",
      answer: "Pro users can create custom review templates and workflows. Set up automated approval chains, custom review stages, and specialized templates for different project types."
    },
    {
      question: "How secure are my review projects?",
      answer: "All data is encrypted in transit and at rest. External access links have expiration dates and specific permissions. Pro users get private workspaces and additional security controls."
    },
    {
      question: "Can I export my project data?",
      answer: "Yes! Export reviews, comments, version history, and project analytics. Pro users get additional export formats and can bulk export across multiple projects."
    },
    {
      question: "How does comment collaboration work?",
      answer: "Reviewers can add comments to specific sections, reply to each other, and @mention team members. Comments are threaded and you get notifications when someone responds or mentions you."
    },
    {
      question: "What file types can I upload for review?",
      answer: "Upload any file type - documents, images, videos, designs, code files, and more. The review system works with all formats, and Pro users get advanced preview features."
    },
    {
      question: "Can I set deadlines for reviews?",
      answer: "Yes! Set project deadlines and section-specific review deadlines. Team members get notifications as deadlines approach, and you can track progress against timelines."
    },
    {
      question: "How do I approve or reject sections?",
      answer: "In each section, reviewers can mark it as 'Approved', 'Needs Changes', or add detailed feedback. Project owners see the overall approval status and can progress the project through workflow states."
    },
    {
      question: "Can multiple people review the same section?",
      answer: "Absolutely! Assign multiple reviewers to sections for parallel review. Set whether you need approval from all reviewers or just a majority before moving forward."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "You keep full access to download all project files, comments, and history even after canceling. No lock-in - your work is always yours to keep."
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
              Everything you need to know about review workflows
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
