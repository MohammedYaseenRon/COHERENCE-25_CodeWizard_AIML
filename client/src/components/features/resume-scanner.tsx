import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface ResumeScannerProps {
  onScan: (files: File[] | null) => void
  isScanning: boolean
  multiple?: boolean
}

function Spinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      className={`animate-spin ${props.className || ""}`}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export const ResumeScanner: React.FC<ResumeScannerProps> = ({ 
  onScan, 
  isScanning, 
  multiple = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileArray = Array.from(files)
      setSelectedFiles(fileArray)
    }
  };

  const handleScan = () => {
    if (selectedFiles.length > 0) {
      onScan(selectedFiles)
    } else {
      onScan(null)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(selectedFiles.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="bg-[#1b2537] p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Scan Resumes</h3>
      
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf" 
        multiple={multiple}
        className="hidden" 
      />
      
      <div className="flex flex-col space-y-4">
        <button 
          onClick={triggerFileInput}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Choose Resume PDF{multiple ? 's' : ''}
        </button>

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
            <ul className="space-y-2">
              {selectedFiles.map((file, index) => (
                <li 
                  key={index} 
                  className="flex justify-between items-center bg-[#2c3646] p-2 rounded"
                >
                  <span className="truncate">{file.name}</span>
                  <button 
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-600 ml-2"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* <button 
          onClick={handleScan}
          disabled={selectedFiles.length === 0 || isScanning}
          className={`
            py-2 px-4 rounded 
            ${selectedFiles.length === 0 || isScanning 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
            } 
            text-white
          `}
        >
          {isScanning ? 'Scanning...' : 'Scan Resumes'}
        </button> */}
      </div>

      {/* Scan Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full mt-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center
            ${isScanning || selectedFiles.length === 0 ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        onClick={handleScan}
        disabled={isScanning || selectedFiles.length === 0}
      >
        {isScanning ? (
          <>
            <Spinner className="mr-2" />
            Scanning...
          </>
        ) : (
          "Scan Resume(s)"
        )}
      </motion.button>
    </div>
  )
}