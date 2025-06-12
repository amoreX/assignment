"use client"

import { useState } from "react"
import FileUploadCard from "@/components/FileUploadCard"
import OutputCard from "@/components/OutputCard"

export default function OCRParser() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [jsonOutput, setJsonOutput] = useState("")
  const [processingStatus, setProcessingStatus] = useState("")

  return (
    <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-6">
      <FileUploadCard
        file={file}
        setFile={setFile}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        setExtractedText={setExtractedText}
        setJsonOutput={setJsonOutput}
        processingStatus={processingStatus}
        setProcessingStatus={setProcessingStatus}
      />
      {(extractedText || jsonOutput) && (
        <OutputCard
          extractedText={extractedText}
          jsonOutput={jsonOutput}
        />
      )}
    </div>
  )
}
