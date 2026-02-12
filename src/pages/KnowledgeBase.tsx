
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Upload } from "lucide-react";

export default function KnowledgeBase() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-500/20 rounded-lg">
          <BookOpen className="h-8 w-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
          <p className="text-gray-400">Manage documents and context for your AI assistants.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Documents</CardTitle>
            <CardDescription>Upload PDFs, TXT, and MD files</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-600 mb-2" />
                  <span className="text-sm text-gray-500">Drag & drop files</span>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Web Scraper</CardTitle>
            <CardDescription>Import content from URLs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-800 rounded-lg">
              <span className="text-gray-500">Coming Soon</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
