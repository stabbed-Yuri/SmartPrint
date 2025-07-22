// NOTE: You must run `npm install pdf-lib` in your project for this page to work.
// This page uses pdf-lib to generate a PDF from the textbox content.
import React, { useState, useEffect } from 'react';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import api from '../services/api';

interface Printer {
  id: number;
  name: string;
  status: string;
}

const MAX_CHARS = 2000;

const DemoPrintPage: React.FC = () => {
  const [text, setText] = useState('');
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pollingJob, setPollingJob] = useState<any | null>(null); // Store job for polling
  const [jobError, setJobError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch printers
    api.get('/printers').then(res => {
      setPrinters(res.data);
      if (res.data.length > 0) setSelectedPrinter(res.data[0].id);
    });
  }, []);

  // Poll for job status if pollingJob is set
  useEffect(() => {
    if (!pollingJob || ['COMPLETED', 'FAILED', 'CANCELLED'].includes(pollingJob.status)) {
      return;
    }
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/print/jobs/${pollingJob.id}`);
        const updatedJob = response.data;
        setPollingJob(updatedJob);
        if (["COMPLETED", "FAILED", "CANCELLED"].includes(updatedJob.status)) {
          setMessage(`Job \"${updatedJob.documentName}\" is ${updatedJob.status.toLowerCase()}.`);
          clearInterval(interval);
        }
      } catch (error: any) {
        setJobError('Could not get job status update.');
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingJob]);

  const handlePrint = async () => {
    setLoading(true);
    setMessage(null);
    setJobError(null);
    setPollingJob(null);
    try {
      // Generate PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 14;
      const margin = 50;
      const maxWidth = 595.28 - 2 * margin;
      const lines = splitTextToLines(text, font, fontSize, maxWidth);
      let y = 841.89 - margin;
      for (const line of lines) {
        y -= fontSize + 4;
        if (y < margin) break; // Only 1 page
        page.drawText(line, { x: margin, y, size: fontSize, font });
      }
      const pdfBytes = await pdfDoc.save();
      const file = new File([pdfBytes], 'demo_print.pdf', { type: 'application/pdf' });

      // Prepare form data
      const formData = new FormData();
      formData.append('files', file); // Backend expects 'files' (array)
      formData.append('printerId', String(selectedPrinter));
      formData.append('deliveryOption', 'PICKUP'); // Default
      formData.append('printType', 'BLACK_AND_WHITE'); // Default
      formData.append('pageSize', 'A4'); // Default
      formData.append('orientation', 'PORTRAIT'); // Default
      formData.append('copyCount', '1'); // Default

      // Send to backend and get job object
      const response = await api.post('/print', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Print job submitted! Now printing...');
      setText('');
      setPollingJob(response.data); // Start polling for status
    } catch (err: any) {
      setMessage('Failed to print: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Helper to split text into lines that fit the page width and handle newlines
  function splitTextToLines(text: string, font: any, fontSize: number, maxWidth: number): string[] {
    const paragraphs = text.split('\n');
    const lines: string[] = [];
    
    paragraphs.forEach(paragraph => {
      if (paragraph.trim() === '') {
        // Add a blank line for empty paragraphs (e.g., double enter)
        lines.push('');
        return;
      }

      const words = paragraph.split(' ');
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
    });

    return lines;
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Demo Print Page</h2>
      <label className="block mb-2 font-semibold">Text to Print (max 1 page, {MAX_CHARS} chars):</label>
      <textarea
        className="w-full border rounded p-2 mb-4"
        rows={10}
        maxLength={MAX_CHARS}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type your text here..."
      />
      <div className="mb-4 text-sm text-gray-500">{text.length} / {MAX_CHARS} characters</div>
      <label className="block mb-2 font-semibold">Select Printer:</label>
      <select
        className="w-full border rounded p-2 mb-4"
        value={selectedPrinter ?? ''}
        onChange={e => setSelectedPrinter(Number(e.target.value))}
      >
        {printers.map(printer => (
          <option key={printer.id} value={printer.id} disabled={printer.status !== 'ONLINE'}>
            {printer.name} ({printer.status})
          </option>
        ))}
      </select>
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded font-semibold disabled:opacity-50"
        onClick={handlePrint}
        disabled={loading || !text.trim() || !selectedPrinter}
      >
        {loading ? 'Printing...' : 'Print'}
      </button>
      {message && <div className="mt-4 text-center text-lg font-semibold text-green-700">{message}</div>}
      {jobError && <div className="mt-2 text-center text-red-600">{jobError}</div>}
      {pollingJob && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-blue-800">Print Job Status</h3>
              <p className="text-blue-700 mt-1">
                Document: <span className="font-medium">{pollingJob.documentName}</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-blue-800 font-semibold">{pollingJob.status}</span>
              {!["COMPLETED", "FAILED", "CANCELLED"].includes(pollingJob.status) && (
                <span className="ml-2 animate-spin inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full"></span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoPrintPage; 