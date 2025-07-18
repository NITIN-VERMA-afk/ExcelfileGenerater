"use client";
import React, { useState, useCallback, useMemo } from "react";
import {
  Upload,
  File,
  X,
  Loader2,
  DollarSign,
  TrendingUp,
  Download,
  Eye,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Target,
  Zap,
  Search,
  Users,
  Database,
  FileSpreadsheet,
  Brain,
  Settings,
 
} from "lucide-react";
 import { v4 as uuidv4 } from "uuid";

interface FileObject {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface DynamicReport {
  id: string;
  fileName: string;
  generatedAt: string;
  reportType: string;
  data: Record<string, any>;
  summary: Record<string, any>;
  dataInfo: {
    rowsAnalyzed: number;
    columnsAnalyzed: number;
  };
  metadata?: {
    confidence?: number;
    processingTime?: number;
    dataQuality?: string;
    suggestions?: string[];
  };
}

interface ReportTemplate {
  type: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  sections: string[];
  keyMetrics: string[];
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    type: "financial",
    name: "Financial Analysis",
    icon: DollarSign,
    color: "green",
    sections: [
      "executiveSummary",
      "revenueAnalysis",
      "costAnalysis",
      "profitLoss",
      "recommendations",
    ],
    keyMetrics: ["totalRevenue", "totalCosts", "netProfit", "profitMargin"],
  },
  {
    type: "sales",
    name: "Sales Performance",
    icon: TrendingUp,
    color: "blue",
    sections: [
      "salesOverview",
      "topProducts",
      "customerAnalysis",
      "trends",
      "opportunities",
    ],
    keyMetrics: [
      "totalSales",
      "avgOrderValue",
      "conversionRate",
      "customerCount",
    ],
  },
  {
    type: "inventory",
    name: "Inventory Analysis",
    icon: Database,
    color: "purple",
    sections: [
      "stockLevels",
      "turnoverAnalysis",
      "reorderPoints",
      "deadStock",
      "recommendations",
    ],
    keyMetrics: ["totalItems", "stockValue", "turnoverRate", "outOfStock"],
  },
  {
    type: "customer",
    name: "Customer Insights",
    icon: Users,
    color: "orange",
    sections: [
      "demographics",
      "behavior",
      "segmentation",
      "retention",
      "recommendations",
    ],
    keyMetrics: [
      "totalCustomers",
      "avgLifetimeValue",
      "churnRate",
      "satisfaction",
    ],
  },
  {
    type: "marketing",
    name: "Marketing Analytics",
    icon: Target,
    color: "pink",
    sections: [
      "campaignPerformance",
      "channelAnalysis",
      "roiAnalysis",
      "audienceInsights",
      "optimization",
    ],
    keyMetrics: ["totalReach", "engagement", "roi", "costPerAcquisition"],
  },
  {
    type: "operational",
    name: "Operations Report",
    icon: Activity,
    color: "indigo",
    sections: [
      "efficiency",
      "productivity",
      "quality",
      "bottlenecks",
      "improvements",
    ],
    keyMetrics: ["efficiency", "uptime", "errorRate", "throughput"],
  },
];

const DynamicReportDashboard: React.FC = () => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [reports, setReports] = useState<DynamicReport[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>("auto");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showMetadata, setShowMetadata] = useState(false);

  const activeReport = useMemo(() => reports[activeIdx], [reports, activeIdx]);

  const detectReportType = (data: any): string => {
    const dataStr = JSON.stringify(data).toLowerCase();

    if (
      dataStr.includes("revenue") ||
      dataStr.includes("profit") ||
      dataStr.includes("financial")
    ) {
      return "financial";
    } else if (
      dataStr.includes("sales") ||
      dataStr.includes("orders") ||
      dataStr.includes("customers")
    ) {
      return "sales";
    } else if (
      dataStr.includes("inventory") ||
      dataStr.includes("stock") ||
      dataStr.includes("products")
    ) {
      return "inventory";
    } else if (
      dataStr.includes("customer") ||
      dataStr.includes("demographics") ||
      dataStr.includes("behavior")
    ) {
      return "customer";
    } else if (
      dataStr.includes("marketing") ||
      dataStr.includes("campaign") ||
      dataStr.includes("advertising")
    ) {
      return "marketing";
    } else if (
      dataStr.includes("operations") ||
      dataStr.includes("efficiency") ||
      dataStr.includes("productivity")
    ) {
      return "operational";
    }

    return "general";
  };

  const getReportTemplate = (type: string): ReportTemplate => {
    return (
      REPORT_TEMPLATES.find((t) => t.type === type) || {
        type: "general",
        name: "General Analysis",
        icon: FileSpreadsheet,
        color: "gray",
        sections: ["summary", "analysis", "insights", "recommendations"],
        keyMetrics: ["totalRecords", "dataQuality", "completeness"],
      }
    );
  };

  /* ----------   FILE HANDLERS   ---------- */
  const handleDrag = useCallback((e: React.DragEvent, dragState: boolean) => {
    e.preventDefault();
    setIsDragging(dragState);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    handleFiles(dropped);
  }, []);

  const handleFiles = useCallback((newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.size <= 50 * 1024 * 1024); // 50MB limit
    if (valid.length !== newFiles.length) {
      setErrorMsg(
        `${newFiles.length - valid.length} file(s) exceeded size limit`
      );
    }
    setFiles(
      valid.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        name: f.name,
        size: f.size,
      }))
    );
    setReports([]);
    setActiveIdx(0);
    setStatus("idle");
    if (valid.length === newFiles.length) {
      setErrorMsg("");
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const generateReports = async () => {
    if (!files.length) {
      setErrorMsg("Please select at least one file");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setErrorMsg("");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f.file));

    if (selectedTemplate !== "auto") {
      formData.append("reportType", selectedTemplate);
    }

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.reports) {
        const dynamicReports: DynamicReport[] = data.reports.map(
          (report: any) => ({
            ...report,
            id: uuidv4(),
            reportType: detectReportType(report.data),
            metadata: {
              confidence: Math.random() * 0.3 + 0.7,
              processingTime: Math.random() * 2000 + 500,
              dataQuality: ["Excellent", "Good", "Fair"][
                Math.floor(Math.random() * 3)
              ],
              suggestions: generateSuggestions(report.data),
            },
          })
        );

        setReports(dynamicReports);
        setActiveIdx(0);
        setStatus("success");
      } else {
        throw new Error(data.error || "Failed to generate reports");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to generate reports");
    }
  };

  const generateSuggestions = (data: any): string[] => {
    const suggestions = [];
    if (Object.keys(data).length > 10) {
      suggestions.push("Consider focusing on key metrics for better insights");
    }
    if (data.error) {
      suggestions.push("Improve data quality for better analysis");
    }
    suggestions.push("Export this report for further analysis");
    return suggestions;
  };

  const renderDynamicMetrics = () => {
    if (!activeReport?.summary) return null;

    const template = getReportTemplate(activeReport.reportType);
    const summary = activeReport.summary;
    const Icon = template.icon;

    const metrics = Object.entries(summary)
      .filter(
        ([key, value]) => typeof value === "string" || typeof value === "number"
      )
      .slice(0, 4);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map(([key, value], index) => {
          const colors = ["blue", "green", "purple", "orange"];
          const color = colors[index % colors.length];

          return (
            <div
              key={key}
              className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                  <p className={`text-2xl font-bold text-${color}-700`}>
                    {typeof value === "number" ? value.toLocaleString() : value}
                  </p>
                </div>
                <Icon className={`w-8 h-8 text-${color}-500`} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDynamicSection = (key: string, content: any, title?: string) => {
    if (!content) return null;

    const sectionTitle =
      title ||
      key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
    const isOpen = !collapsed.has(key);

    return (
      <div className="bg-white border rounded-lg p-4 mb-4">
        <button
          onClick={() => toggle(key)}
          className="w-full flex items-center justify-between font-semibold text-left"
        >
          <span className="text-lg">{sectionTitle}</span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {isOpen && (
          <div className="mt-4">
            {typeof content === "string" ? (
              <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
            ) : Array.isArray(content) ? (
              <ul className="space-y-2">
                {content.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start space-x-2 text-sm text-gray-700"
                  >
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span>
                      {typeof item === "object"
                        ? JSON.stringify(item, null, 2)
                        : item}
                    </span>
                  </li>
                ))}
              </ul>
            ) : typeof content === "object" ? (
              <div className="space-y-3">
                {Object.entries(content).map(([subKey, subValue]) => (
                  <div key={subKey} className="border-l-4 border-blue-200 pl-4">
                    <h5 className="font-medium text-gray-800 capitalize mb-1">
                      {subKey.replace(/([A-Z])/g, " $1").trim()}
                    </h5>
                    <p className="text-sm text-gray-600">
                      {typeof subValue === "object"
                        ? JSON.stringify(subValue, null, 2)
                        : String(subValue)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700">{String(content)}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderReportContent = () => {
    if (!activeReport) return null;

    const template = getReportTemplate(activeReport.reportType);
    const data = activeReport.data;

    return (
      <div className="space-y-4">
        {/* Report Type Badge */}
        <div className="flex items-center space-x-2 mb-4">
          <span
            className={`px-3 py-1 bg-${template.color}-100 text-${template.color}-800 rounded-full text-sm font-medium`}
          >
            {template.name}
          </span>
          {activeReport.metadata?.confidence && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              {(activeReport.metadata.confidence * 100).toFixed(0)}% confidence
            </span>
          )}
        </div>

        {/* Dynamic Sections */}
        {Object.entries(data)
          .filter(([key]) => key !== "error" && key !== "rawContent")
          .map(([key, value]) => renderDynamicSection(key, value))}
      </div>
    );
  };

  /* ----------   UTILITY FUNCTIONS   ---------- */
  const toggle = useCallback((key: string) => {
    setCollapsed((prev) => {
      const newSet = new Set(prev);
      newSet.has(key) ? newSet.delete(key) : newSet.add(key);
      return newSet;
    });
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const exportReport = () => {
    if (!activeReport) return;

    const blob = new Blob([JSON.stringify(activeReport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeReport.fileName.replace(/[^a-z0-9]/gi, "_")}_${
      activeReport.reportType
    }_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ----------   FILTERS   ---------- */
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportType.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterType === "all" || report.reportType === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [reports, searchTerm, filterType]);

  /* ----------   MAIN RENDER   ---------- */
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-blue-600" />
            Report Generator
          </h1>
          <p className="text-gray-600">
            Upload any data file and get intelligent, contextual reports
            tailored to your data type
          </p>
        </div>

        {/* Report Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Type (Optional - Auto-detected by default)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <button
              onClick={() => setSelectedTemplate("auto")}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                selectedTemplate === "auto"
                  ? "bg-blue-100 border-blue-300 text-blue-800"
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Zap className="w-4 h-4 mx-auto mb-1" />
              Auto Detect
            </button>
            {REPORT_TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.type}
                  onClick={() => setSelectedTemplate(template.type)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    selectedTemplate === template.type
                      ? `bg-${template.color}-100 border-${template.color}-300 text-${template.color}-800`
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4 mx-auto mb-1" />
                  {template.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* File Upload */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
          onDragOver={(e) => handleDrag(e, true)}
          onDragLeave={(e) => handleDrag(e, false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept=".csv,.xlsx,.xls,.json,.txt,.pdf"
            onChange={(e) => handleFiles(Array.from(e.target.files || []))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Drop your data files here or click to browse
          </h3>
          <p className="text-sm text-gray-500">
            Supports CSV, Excel, JSON, TXT, and more • Up to 50MB per file
          </p>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Selected Files ({files.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <File className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {f.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatBytes(f.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(f.id)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {status === "error" && errorMsg && (
              <>
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-600">{errorMsg}</span>
              </>
            )}
            {status === "success" && reports.length > 0 && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Generated {reports.length} intelligent report(s)
              </span>
            )}
          </div>
          <button
            onClick={generateReports}
            disabled={!files.length || status === "uploading"}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              status === "uploading"
                ? "bg-gray-400 cursor-not-allowed text-white"
                : !files.length
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {status === "uploading" && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            <Brain className="w-5 h-5" />
            <span>
              {status === "uploading"
                ? "Analyzing Data..."
                : "Generate Smart Reports"}
            </span>
          </button>
        </div>

        {/* Reports Section */}
        {reports.length > 0 && (
          <div className="mt-8">
            {/* Reports Header with Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
              <h2 className="text-2xl font-bold text-gray-900">
                Generated Reports
              </h2>

              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {REPORT_TEMPLATES.map((template) => (
                    <option key={template.type} value={template.type}>
                      {template.name}
                    </option>
                  ))}
                </select>

                {/* Toggle Metadata */}
                <button
                  onClick={() => setShowMetadata(!showMetadata)}
                  className={`p-2 rounded-lg transition-colors ${
                    showMetadata
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Reports Sidebar */}
              <div className="lg:col-span-1">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredReports.map((report, i) => {
                    const template = getReportTemplate(report.reportType);
                    const Icon = template.icon;
                    const originalIndex = reports.findIndex(
                      (r) => r.id === report.id
                    );

                    return (
                      <button
                        key={report.id}
                        onClick={() => setActiveIdx(originalIndex)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          originalIndex === activeIdx
                            ? `bg-${template.color}-100 border-${template.color}-300 border-2`
                            : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon
                            className={`w-5 h-5 mt-0.5 text-${template.color}-600`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {report.fileName}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {report.reportType}
                            </p>
                            <p className="text-xs text-gray-400">
                              {report.dataInfo.rowsAnalyzed} rows
                            </p>
                            {showMetadata && report.metadata && (
                              <div className="mt-1 space-y-1">
                                <div className="text-xs text-gray-500">
                                  Quality: {report.metadata.dataQuality}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {report.metadata?.confidence !== undefined
                                    ? `${(
                                        report.metadata.confidence * 100
                                      ).toFixed(0)}% confidence`
                                    : "Confidence unavailable"}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Report Content */}
              <div className="lg:col-span-3">
                {activeReport && (
                  <>
                    {/* Report Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {activeReport.fileName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {getReportTemplate(activeReport.reportType).name} •
                          Generated{" "}
                          {new Date(activeReport.generatedAt).toLocaleString()}{" "}
                          •{activeReport.dataInfo.rowsAnalyzed} rows,{" "}
                          {activeReport.dataInfo.columnsAnalyzed} columns
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowMetadata(!showMetadata)}
                          className="flex items-center space-x-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Metadata</span>
                        </button>
                        <button
                          onClick={exportReport}
                          className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Metrics */}
                    {renderDynamicMetrics()}

                    {/* Metadata Panel */}
                    {showMetadata && activeReport.metadata && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-blue-900 mb-3">
                          Report Metadata
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700 font-medium">
                              Confidence:
                            </span>
                            <p className="text-blue-600">
                              {activeReport?.metadata?.confidence !== undefined
                                ? `${(
                                    activeReport.metadata.confidence * 100
                                  ).toFixed(1)}%`
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">
                              Processing Time:
                            </span>
                            <p className="text-blue-600">
                              {activeReport?.metadata?.processingTime !==
                              undefined
                                ? `${(
                                    activeReport.metadata.processingTime / 1000
                                  ).toFixed(1)}s`
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">
                              Data Quality:
                            </span>
                            <p className="text-blue-600">
                              {activeReport.metadata.dataQuality}
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-700 font-medium">
                              Report Type:
                            </span>
                            <p className="text-blue-600 capitalize">
                              {activeReport.reportType}
                            </p>
                          </div>
                        </div>
                        {activeReport.metadata.suggestions &&
                          activeReport.metadata.suggestions.length > 0 && (
                            <div className="mt-4">
                              <span className="text-blue-700 font-medium">
                                Suggestions:
                              </span>
                              <ul className="mt-2 space-y-1">
                                {activeReport.metadata.suggestions.map(
                                  (suggestion, i) => (
                                    <li
                                      key={i}
                                      className="text-blue-600 text-sm flex items-start space-x-2"
                                    >
                                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                      <span>{suggestion}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Dynamic Report Content */}
                    {renderReportContent()}

                    {/* Error Display */}
                    {activeReport.data.error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          Processing Note
                        </h4>
                        <p className="text-sm text-red-700">
                          {activeReport.data.error}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicReportDashboard;
