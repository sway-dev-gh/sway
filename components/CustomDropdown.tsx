'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface DropdownOption {
  value: string
  label: string
}

interface CustomDropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  disabled = false
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const selectedOption = options.find(option => option.value === value)

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div
      ref={dropdownRef}
      className={`relative ${className}`}
    >
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full bg-terminal-bg border border-terminal-border text-terminal-text text-sm
          px-3 py-2 font-mono flex items-center justify-between
          transition-colors duration-150
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-terminal-text focus:outline-none focus:border-terminal-text cursor-pointer'
          }
          ${isOpen ? 'border-terminal-text' : ''}
        `}
      >
        <span className={selectedOption ? 'text-terminal-text' : 'text-terminal-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-terminal-surface border border-terminal-border shadow-lg">
          <div className="py-1">
            {options.map((option) => {
              const isSelected = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full text-left px-3 py-2 text-sm font-mono transition-colors duration-150 flex items-center justify-between
                    ${isSelected
                      ? 'bg-terminal-hover text-terminal-text'
                      : 'text-terminal-muted hover:bg-terminal-hover hover:text-terminal-text'
                    }
                  `}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <Check size={14} className="text-terminal-text" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}