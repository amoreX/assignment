import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Image, FileImage, File, Loader2, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import Tesseract from "tesseract.js"
import {CleanJson} from "../app/utils/cleanedResponse";
type Props = {
  file: File | null
  setFile: (file: File | null) => void
  isProcessing: boolean
  setIsProcessing: (val: boolean) => void
  setExtractedText: (text: string) => void
  setJsonOutput: (json: string) => void
  processingStatus: string
  setProcessingStatus: (status: string) => void
}

export default function FileUploadCard({
  file,
  setFile,
  isProcessing,
  setIsProcessing,
  setExtractedText,
  setJsonOutput,
  processingStatus,
  setProcessingStatus,
}: Props) {
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
    if (droppedFile && (droppedFile.type.startsWith("image/") || droppedFile.type === "application/pdf")) {
      setFile(droppedFile)
    }
  }, [setFile])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const convertPdfToImages = async (pdfFile: File): Promise<string[]> => {
    const arrayBuffer = await pdfFile.arrayBuffer()

    let pdfjsLib: typeof import("pdfjs-dist") | undefined
    if (typeof window !== "undefined") {
      pdfjsLib = (window as unknown as { pdfjsLib?: typeof import("pdfjs-dist") }).pdfjsLib

      if (!pdfjsLib) {
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        document.head.appendChild(script)

        await new Promise<void>((resolve, reject) => {
          script.onload = () => {
            pdfjsLib = (window as unknown as { pdfjsLib?: typeof import("pdfjs-dist") }).pdfjsLib
            if (pdfjsLib) {
              pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
            }
            resolve()
          }
          script.onerror = reject
        })
      }
    } else {
      throw new Error("Window object not available")
    }

    if (!pdfjsLib) {
      throw new Error("PDF.js failed to load")
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const images: string[] = []

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      setProcessingStatus(`Converting PDF page ${pageNum} of ${pdf.numPages}...`)
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 2.0 })

      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Failed to get canvas context")

      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({ canvasContext: context, viewport }).promise

      images.push(canvas.toDataURL("image/png"))
    }

    return images
  }

  const processImageWithOCR = async (imageData: string | File): Promise<string> => {
    const result = await Tesseract.recognize(imageData, "eng")
    return result.data.text.trim()
  }

  const extractText = async () => {
    if (!file) return

    if (typeof window === "undefined") {
      setExtractedText("OCR processing is only available in the browser.")
      return
    }

    setIsProcessing(true)
    setExtractedText("")
    setJsonOutput("")
    setProcessingStatus("Starting...")

    try {
      let allText = ""

      if (file.type === "application/pdf") {
        setProcessingStatus("Converting PDF to images...")
        const images = await convertPdfToImages(file)

        for (let i = 0; i < images.length; i++) {
          setProcessingStatus(`Processing page ${i + 1} of ${images.length}...`)
          const pageText = await processImageWithOCR(images[i])
          if (pageText.trim()) {
            allText += pageText + "\n\n"
          }
        }
      } else {
        setProcessingStatus("Processing image...")
        allText = await processImageWithOCR(file)
      }

      const cleanedText = allText
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n\n/g, " ")
        .replace(/\n/g, " ")
        .replace(/ {2,}/g, " ")
        .trim()
      const cleanerText=await CleanJson(cleanedText);
      setExtractedText(JSON.stringify(cleanerText, null, 2))
      setJsonOutput(JSON.stringify(cleanerText, null, 2));
    } catch (error) {
      setExtractedText("Error during OCR processing.")
      setJsonOutput("")
      console.error(error)
    } finally {
      setIsProcessing(false)
      setProcessingStatus("")
    }
  }

  const getFileIcon = () => {
    if (!file) return <Image className="w-12 h-12 mx-auto text-muted-foreground" />
    return file.type === "application/pdf" ? (
      <File className="w-12 h-12 text-green-500" />
    ) : (
      <FileImage className="w-12 h-12 text-green-500" />
    )
  }

  const getFileColor = () => {
    if (!file) return ""
    return "border-green-500 bg-green-50"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" /> Upload Document
        </CardTitle>
        <CardDescription>Supports images (JPG, PNG) and PDF files</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors relative",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            file ? getFileColor() : ""
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="space-y-2">
              <div className="flex justify-center">{getFileIcon()}</div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {file.type === "application/pdf" && " • PDF"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Image className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-lg font-medium">Drop your file here</p>
              <p className="text-sm text-muted-foreground">Supports images and PDFs</p>
            </div>
          )}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {processingStatus && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">{processingStatus}</p>
          </div>
        )}

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
  )
}
