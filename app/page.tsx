'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import VisualReport from './components/VisualReport';
import { ThemeSelector, CustomColorPicker, PRESET_THEMES, Theme } from './components/ThemeSelector';

type Customer = {
  name: string;
  email?: string;
  phone?: string;
  [key: string]: any;
};

type MappedColumn = {
  originalName: string;
  mappedTo: 'name' | 'email' | 'phone' | 'transaction' | 'metadata' | 'ignore';
  subType?: string; // For transactions: date, amount, service, etc.
};

type ReportSlide = {
  type: 'intro' | 'stat' | 'comparison' | 'achievement' | 'closing';
  title?: string;
  subtitle?: string;
  mainStat?: string;
  statLabel?: string;
  comparison?: string;
  icon?: string;
  gradient: string;
  textColor?: string;
};

export default function Home() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'generating' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<MappedColumn[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessContext, setBusinessContext] = useState('');
  const [businessUrl, setBusinessUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [sampleReport, setSampleReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportSlides, setReportSlides] = useState<ReportSlide[] | null>(null);
  const [showVisualReport, setShowVisualReport] = useState(false);
  const [currentCustomerName, setCurrentCustomerName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<Theme>(PRESET_THEMES[0]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [generatedReports, setGeneratedReports] = useState<any[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(uploadedFile, {
        header: true,
        complete: (results) => {
          setRawData(results.data);
          const cols = results.meta.fields || [];
          setColumns(cols);
          initializeColumnMappings(cols);
          setStep('mapping');
        },
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setRawData(jsonData);
        const cols = Object.keys(jsonData[0] || {});
        setColumns(cols);
        initializeColumnMappings(cols);
        setStep('mapping');
      };
      reader.readAsBinaryString(uploadedFile);
    }
  };

  const initializeColumnMappings = (cols: string[]) => {
    const mappings: MappedColumn[] = cols.map(col => {
      const lower = col.toLowerCase();
      
      // Auto-detect common columns
      if (lower.includes('name') || lower.includes('customer')) {
        return { originalName: col, mappedTo: 'name' };
      }
      if (lower.includes('email') || lower.includes('mail')) {
        return { originalName: col, mappedTo: 'email' };
      }
      if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) {
        return { originalName: col, mappedTo: 'phone' };
      }
      if (lower.includes('date')) {
        return { originalName: col, mappedTo: 'transaction', subType: 'date' };
      }
      if (lower.includes('amount') || lower.includes('price') || lower.includes('cost')) {
        return { originalName: col, mappedTo: 'transaction', subType: 'amount' };
      }
      if (lower.includes('service') || lower.includes('product') || lower.includes('item')) {
        return { originalName: col, mappedTo: 'transaction', subType: 'service' };
      }
      
      // Default to 'metadata' instead of 'ignore' - use all data for fun stats!
      return { originalName: col, mappedTo: 'metadata' };
    });
    
    setColumnMappings(mappings);
  };

  const updateColumnMapping = (index: number, mappedTo: MappedColumn['mappedTo']) => {
    const newMappings = [...columnMappings];
    newMappings[index].mappedTo = mappedTo;
    setColumnMappings(newMappings);
  };

  const generateSampleReport = async () => {
    setIsGenerating(true);
    setError(null);
    
    // Transform first row of data into customer format
    const firstRow = rawData[0];
    const sampleCustomer: any = {
      metadata: {}
    };
    
    columnMappings.forEach(mapping => {
      const value = firstRow[mapping.originalName];
      if (mapping.mappedTo !== 'ignore' && value) {
        if (mapping.mappedTo === 'metadata') {
          sampleCustomer.metadata[mapping.originalName] = value;
        } else {
          sampleCustomer[mapping.mappedTo] = value;
        }
      }
    });

    console.log('Sending to API:', {
      customer: sampleCustomer,
      businessName,
      businessType,
      businessContext,
      businessUrl,
    });

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: sampleCustomer.name || 'Sample Customer',
            email: sampleCustomer.email,
            phone: sampleCustomer.phone,
            metadata: sampleCustomer.metadata,
          },
          businessName,
          businessType,
          businessContext,
          businessUrl,
          logoUrl,
          theme: selectedTheme,
        }),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || errorData.details || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Generated report:', data);
      
      if (!data.report) {
        throw new Error('No report generated');
      }

      setSampleReport(data.report);
      
      // If slides were generated, store them
      if (data.slides && Array.isArray(data.slides)) {
        setReportSlides(data.slides);
        setCurrentCustomerName(sampleCustomer.name || 'Customer');
      }
      
      setStep('preview');
    } catch (error: any) {
      console.error('Error generating sample:', error);
      setError(error.message || 'Failed to generate report. Please check your API key and try again.');
      alert(`Error: ${error.message}\n\nCheck the console (F12) for more details.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBulkReports = async () => {
    if (!rawData || rawData.length === 0) {
      alert('No data to process!');
      return;
    }

    setIsBulkGenerating(true);
    setBulkProgress({ current: 0, total: rawData.length });
    const reports: any[] = [];

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const customerData: any = { metadata: {} };
      
      columnMappings.forEach(mapping => {
        const value = row[mapping.originalName];
        if (mapping.mappedTo !== 'ignore' && value) {
          if (mapping.mappedTo === 'metadata') {
            customerData.metadata[mapping.originalName] = value;
          } else {
            customerData[mapping.mappedTo] = value;
          }
        }
      });

      try {
        const response = await fetch('/api/generate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: {
              name: customerData.name || `Customer ${i + 1}`,
              email: customerData.email,
              phone: customerData.phone,
              metadata: customerData.metadata,
            },
            businessName,
            businessType,
            businessContext,
            businessUrl,
            logoUrl,
            theme: selectedTheme,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          reports.push({
            customer: customerData,
            report: data.report,
            slides: data.slides,
          });
        } else {
          console.error(`Failed for customer ${i + 1}`);
        }
      } catch (error) {
        console.error(`Error for customer ${i + 1}:`, error);
      }

      setBulkProgress({ current: i + 1, total: rawData.length });
      
      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setGeneratedReports(reports);
    setIsBulkGenerating(false);
    alert(`Generated ${reports.length} reports!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ✨ AI Report Builder
          </h1>
          <p className="text-xl text-gray-600">
            Turn boring data into fun, engaging customer reports
          </p>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <h2 className="text-3xl font-bold mb-3 text-gray-900">Step 1: Upload Your Data</h2>
            <p className="text-gray-600 mb-8">Tell us about your business and upload your customer data</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                  placeholder="e.g., FitLife Gym"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  Business Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                  placeholder="e.g., Gym, Spa, Tutoring Center, Salon"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  Business Context <span className="text-gray-400 font-normal text-sm">(Optional)</span>
                </label>
                <textarea
                  value={businessContext}
                  onChange={(e) => setBusinessContext(e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900 resize-none"
                  placeholder="e.g., We focus on functional fitness and have specialized programs for women. Our top classes are HIIT and Strength Training..."
                />
                <p className="text-sm text-gray-500 mt-2 ml-1">
                  💡 Help AI understand what makes your business unique
                </p>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  Business Website <span className="text-gray-400 font-normal text-sm">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={businessUrl}
                  onChange={(e) => setBusinessUrl(e.target.value)}
                  className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                  placeholder="https://yourwebsite.com"
                />
                <p className="text-sm text-gray-500 mt-2 ml-1">
                  🌐 AI will visit your website to match your brand voice
                </p>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  Logo URL <span className="text-gray-400 font-normal text-sm">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900"
                  placeholder="https://yourlogo.com/logo.png"
                />
                <p className="text-sm text-gray-500 mt-2 ml-1">
                  🎨 Your logo will appear on the visual report slides
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t-2 border-gray-200">
              <label className="block text-base font-semibold text-gray-800 mb-4">
                Upload Customer Data <span className="text-red-500">*</span>
              </label>
              <div className="border-3 border-dashed border-gray-400 rounded-2xl p-16 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer"
                >
                  <div className="text-7xl mb-4">📊</div>
                  <p className="text-xl font-semibold text-gray-800 mb-2">
                    Drop your CSV or Excel file here
                  </p>
                  <p className="text-base text-gray-600">
                    or click to browse your computer
                  </p>
                </label>
                {file && (
                  <div className="mt-6 p-4 bg-green-50 border-2 border-green-500 rounded-xl">
                    <p className="text-base text-green-700 font-semibold">
                      ✓ {file.name} uploaded successfully
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && (
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <h2 className="text-3xl font-bold mb-3 text-gray-900">Step 2: Map Your Columns</h2>
            <p className="text-gray-700 text-lg mb-2">
              Help us understand your data. We've made some guesses - review and adjust if needed.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-lg">
              <p className="text-base text-blue-800">
                💡 <strong>Tip:</strong> By default, all fields are set as "Extra Info" to create fun stats and comparisons!
              </p>
            </div>

            <div className="space-y-3 mb-10">
              {columnMappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-4 p-5 bg-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-lg text-gray-900 block truncate">{mapping.originalName}</span>
                    <span className="text-sm text-gray-500">Column from your file</span>
                  </div>
                  <div className="flex-shrink-0 text-gray-400 text-2xl">→</div>
                  <div className="flex-1">
                    <select
                      value={mapping.mappedTo}
                      onChange={(e) => updateColumnMapping(index, e.target.value as any)}
                      className="w-full px-4 py-3 text-base font-medium border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 cursor-pointer"
                    >
                      <option value="name">👤 Customer Name</option>
                      <option value="email">📧 Email</option>
                      <option value="phone">📱 Phone</option>
                      <option value="transaction">💳 Transaction Data</option>
                      <option value="metadata">⭐ Extra Info (for fun stats)</option>
                      <option value="ignore">🚫 Don't Use This Data</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <ThemeSelector 
                selectedTheme={selectedTheme}
                onThemeChange={setSelectedTheme}
              />
              <div className="mt-6">
                <CustomColorPicker
                  onCustomColors={(primary, accent) => {
                    // Create custom theme from colors
                    const customTheme: Theme = {
                      name: 'Custom',
                      gradients: [
                        `bg-gradient-to-br from-[${primary}] to-[${accent}]`,
                        `bg-gradient-to-br from-[${accent}] to-[${primary}]`,
                        `bg-gradient-to-br from-purple-600 to-[${primary}]`,
                        `bg-gradient-to-br from-[${primary}] to-pink-600`,
                        `bg-gradient-to-br from-blue-600 to-[${accent}]`,
                      ],
                      primaryColor: primary,
                      accentColor: accent,
                    };
                    setSelectedTheme(customTheme);
                  }}
                />
              </div>
            </div>

            <button
              onClick={generateSampleReport}
              disabled={isGenerating || !businessName || !businessType}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg py-5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Preview...
                </span>
              ) : (
                '✨ Generate Sample Report'
              )}
            </button>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div className="bg-white rounded-2xl shadow-xl p-10">
            <h2 className="text-3xl font-bold mb-3 text-gray-900">Step 3: Preview Sample Report</h2>
            <p className="text-gray-700 text-lg mb-8">Here's what your customers will receive!</p>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-2xl p-8 mb-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-base leading-relaxed text-gray-900 whitespace-pre-wrap">
                  {sampleReport}
                </div>
              </div>
            </div>

            {reportSlides && (
              <button
                onClick={() => setShowVisualReport(true)}
                className="w-full mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl py-6 rounded-2xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                ✨ View Visual Report (Wrapped Style!)
              </button>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep('mapping')}
                className="flex-1 bg-gray-100 border-2 border-gray-300 text-gray-800 text-lg py-5 rounded-xl font-semibold hover:bg-gray-200 hover:border-gray-400 transition-all"
              >
                ← Back to Mapping
              </button>
              <button
                onClick={generateBulkReports}
                disabled={isBulkGenerating}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white text-lg py-5 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
              >
                {isBulkGenerating 
                  ? `Generating ${bulkProgress.current}/${bulkProgress.total}...` 
                  : `Generate All ${rawData.length} Reports →`}
              </button>
            </div>

            {/* Bulk generation progress */}
            {isBulkGenerating && (
              <div className="mt-6 bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                <div className="flex justify-between text-sm font-semibold text-blue-900 mb-2">
                  <span>Progress</span>
                  <span>{bulkProgress.current} / {bulkProgress.total}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-2">⏱️ This may take a few minutes... (1 second per customer)</p>
              </div>
            )}

            {/* Generated reports list */}
            {generatedReports.length > 0 && !isBulkGenerating && (
              <div className="mt-6 bg-green-50 border-2 border-green-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4">
                  ✅ Generated {generatedReports.length} Reports!
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {generatedReports.map((report, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 flex justify-between items-center">
                      <span className="font-medium text-gray-800">{report.customer.name}</span>
                      <button
                        onClick={() => {
                          setReportSlides(report.slides);
                          setCurrentCustomerName(report.customer.name);
                          setShowVisualReport(true);
                        }}
                        className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        View Report
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visual Report Modal */}
        {showVisualReport && reportSlides && (
          <VisualReport
            customerName={currentCustomerName}
            businessName={businessName}
            slides={reportSlides}
            logoUrl={logoUrl}
            onClose={() => setShowVisualReport(false)}
          />
        )}
      </div>
    </div>
  );
}
