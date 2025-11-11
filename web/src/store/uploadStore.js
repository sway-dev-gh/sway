import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import api from '../api/axios'

/**
 * Upload Store
 *
 * Manages file upload state, progress tracking, and validation.
 * Handles both single and multi-file uploads with progress monitoring.
 *
 * @example
 * const { uploads, uploadFile, validateFile } = useUpload()
 */
const useUploadStore = create(
  devtools(
    (set, get) => ({
      // State
      uploads: [],
      currentUpload: null,
      isUploading: false,
      uploadProgress: 0,
      error: null,

      // File management
      selectedFiles: [],
      validationErrors: [],

      // Actions

      /**
       * Add files to selection
       * @param {File[]} files - Files to add
       */
      addFiles: (files) => {
        set(state => ({
          selectedFiles: [...state.selectedFiles, ...files]
        }))
      },

      /**
       * Remove file from selection
       * @param {number} index - Index of file to remove
       */
      removeFile: (index) => {
        set(state => ({
          selectedFiles: state.selectedFiles.filter((_, i) => i !== index)
        }))
      },

      /**
       * Clear all selected files
       */
      clearFiles: () => {
        set({ selectedFiles: [], validationErrors: [] })
      },

      /**
       * Validate file against rules
       * @param {File} file - File to validate
       * @param {object} rules - Validation rules
       * @returns {object} Validation result
       */
      validateFile: (file, rules = {}) => {
        const errors = []
        const {
          maxFileSize = 104857600, // 100MB default
          allowedFileTypes = ['*'],
          maxFiles = 10
        } = rules

        // Check file size
        if (file.size > maxFileSize) {
          const sizeMB = (maxFileSize / 1024 / 1024).toFixed(0)
          errors.push({
            file: file.name,
            message: `File too large. Maximum size: ${sizeMB}MB`
          })
        }

        // Check file type
        if (!allowedFileTypes.includes('*')) {
          const typeExtensions = {
            image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
            document: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
            video: ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
            audio: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
            archive: ['.zip', '.rar', '.7z', '.tar', '.gz']
          }

          let allowedExtensions = []
          allowedFileTypes.forEach(type => {
            if (typeExtensions[type]) {
              allowedExtensions.push(...typeExtensions[type])
            }
          })

          const fileName = file.name.toLowerCase()
          const fileExt = '.' + fileName.split('.').pop()

          if (!allowedExtensions.includes(fileExt)) {
            errors.push({
              file: file.name,
              message: `File type not allowed. Allowed types: ${allowedFileTypes.join(', ')}`
            })
          }
        }

        return {
          valid: errors.length === 0,
          errors
        }
      },

      /**
       * Validate multiple files
       * @param {File[]} files - Files to validate
       * @param {object} rules - Validation rules
       * @returns {object} Validation result
       */
      validateFiles: (files, rules = {}) => {
        const { maxFiles = 10 } = rules
        const allErrors = []

        // Check file count
        if (files.length > maxFiles) {
          allErrors.push({
            file: 'general',
            message: `Too many files. Maximum: ${maxFiles} files`
          })
          set({ validationErrors: allErrors })
          return { valid: false, errors: allErrors }
        }

        // Validate each file
        files.forEach(file => {
          const result = get().validateFile(file, rules)
          if (!result.valid) {
            allErrors.push(...result.errors)
          }
        })

        set({ validationErrors: allErrors })
        return {
          valid: allErrors.length === 0,
          errors: allErrors
        }
      },

      /**
       * Upload file to server
       * @param {string} shortCode - Request short code
       * @param {object} formData - Form data including files
       * @returns {Promise<object>} Upload result
       */
      uploadFile: async (shortCode, formData) => {
        set({
          isUploading: true,
          uploadProgress: 0,
          error: null,
          currentUpload: shortCode
        })

        try {
          const response = await api.post(`/api/r/${shortCode}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              set({ uploadProgress: percentCompleted })
            }
          })

          // Add to uploads history
          set(state => ({
            uploads: [...state.uploads, {
              id: Date.now(),
              shortCode,
              timestamp: new Date().toISOString(),
              fileCount: formData.getAll('files').length,
              status: 'success'
            }],
            isUploading: false,
            uploadProgress: 0,
            currentUpload: null,
            selectedFiles: []
          }))

          return response.data
        } catch (error) {
          const errorMessage = error.response?.status === 401
            ? 'Incorrect password. Please try again.'
            : error.response?.data?.error || 'Failed to upload files'

          set({
            error: errorMessage,
            isUploading: false,
            uploadProgress: 0,
            currentUpload: null
          })

          throw new Error(errorMessage)
        }
      },

      /**
       * Download file from server
       * @param {string} fileId - File ID to download
       * @param {string} fileName - File name for download
       * @returns {Promise<void>}
       */
      downloadFile: async (fileId, fileName) => {
        try {
          const token = localStorage.getItem('token')
          const response = await api.get(`/api/files/${fileId}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          })

          const url = window.URL.createObjectURL(response.data)
          const a = document.createElement('a')
          a.href = url
          a.download = fileName || 'download'
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } catch (error) {
          console.error('Download error:', error)
          throw new Error('Failed to download file')
        }
      },

      /**
       * Fetch all uploads for current user
       * @returns {Promise<object[]>} List of uploads
       */
      fetchUploads: async () => {
        try {
          const token = localStorage.getItem('token')
          const { data } = await api.get('/api/files', {
            headers: { Authorization: `Bearer ${token}` }
          })

          set({ uploads: data.files || [] })
          return data.files || []
        } catch (error) {
          console.error('Failed to fetch uploads:', error)
          throw error
        }
      },

      /**
       * Get upload statistics
       * @returns {object} Upload statistics
       */
      getUploadStats: () => {
        const state = get()
        const totalUploads = state.uploads.length
        const totalSize = state.uploads.reduce((sum, upload) => {
          return sum + (upload.fileSize || 0)
        }, 0)
        const successRate = totalUploads > 0
          ? (state.uploads.filter(u => u.status === 'success').length / totalUploads) * 100
          : 0

        return {
          totalUploads,
          totalSize,
          successRate: successRate.toFixed(1)
        }
      },

      /**
       * Clear upload history
       */
      clearUploadHistory: () => {
        set({ uploads: [] })
      },

      /**
       * Clear error state
       */
      clearError: () => {
        set({ error: null, validationErrors: [] })
      },

      /**
       * Cancel current upload
       */
      cancelUpload: () => {
        // Note: Actual cancellation would require AbortController
        set({
          isUploading: false,
          uploadProgress: 0,
          currentUpload: null
        })
      },

      /**
       * Format file size for display
       * @param {number} bytes - File size in bytes
       * @returns {string} Formatted file size
       */
      formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
      },

      /**
       * Get file extension
       * @param {string} fileName - File name
       * @returns {string} File extension
       */
      getFileExtension: (fileName) => {
        return fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase()
      },

      /**
       * Check if file is image
       * @param {string} fileName - File name
       * @returns {boolean} True if image
       */
      isImage: (fileName) => {
        const ext = get().getFileExtension(fileName)
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
      },

      /**
       * Check if file is document
       * @param {string} fileName - File name
       * @returns {boolean} True if document
       */
      isDocument: (fileName) => {
        const ext = get().getFileExtension(fileName)
        return ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)
      },

      /**
       * Get upload by ID
       * @param {string} uploadId - Upload ID
       * @returns {object|null} Upload object
       */
      getUploadById: (uploadId) => {
        return get().uploads.find(u => u.id === uploadId) || null
      }
    }),
    { name: 'UploadStore' }
  )
)

// Export hook
export const useUpload = useUploadStore

export default useUploadStore
