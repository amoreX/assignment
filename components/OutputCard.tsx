import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download } from "lucide-react"

type Props = {
  extractedText: string
  jsonOutput: string
}

export default function OutputCard({ extractedText, jsonOutput }: Props) {

  const downloadJSON = () => {
    if (!jsonOutput || typeof window === "undefined") return

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
  )
}
