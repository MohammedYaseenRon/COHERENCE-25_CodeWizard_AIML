// "use client"

// import type React from "react"

// import { useState } from "react"
// import { motion } from "framer-motion"
// import { Upload } from "lucide-react"

// interface ResumeScannerProps {
//   onScan: (resumeFile: File | null, jobDescription: string) => void
//   isScanning: boolean
// }

// export function ResumeScanner({ onScan, isScanning }: ResumeScannerProps) {
//   const [jobDescription, setJobDescription] = useState("")
//   const [resumeFile, setResumeFile] = useState<File | null>(null)
//   const [isDragging, setIsDragging] = useState(false)

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setResumeFile(e.target.files[0])
//     }
//   }

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault()
//     setIsDragging(true)
//   }

//   const handleDragLeave = () => {
//     setIsDragging(false)
//   }

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault()
//     setIsDragging(false)

//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       setResumeFile(e.dataTransfer.files[0])
//     }
//   }

//   const handleScan = () => {
//     onScan(resumeFile, jobDescription)
//   }

//   return (
//     <div className="bg-[#1a2235] rounded-lg p-6">
//       <h3 className="text-xl font-bold mb-4">Resume Scanner</h3>
//       <p className="text-gray-400 mb-6">Upload a resume and match it against job descriptions</p>

//       {/* Upload area */}
//       <div
//         className={`border-2 border-dashed ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-blue-500/30"} 
//           rounded-lg p-8 flex flex-col items-center justify-center transition-colors`}
//         onDragOver={handleDragOver}
//         onDragLeave={handleDragLeave}
//         onDrop={handleDrop}
//       >
//         {resumeFile ? (
//           <div className="text-center">
//             <div className="bg-blue-500/20 rounded-full p-4 mb-4 mx-auto w-fit">
//               <FileIcon className="w-6 h-6 text-blue-500" />
//             </div>
//             <p className="font-medium mb-2">{resumeFile.name}</p>
//             <p className="text-gray-500 text-sm mb-4">{formatFileSize(resumeFile.size)}</p>
//             <button onClick={() => setResumeFile(null)} className="text-sm text-blue-400 hover:text-blue-300">
//               Remove
//             </button>
//           </div>
//         ) : (
//           <>
//             <motion.div
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               className="bg-blue-500/20 rounded-full p-4 mb-4"
//             >
//               <Upload size={24} className="text-blue-500" />
//             </motion.div>
//             <p className="text-center mb-2">Drag and drop your resume here</p>
//             <p className="text-gray-500 text-sm mb-4">Supports PDF, DOCX</p>
//             <label>
//               <motion.span
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 className="bg-blue-600 px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer inline-block"
//               >
//                 Choose File
//               </motion.span>
//               <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
//             </label>
//           </>
//         )}
//       </div>

//       {/* Job description */}
//       <div className="mt-6">
//         {/* <h4 className="text-lg font-bold mb-3">Job Description</h4>
//         <textarea
//           className="w-full h-32 bg-[#0f1520] rounded-md p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
//           placeholder="Paste the job description here to match against the resume..."
//           value={jobDescription}
//           onChange={(e) => setJobDescription(e.target.value)}
//         ></textarea> */}

//         <motion.button
//           whileHover={{ scale: 1.02 }}
//           whileTap={{ scale: 0.98 }}
//           className={`w-full mt-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center
//             ${isScanning ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700"}`}
//           onClick={handleScan}
//           disabled={isScanning}
//         >
//           {isScanning ? (
//             <>
//               <Spinner className="mr-2" />
//               Scanning...
//             </>
//           ) : (
//             "Scan Resume"
//           )}
//         </motion.button>
//       </div>
//     </div>
//   )
// }

// function FileIcon(props: React.SVGProps<SVGSVGElement>) {
//   return (
//     <svg
//       {...props}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
//       <polyline points="14 2 14 8 20 8" />
//     </svg>
//   )
// }

// function Spinner(props: React.SVGProps<SVGSVGElement>) {
//   return (
//     <svg
//       {...props}
//       className={`animate-spin ${props.className || ""}`}
//       xmlns="http://www.w3.org/2000/svg"
//       width="24"
//       height="24"
//       viewBox="0 0 24 24"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M21 12a9 9 0 1 1-6.219-8.56" />
//     </svg>
//   )
// }

// function formatFileSize(bytes: number): string {
//   if (bytes < 1024) return bytes + " bytes"
//   else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
//   else return (bytes / 1048576).toFixed(1) + " MB"
// }

import React, { useState, useRef } from 'react'

interface ResumeScannerProps {
  onScan: (files: File[] | null) => void
  isScanning: boolean
  multiple?: boolean
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
  }

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

        <button 
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
        </button>
      </div>
    </div>
  )
}