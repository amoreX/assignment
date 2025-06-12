"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, Download, Loader2, ImageIcon, FileImage } from "lucide-react"
import { cn } from "@/lib/utils"
import Tesseract from "tesseract.js"

export default function OCRParser() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedText, setExtractedText] = useState("")
  const [jsonOutput, setJsonOutput] = useState("")
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const extractText = async () => {
    if (!file) return

    setIsProcessing(true)
    setExtractedText("")
    setJsonOutput("")

    const result = await Tesseract.recognize(file, "eng")
    const text = result.data.text.trim()

    setExtractedText(text)
    setJsonOutput(
      JSON.stringify(
        {
          filename: file.name,
          fileType: file.type,
          processedAt: new Date().toISOString(),
          extractedText: text,
        },
        null,
        2
      )
    )
    setIsProcessing(false)
  }

  const downloadJSON = () => {
    if (!jsonOutput) return
    const blob = new Blob([jsonOutput], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ocr-output-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-5xl mx-auto p-6 grid md:grid-cols-2 gap-6">

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" /> Upload Document
          </CardTitle>
          <CardDescription>Only images (JPG, PNG) are supported</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors relative",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              file ? "border-green-500 bg-green-50" : ""
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <FileImage className="w-12 h-12 text-green-500" />
                </div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-lg font-medium">Drop your image here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
            )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <Button
            onClick={extractText}
            disabled={!file || isProcessing}
            className="w-full mt-4"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" /> Extract Text
              </>
            )}
          </Button>
        </CardContent>
      </Card>


      {(extractedText || jsonOutput) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Output
                </CardTitle>
                <CardDescription>Extracted text and JSON</CardDescription>
              </div>
              {jsonOutput && (
                <Button onClick={downloadJSON} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" /> Download JSON
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {extractedText && (
              <div className="space-y-2">
                <Label>Extracted Text</Label>
                <Textarea value={extractedText} readOnly className="min-h-[100px] font-mono text-sm" />
              </div>
            )}

            {jsonOutput && (
              <div className="space-y-2">
                <Label>JSON Output</Label>
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-sm">
                  <code className="language-json">{jsonOutput}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
