"use client"

import type React from "react"
import { useState, ChangeEvent } from "react"
import { motion } from "framer-motion"
import { Upload, FileText, X } from "lucide-react"

interface ResumeScannerProps {
    onScan: (resumeFiles: File[], jobDescription: string) => void
    isScanning: boolean
}

export function ResumeScanner({ onScan, isScanning }: ResumeScannerProps) {
    const [jobDescription, setJobDescription] = useState("")
    const [resumeFiles, setResumeFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setResumeFiles(prevFiles => [...prevFiles, ...newFiles])
        }
    }

    const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
                .filter(file =>
                    file.name.endsWith('.pdf') ||
                    file.name.endsWith('.docx') ||
                    file.name.endsWith('.doc')
                )
            setResumeFiles(prevFiles => [...prevFiles, ...newFiles])
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files)
                .filter(file =>
                    file.name.endsWith('.pdf') ||
                    file.name.endsWith('.docx') ||
                    file.name.endsWith('.doc')
                )
            setResumeFiles(prevFiles => [...prevFiles, ...newFiles])
        }
    }

    const removeFile = (fileToRemove: File) => {
        setResumeFiles(prevFiles =>
            prevFiles.filter(file => file !== fileToRemove)
        )
    }

    const handleScan = () => {
        onScan(resumeFiles, jobDescription)
    }

    return (
        <div className="bg-[#1a2235] rounded-lg p-6 flex">
            <div className="w-full pr-6">
                <h3 className="text-xl font-bold mb-4">Resume Scanner</h3>
                <p className="text-gray-400 mb-6">Upload resumes and match them against job descriptions</p>

                {/* Upload area */}
                <div
                    className={`border-2 border-dashed ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-blue-500/30"} 
            rounded-lg p-8 flex flex-col items-center justify-center transition-colors`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-blue-500/20 rounded-full p-4 mb-4"
                    >
                        <Upload size={24} className="text-blue-500" />
                    </motion.div>
                    <p className="text-center mb-2">Drag and drop your resumes here</p>
                    <p className="text-gray-500 text-sm mb-4">Supports PDF, DOCX</p>

                    <div className="flex space-x-4">
                        <label>
                            <motion.span
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-blue-600 px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer inline-block"
                            >
                                Choose Files
                            </motion.span>
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                accept=".pdf,.docx,.doc"
                                onChange={handleFileChange}
                            />
                        </label>

                        <label>
                            <motion.span
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-green-600 px-6 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer inline-block"
                            >
                                Choose Folder
                            </motion.span>
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFolderChange}
                                // Use a type assertion to bypass TypeScript type checking
                                {...{ webkitdirectory: true } as React.InputHTMLAttributes<HTMLInputElement>}
                            />
                        </label>
                    </div>
                </div>
                {/* //Resume Preview */}
                <div className="mt-4 bg-[#0f1520] rounded-lg p-4 overflow-y-auto max-h-[500px]">
                    <h4 className="text-lg font-bold mb-4">Uploaded Resumes</h4>
                    {resumeFiles.length === 0 ? (
                        <div className="text-center text-gray-500">
                            <FileText className="mx-auto mb-2 text-gray-400" size={32} />
                            <p>No resumes uploaded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {resumeFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="bg-[#1a2235] rounded-md p-3 flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-2">
                                        <FileText className="text-blue-500" size={20} />
                                        <div>
                                            <p className="text-sm truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile(file)}
                                        className="text-red-500 hover:text-red-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Job description */}
                <div className="mt-6">
                    <textarea
                        className="w-full h-32 bg-[#0f1520] rounded-md p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Paste the job description here to match against the resumes..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                    ></textarea>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full mt-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center
              ${isScanning ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700"}`}
                        onClick={handleScan}
                        disabled={isScanning || resumeFiles.length === 0}
                    >
                        {isScanning ? (
                            <>
                                <Spinner className="mr-2" />
                                Scanning...
                            </>
                        ) : (
                            `Scan ${resumeFiles.length} Resume${resumeFiles.length !== 1 ? 's' : ''}`
                        )}
                    </motion.button>
                </div>

            </div>

            {/* Resume Preview Section */}

        </div>
    )
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

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
}

export default ResumeScanner