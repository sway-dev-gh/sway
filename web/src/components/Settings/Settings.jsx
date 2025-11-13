import React, { useState } from 'react'
import { motion } from 'framer-motion'

const Settings = () => {
  const [settings, setSettings] = useState({
    theme: 'terminal',
    autoSave: true,
    showLineNumbers: true,
    enableCollaboratorCursors: true,
    timelineView: 'expanded',
    notifications: {
      fileChanges: true,
      collaboratorJoins: true,
      mentions: true
    },
    privacy: {
      showOnlineStatus: true,
      allowDirectMessages: false,
      shareEmail: false
    }
  })

  const handleSettingChange = (category, setting, value) => {
    if (category) {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [setting]: value
        }
      }))
    } else {
      setSettings(prev => ({
        ...prev,
        [setting]: value
      }))
    }
  }

  const ToggleSwitch = ({ enabled, onChange }) => (
    <div
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex items-center h-6 w-11 rounded-full transition-colors cursor-pointer
        ${enabled ? 'bg-terminal-text' : 'bg-terminal-accent'}
      `}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`
          inline-block w-4 h-4 rounded-full transition-colors
          ${enabled ? 'bg-terminal-bg' : 'bg-terminal-muted'}
        `}
      />
    </div>
  )

  const settingSections = [
    {
      title: 'Editor',
      icon: '◆',
      items: [
        {
          label: 'Auto-save changes',
          description: 'Automatically save your changes as you type',
          type: 'toggle',
          value: settings.autoSave,
          onChange: (value) => handleSettingChange(null, 'autoSave', value)
        },
        {
          label: 'Show line numbers',
          description: 'Display line numbers in the code editor',
          type: 'toggle',
          value: settings.showLineNumbers,
          onChange: (value) => handleSettingChange(null, 'showLineNumbers', value)
        },
        {
          label: 'Theme',
          description: 'Choose your preferred interface theme',
          type: 'select',
          value: settings.theme,
          options: [
            { value: 'terminal', label: 'Terminal Dark' },
            { value: 'minimal', label: 'Minimal Light' },
            { value: 'contrast', label: 'High Contrast' }
          ],
          onChange: (value) => handleSettingChange(null, 'theme', value)
        }
      ]
    },
    {
      title: 'Collaboration',
      icon: '◈',
      items: [
        {
          label: 'Show collaborator cursors',
          description: 'Display real-time cursor positions of other collaborators',
          type: 'toggle',
          value: settings.enableCollaboratorCursors,
          onChange: (value) => handleSettingChange(null, 'enableCollaboratorCursors', value)
        },
        {
          label: 'Timeline view',
          description: 'Default timeline display mode',
          type: 'select',
          value: settings.timelineView,
          options: [
            { value: 'expanded', label: 'Expanded' },
            { value: 'compact', label: 'Compact' }
          ],
          onChange: (value) => handleSettingChange(null, 'timelineView', value)
        }
      ]
    },
    {
      title: 'Notifications',
      icon: '◯',
      items: [
        {
          label: 'File changes',
          description: 'Get notified when files you\'re watching are modified',
          type: 'toggle',
          value: settings.notifications.fileChanges,
          onChange: (value) => handleSettingChange('notifications', 'fileChanges', value)
        },
        {
          label: 'Collaborator joins',
          description: 'Get notified when someone joins your workspace',
          type: 'toggle',
          value: settings.notifications.collaboratorJoins,
          onChange: (value) => handleSettingChange('notifications', 'collaboratorJoins', value)
        },
        {
          label: 'Mentions',
          description: 'Get notified when someone mentions you in comments',
          type: 'toggle',
          value: settings.notifications.mentions,
          onChange: (value) => handleSettingChange('notifications', 'mentions', value)
        }
      ]
    },
    {
      title: 'Privacy',
      icon: '◐',
      items: [
        {
          label: 'Show online status',
          description: 'Let others see when you\'re active in the workspace',
          type: 'toggle',
          value: settings.privacy.showOnlineStatus,
          onChange: (value) => handleSettingChange('privacy', 'showOnlineStatus', value)
        },
        {
          label: 'Allow direct messages',
          description: 'Allow collaborators to send you direct messages',
          type: 'toggle',
          value: settings.privacy.allowDirectMessages,
          onChange: (value) => handleSettingChange('privacy', 'allowDirectMessages', value)
        },
        {
          label: 'Share email with team',
          description: 'Make your email visible to workspace members',
          type: 'toggle',
          value: settings.privacy.shareEmail,
          onChange: (value) => handleSettingChange('privacy', 'shareEmail', value)
        }
      ]
    }
  ]

  return (
    <div className="h-full bg-terminal-bg overflow-hidden">
      {/* Header */}
      <div className="border-b border-terminal-border bg-terminal-surface">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-medium text-terminal-text mb-2">
            Settings
          </h1>
          <p className="text-sm text-terminal-muted">
            Configure your versionless workspace preferences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="h-full overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Account Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-terminal-surface border border-terminal-border rounded-lg p-6 mb-8"
          >
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-terminal-accent rounded-lg flex items-center justify-center text-xl text-terminal-text">
                A
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-terminal-text mb-1">
                  Alice Johnson
                </h3>
                <p className="text-sm text-terminal-muted mb-4">
                  alice@example.com
                </p>
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-terminal-text text-terminal-bg text-sm rounded hover:bg-terminal-text/90 transition-colors">
                    Edit Profile
                  </button>
                  <button className="px-4 py-2 border border-terminal-border text-terminal-text text-sm rounded hover:bg-terminal-accent transition-colors">
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Settings Sections */}
          <div className="space-y-8">
            {settingSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
                className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden"
              >
                {/* Section Header */}
                <div className="px-6 py-4 border-b border-terminal-border bg-terminal-accent">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg text-terminal-text">{section.icon}</div>
                    <h3 className="text-lg font-medium text-terminal-text">
                      {section.title}
                    </h3>
                  </div>
                </div>

                {/* Section Items */}
                <div className="divide-y divide-terminal-border">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={item.label}
                      className="px-6 py-4 hover:bg-terminal-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-terminal-text mb-1">
                            {item.label}
                          </h4>
                          <p className="text-xs text-terminal-muted">
                            {item.description}
                          </p>
                        </div>

                        <div className="ml-4">
                          {item.type === 'toggle' ? (
                            <ToggleSwitch
                              enabled={item.value}
                              onChange={item.onChange}
                            />
                          ) : item.type === 'select' ? (
                            <select
                              value={item.value}
                              onChange={(e) => item.onChange(e.target.value)}
                              className="bg-terminal-bg border border-terminal-border rounded px-3 py-1 text-sm text-terminal-text focus:outline-none focus:border-terminal-text"
                            >
                              {item.options.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-terminal-surface border border-red-400/20 rounded-lg overflow-hidden mt-8"
          >
            <div className="px-6 py-4 border-b border-red-400/20 bg-red-400/5">
              <h3 className="text-lg font-medium text-red-400">
                Danger Zone
              </h3>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-terminal-text mb-1">
                    Delete Account
                  </h4>
                  <p className="text-xs text-terminal-muted">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>

                <button className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <div className="flex justify-end mt-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-terminal-text text-terminal-bg text-sm font-medium rounded hover:bg-terminal-text/90 transition-colors"
            >
              Save Changes
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings