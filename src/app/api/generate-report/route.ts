import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import * as Papa from "papaparse";
import * as XLSX from "xlsx";

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
    confidence: number;
    processingTime: number;
    dataQuality: string;
    suggestions: string[];
  };
}

interface ReportAnalyzer {
  detectType: (data: any[], columns: string[]) => string;
  generateReport: (
    data: any[],
    fileName: string,
    reportType?: string
  ) => Promise<DynamicReport>;
}

interface StatInfo {
  sum: number;
  average: number;
  min: number;
  max: number;
  count: number;
}


class ReportTypeDetector {
  static detectReportType(data: any[], columns: string[]): string {
    const columnStr = columns.join(" ").toLowerCase();
    const dataStr = JSON.stringify(data.slice(0, 5)).toLowerCase();
    const combined = columnStr + " " + dataStr;

   
    if (this.hasFinancialIndicators(combined)) return "financial";

    
    if (this.hasSalesIndicators(combined)) return "sales";

   
    if (this.hasInventoryIndicators(combined)) return "inventory";

    
    if (this.hasCustomerIndicators(combined)) return "customer";

   
    if (this.hasMarketingIndicators(combined)) return "marketing";

   
    if (this.hasOperationalIndicators(combined)) return "operational";

    return "general";
  }

  private static hasFinancialIndicators(text: string): boolean {
    const financialKeywords = [
      "revenue",
      "income",
      "profit",
      "loss",
      "expense",
      "cost",
      "balance",
      "asset",
      "liability",
      "equity",
      "cash",
      "flow",
      "budget",
      "financial",
    ];
    return financialKeywords.some((keyword) => text.includes(keyword));
  }

  private static hasSalesIndicators(text: string): boolean {
    const salesKeywords = [
      "sales",
      "order",
      "purchase",
      "transaction",
      "customer",
      "product",
      "quantity",
      "price",
      "discount",
      "commission",
      "deal",
      "lead",
    ];
    return salesKeywords.some((keyword) => text.includes(keyword));
  }

  private static hasInventoryIndicators(text: string): boolean {
    const inventoryKeywords = [
      "inventory",
      "stock",
      "warehouse",
      "sku",
      "product",
      "quantity",
      "reorder",
      "supplier",
      "vendor",
      "shipment",
      "item",
    ];
    return inventoryKeywords.some((keyword) => text.includes(keyword));
  }

  private static hasCustomerIndicators(text: string): boolean {
    const customerKeywords = [
      "customer",
      "client",
      "user",
      "demographic",
      "age",
      "gender",
      "location",
      "segment",
      "behavior",
      "retention",
      "churn",
    ];
    return customerKeywords.some((keyword) => text.includes(keyword));
  }

  private static hasMarketingIndicators(text: string): boolean {
    const marketingKeywords = [
      "campaign",
      "advertisement",
      "marketing",
      "impression",
      "click",
      "conversion",
      "roi",
      "ctr",
      "engagement",
      "reach",
      "audience",
    ];
    return marketingKeywords.some((keyword) => text.includes(keyword));
  }

  private static hasOperationalIndicators(text: string): boolean {
    const operationalKeywords = [
      "efficiency",
      "productivity",
      "performance",
      "quality",
      "process",
      "operation",
      "throughput",
      "downtime",
      "utilization",
      "metric",
    ];
    return operationalKeywords.some((keyword) => text.includes(keyword));
  }
}

/* ----------   REPORT GENERATORS   ---------- */
class FinancialReportGenerator {
  static async generate(data: any[], fileName: string): Promise<any> {
    const columns = Object.keys(data[0] || {});
    const stats = this.calculateFinancialStats(data);

    // Identify financial columns
    const revenueColumns = columns.filter((col) =>
      /revenue|income|sales|earnings/i.test(col)
    );
    const expenseColumns = columns.filter((col) =>
      /expense|cost|expenditure|spend/i.test(col)
    );
    const profitColumns = columns.filter((col) =>
      /profit|net|margin/i.test(col)
    );

    const totalRevenue = this.sumColumns(data, revenueColumns);
    const totalExpenses = this.sumColumns(data, expenseColumns);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      executiveSummary: `Financial analysis of ${fileName} shows ${
        totalRevenue > 0
          ? `total revenue of $${totalRevenue.toLocaleString()}`
          : "revenue data not clearly identified"
      }, ${
        totalExpenses > 0
          ? `expenses of $${totalExpenses.toLocaleString()}`
          : "expense data not clearly identified"
      }, and ${
        netProfit !== 0
          ? `net profit of $${netProfit.toLocaleString()}`
          : "profit calculation requires revenue and expense identification"
      }.`,

      revenueAnalysis: {
        totalRevenue: `$${totalRevenue.toLocaleString()}`,
        breakdown:
          revenueColumns.length > 0
            ? `Revenue sources: ${revenueColumns.join(", ")}`
            : "Revenue sources not clearly identified",
        trends: this.analyzeTrends(data, revenueColumns, "revenue"),
      },

      costAnalysis: {
        totalCosts: `$${totalExpenses.toLocaleString()}`,
        majorCategories:
          expenseColumns.length > 0
            ? expenseColumns.join(", ")
            : "Expense categories not clearly identified",
        trends: this.analyzeTrends(data, expenseColumns, "expenses"),
      },

      profitLoss: {
        netProfit: `$${netProfit.toLocaleString()}`,
        profitMargin: `${profitMargin.toFixed(2)}%`,
        comparison:
          netProfit > 0
            ? "Profitable operations"
            : netProfit < 0
            ? "Operating at a loss"
            : "Break-even performance",
      },

      keyMetrics: {
        grossMargin: `${profitMargin.toFixed(2)}%`,
        totalTransactions: data.length,
        avgTransactionValue:
          totalRevenue > 0
            ? `$${(totalRevenue / data.length).toFixed(2)}`
            : "N/A",
      },

      recommendations: this.generateFinancialRecommendations(
        totalRevenue,
        totalExpenses,
        profitMargin
      ),

      riskFactors: this.identifyFinancialRisks(data, profitMargin),

      opportunities: this.identifyFinancialOpportunities(data, stats),

      basicStats: stats,
    };
  }

  private static sumColumns(data: any[], columns: string[]): number {
    return data.reduce((total, row) => {
      return (
        total +
        columns.reduce((colSum, col) => {
          const value = this.parseNumericValue(row[col]);
          return colSum + (isNaN(value) ? 0 : value);
        }, 0)
      );
    }, 0);
  }

  private static parseNumericValue(value: any): number {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/[,$%]/g, "");
      return parseFloat(cleaned);
    }
    return 0;
  }

  private static analyzeTrends(
    data: any[],
    columns: string[],
    type: string
  ): string {
    if (columns.length === 0) return `No clear ${type} trends identifiable`;

    // Simple trend analysis
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstHalfSum = this.sumColumns(firstHalf, columns);
    const secondHalfSum = this.sumColumns(secondHalf, columns);

    if (secondHalfSum > firstHalfSum) {
      return `${type} showing upward trend in recent period`;
    } else if (secondHalfSum < firstHalfSum) {
      return `${type} showing downward trend in recent period`;
    } else {
      return `${type} remaining relatively stable`;
    }
  }

  private static generateFinancialRecommendations(
    revenue: number,
    expenses: number,
    margin: number
  ): string[] {
    const recommendations = [];

    if (margin < 10) {
      recommendations.push(
        "Focus on cost reduction strategies to improve profit margins"
      );
    }
    if (revenue === 0) {
      recommendations.push("Implement revenue tracking and categorization");
    }
    if (expenses > revenue) {
      recommendations.push("Urgent review of expense management required");
    }

    recommendations.push("Establish regular financial reporting cadence");
    recommendations.push(
      "Consider implementing budgeting and forecasting processes"
    );

    return recommendations;
  }

  private static identifyFinancialRisks(data: any[], margin: number): string[] {
    const risks = [];

    if (margin < 0) risks.push("Operating losses pose sustainability risk");
    if (margin < 5)
      risks.push("Low profit margins indicate financial vulnerability");
    if (data.length < 10)
      risks.push(
        "Limited data sample may not represent full financial picture"
      );

    return risks;
  }

  private static identifyFinancialOpportunities(
    data: any[],
    stats: Record<string, StatInfo>
  ): string[] {
    const opportunities = [];

    opportunities.push(
      "Analyze high-performing revenue streams for scaling opportunities"
    );
    opportunities.push(
      "Implement cost optimization in largest expense categories"
    );
    opportunities.push("Develop predictive financial modeling capabilities");

    return opportunities;
  }

  private static calculateFinancialStats(
    data: any[]
  ): Record<string, StatInfo> {
    const numericColumns: Record<string, number[]> = {};

    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const numValue = this.parseNumericValue(row[key]);
        if (!isNaN(numValue) && isFinite(numValue)) {
          if (!numericColumns[key]) numericColumns[key] = [];
          numericColumns[key].push(numValue);
        }
      });
    });

    const stats: Record<string, StatInfo> = {};
    Object.keys(numericColumns).forEach((key) => {
      const values = numericColumns[key];
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        stats[key] = {
          sum,
          average: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    });

    return stats;
  }
}

class SalesReportGenerator {
  static async generate(data: any[], fileName: string): Promise<any> {
    const columns = Object.keys(data[0] || {});
    const stats = this.calculateSalesStats(data);

    // Identify sales-related columns
    const salesColumns = columns.filter((col) =>
      /sales|revenue|amount|total|price/i.test(col)
    );
    const quantityColumns = columns.filter((col) =>
      /quantity|qty|units|count/i.test(col)
    );
    const customerColumns = columns.filter((col) =>
      /customer|client|user|buyer/i.test(col)
    );
    const productColumns = columns.filter((col) =>
      /product|item|sku|name/i.test(col)
    );

    const totalSales = this.sumColumns(data, salesColumns);
    const totalQuantity = this.sumColumns(data, quantityColumns);
    const uniqueCustomers = this.countUnique(data, customerColumns);
    const uniqueProducts = this.countUnique(data, productColumns);
    const avgOrderValue =
      totalSales > 0 && data.length > 0 ? totalSales / data.length : 0;

    return {
      executiveSummary: `Sales analysis of ${fileName} reveals ${
        data.length
      } transactions with total sales of $${totalSales.toLocaleString()}, ${uniqueCustomers} unique customers, and ${uniqueProducts} unique products.`,

      salesOverview: {
        totalSales: `$${totalSales.toLocaleString()}`,
        totalTransactions: data.length,
        avgOrderValue: `$${avgOrderValue.toFixed(2)}`,
        totalQuantity: totalQuantity.toLocaleString(),
      },

      customerAnalysis: {
        uniqueCustomers: uniqueCustomers.toLocaleString(),
        avgCustomerValue:
          uniqueCustomers > 0
            ? `$${(totalSales / uniqueCustomers).toFixed(2)}`
            : "N/A",
        repeatCustomerRate: this.calculateRepeatRate(data, customerColumns),
      },

      productAnalysis: {
        uniqueProducts: uniqueProducts.toLocaleString(),
        topProducts: this.getTopProducts(data, productColumns, salesColumns),
        avgProductPrice:
          uniqueProducts > 0
            ? `$${(totalSales / totalQuantity).toFixed(2)}`
            : "N/A",
      },

      trends: this.analyzeSalesTrends(data, salesColumns),

      recommendations: this.generateSalesRecommendations(data, stats),

      opportunities: [
        "Focus on high-value customer segments",
        "Optimize product mix based on performance",
        "Implement upselling strategies for top customers",
      ],

      basicStats: stats,
    };
  }

  private static sumColumns(data: any[], columns: string[]): number {
    return data.reduce((total, row) => {
      return (
        total +
        columns.reduce((colSum, col) => {
          const value = parseFloat(String(row[col]).replace(/[,$]/g, ""));
          return colSum + (isNaN(value) ? 0 : value);
        }, 0)
      );
    }, 0);
  }

  private static countUnique(data: any[], columns: string[]): number {
    const unique = new Set();
    data.forEach((row) => {
      columns.forEach((col) => {
        if (row[col]) unique.add(row[col]);
      });
    });
    return unique.size;
  }

  private static calculateRepeatRate(
    data: any[],
    customerColumns: string[]
  ): string {
    if (customerColumns.length === 0) return "N/A";

    const customerCounts = new Map();
    data.forEach((row) => {
      customerColumns.forEach((col) => {
        if (row[col]) {
          customerCounts.set(row[col], (customerCounts.get(row[col]) || 0) + 1);
        }
      });
    });

    const repeatCustomers = Array.from(customerCounts.values()).filter(
      (count) => count > 1
    ).length;
    const totalCustomers = customerCounts.size;

    return totalCustomers > 0
      ? `${((repeatCustomers / totalCustomers) * 100).toFixed(1)}%`
      : "N/A";
  }

  private static getTopProducts(
    data: any[],
    productColumns: string[],
    salesColumns: string[]
  ): string {
    if (productColumns.length === 0) return "Product data not identified";

    const productSales = new Map();
    data.forEach((row) => {
      productColumns.forEach((productCol) => {
        if (row[productCol]) {
          const sales = salesColumns.reduce((sum, salesCol) => {
            const value = parseFloat(
              String(row[salesCol]).replace(/[,$]/g, "")
            );
            return sum + (isNaN(value) ? 0 : value);
          }, 0);
          productSales.set(
            row[productCol],
            (productSales.get(row[productCol]) || 0) + sales
          );
        }
      });
    });

    const sortedProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return sortedProducts
      .map(([product, sales]) => `${product}: $${sales.toLocaleString()}`)
      .join(", ");
  }

  private static analyzeSalesTrends(
    data: any[],
    salesColumns: string[]
  ): string {
    // Simple trend analysis
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstHalfSales = this.sumColumns(firstHalf, salesColumns);
    const secondHalfSales = this.sumColumns(secondHalf, salesColumns);

    if (secondHalfSales > firstHalfSales * 1.1) {
      return "Strong upward sales trend observed";
    } else if (secondHalfSales < firstHalfSales * 0.9) {
      return "Declining sales trend requires attention";
    } else {
      return "Sales performance relatively stable";
    }
  }

  private static generateSalesRecommendations(
    data: any[],
    stats: Record<string, StatInfo>
  ): string[] {
    return [
      "Implement customer segmentation for targeted marketing",
      "Analyze seasonal patterns for inventory planning",
      "Develop loyalty programs to increase repeat purchases",
      "Focus on high-margin products for revenue optimization",
    ];
  }

  private static calculateSalesStats(data: any[]): Record<string, StatInfo> {
    const numericColumns: Record<string, number[]> = {};

    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        let value = row[key];
        if (typeof value === "string") {
          value = value.replace(/[,$%]/g, "");
        }
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          if (!numericColumns[key]) numericColumns[key] = [];
          numericColumns[key].push(numValue);
        }
      });
    });

    const stats: Record<string, StatInfo> = {};
    Object.keys(numericColumns).forEach((key) => {
      const values = numericColumns[key];
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        stats[key] = {
          sum,
          average: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    });

    return stats;
  }
}

class GeneralReportGenerator {
  static async generate(data: any[], fileName: string): Promise<any> {
    const columns = Object.keys(data[0] || {});
    const stats = this.calculateBasicStats(data);

    return {
      executiveSummary: `General analysis of ${fileName} containing ${
        data.length
      } records across ${
        columns.length
      } columns. Data types include ${this.identifyDataTypes(data).join(
        ", "
      )}.`,

      dataOverview: {
        totalRecords: data.length,
        totalColumns: columns.length,
        dataTypes: this.identifyDataTypes(data),
        completeness: this.calculateCompleteness(data),
      },

      columnAnalysis: this.analyzeColumns(data, stats),

      dataQuality: this.assessDataQuality(data),

      insights: this.generateGeneralInsights(data, stats),

      recommendations: [
        "Consider data standardization for better analysis",
        "Implement data validation rules",
        "Add meaningful column descriptions",
        "Regular data quality assessments recommended",
      ],

      basicStats: stats,
    };
  }

  private static identifyDataTypes(data: any[]): string[] {
    if (data.length === 0) return [];

    const sample = data[0];
    const types = new Set<string>();

    Object.values(sample).forEach((value) => {
      if (typeof value === "number") types.add("numeric");
      else if (typeof value === "string") {
        if (!isNaN(Date.parse(value))) types.add("date");
        else if (!isNaN(parseFloat(value))) types.add("numeric");
        else types.add("text");
      } else if (typeof value === "boolean") types.add("boolean");
    });

    return Array.from(types);
  }

  private static calculateCompleteness(data: any[]): string {
    const totalCells = data.length * Object.keys(data[0] || {}).length;
    const filledCells = data.reduce((sum, row) => {
      return (
        sum +
        Object.values(row).filter(
          (value) => value !== null && value !== undefined && value !== ""
        ).length
      );
    }, 0);

    return `${((filledCells / totalCells) * 100).toFixed(1)}%`;
  }

  private static analyzeColumns(
    data: any[],
    stats: Record<string, StatInfo>
  ): Record<string, any> {
    const analysis: Record<string, any> = {};

    Object.keys(data[0] || {}).forEach((column) => {
      const values = data
        .map((row) => row[column])
        .filter((v) => v !== null && v !== undefined);

      analysis[column] = {
        dataType: this.inferColumnType(values),
        completeness: `${((values.length / data.length) * 100).toFixed(1)}%`,
        uniqueValues: new Set(values).size,
        statistics: stats[column] || null,
      };
    });

    return analysis;
  }

  private static inferColumnType(values: any[]): string {
    if (values.length === 0) return "empty";

    const sample = values[0];
    if (typeof sample === "number") return "numeric";
    if (typeof sample === "boolean") return "boolean";

    // Check for dates
    if (typeof sample === "string" && !isNaN(Date.parse(sample))) return "date";

    // Check for numeric strings
    if (
      typeof sample === "string" &&
      !isNaN(parseFloat(sample.replace(/[,$%]/g, "")))
    )
      return "numeric";

    return "text";
  }

  private static assessDataQuality(data: any[]): Record<string, any> {
    const columns = Object.keys(data[0] || {});
    const totalCells = data.length * columns.length;

    let missingValues = 0;
    let duplicateRows = 0;

    // Count missing values
    data.forEach((row) => {
      columns.forEach((col) => {
        if (row[col] === null || row[col] === undefined || row[col] === "") {
          missingValues++;
        }
      });
    });

    // Count duplicate rows (simplified)
    const uniqueRows = new Set(data.map((row) => JSON.stringify(row)));
    duplicateRows = data.length - uniqueRows.size;

    return {
      missingValueRate: `${((missingValues / totalCells) * 100).toFixed(1)}%`,
      duplicateRows: duplicateRows,
      overallQuality:
        missingValues < totalCells * 0.1
          ? "Good"
          : missingValues < totalCells * 0.3
          ? "Fair"
          : "Poor",
    };
  }

  private static generateGeneralInsights(
    data: any[],
    stats: Record<string, StatInfo>
  ): string[] {
    const insights = [];

    insights.push(
      `Dataset contains ${data.length} records with ${
        Object.keys(data[0] || {}).length
      } attributes`
    );

    const numericColumns = Object.keys(stats);
    if (numericColumns.length > 0) {
      insights.push(
        `${numericColumns.length} numeric columns identified for statistical analysis`
      );
    }

    const completeness = this.calculateCompleteness(data);
    insights.push(`Data completeness: ${completeness}`);

    return insights;
  }

  private static calculateBasicStats(data: any[]): Record<string, StatInfo> {
    const numericColumns: Record<string, number[]> = {};

    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        let value = row[key];
        if (typeof value === "string") {
          value = value.replace(/[,$%]/g, "");
        }
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          if (!numericColumns[key]) numericColumns[key] = [];
          numericColumns[key].push(numValue);
        }
      });
    });

    const stats: Record<string, StatInfo> = {};
    Object.keys(numericColumns).forEach((key) => {
      const values = numericColumns[key];
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        stats[key] = {
          sum,
          average: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
    });

    return stats;
  }
}

/* ----------   UTILITY FUNCTIONS   ---------- */
async function parseFile(file: File): Promise<any[]> {
  const buffer = await file.arrayBuffer();
  const extension = file.name.split(".").pop()?.toLowerCase();

  try {
    if (extension === "csv") {
      const text = new TextDecoder().decode(buffer);
      const result = Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });
      return result.data;
    } else if (extension === "xlsx" || extension === "xls") {
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    } else {
      throw new Error(`Unsupported file format: ${extension}`);
    }
  } catch (error) {
    console.error("Error parsing file:", error);
    throw new Error(
      `Failed to parse file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

async function generateDynamicReport(
  data: any[],
  fileName: string,
  preferredType: string
): Promise<DynamicReport> {
  const startTime = Date.now();

  // Detect report type if not specified or if 'auto'
  const columns = Object.keys(data[0] || {});
  const detectedType =
    preferredType === "auto"
      ? ReportTypeDetector.detectReportType(data, columns)
      : preferredType;

  let reportData: any;
  let reportType = detectedType;

  // Generate report based on type
  switch (detectedType) {
    case "financial":
      reportData = await FinancialReportGenerator.generate(data, fileName);
      break;
    case "sales":
      reportData = await SalesReportGenerator.generate(data, fileName);
      break;
    case "inventory":
    case "customer":
    case "marketing":
    case "operational":
      // For now, use general report generator for these types
      // You can implement specific generators later
      reportData = await GeneralReportGenerator.generate(data, fileName);
      reportType = "general";
      break;
    default:
      reportData = await GeneralReportGenerator.generate(data, fileName);
      reportType = "general";
  }

  const processingTime = Date.now() - startTime;

  // Create the dynamic report
  const report: DynamicReport = {
    id: uuidv4(),
    fileName,
    generatedAt: new Date().toISOString(),
    reportType,
    data: reportData,
    summary: {
      totalRecords: data.length,
      totalColumns: columns.length,
      reportType: reportType,
      keyInsights: reportData.executiveSummary || "No summary available",
    },
    dataInfo: {
      rowsAnalyzed: data.length,
      columnsAnalyzed: columns.length,
    },
    metadata: {
      confidence: calculateConfidence(data, columns, reportType),
      processingTime,
      dataQuality: assessOverallDataQuality(data),
      suggestions: generateSuggestions(data, reportType),
    },
  };

  return report;
}

function calculateConfidence(
  data: any[],
  columns: string[],
  reportType: string
): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence based on data size
  if (data.length > 100) confidence += 0.2;
  if (data.length > 1000) confidence += 0.1;

  // Increase confidence based on column relevance
  const relevantColumns = getRelevantColumns(columns, reportType);
  if (relevantColumns.length > 0) {
    confidence += (relevantColumns.length / columns.length) * 0.3;
  }

  return Math.min(confidence, 1.0);
}

function getRelevantColumns(columns: string[], reportType: string): string[] {
  const lowerColumns = columns.map((col) => col.toLowerCase());

  switch (reportType) {
    case "financial":
      return lowerColumns.filter((col) =>
        /revenue|income|profit|expense|cost|balance|asset|liability/.test(col)
      );
    case "sales":
      return lowerColumns.filter((col) =>
        /sales|order|purchase|customer|product|quantity|price/.test(col)
      );
    default:
      return [];
  }
}

function assessOverallDataQuality(data: any[]): string {
  if (data.length === 0) return "Poor";

  const columns = Object.keys(data[0] || {});
  const totalCells = data.length * columns.length;

  let missingValues = 0;
  data.forEach((row) => {
    columns.forEach((col) => {
      if (row[col] === null || row[col] === undefined || row[col] === "") {
        missingValues++;
      }
    });
  });

  const completeness = (totalCells - missingValues) / totalCells;

  if (completeness >= 0.9) return "Excellent";
  if (completeness >= 0.7) return "Good";
  if (completeness >= 0.5) return "Fair";
  return "Poor";
}

function generateSuggestions(data: any[], reportType: string): string[] {
  const suggestions = [];

  // General suggestions
  if (data.length < 50) {
    suggestions.push(
      "Consider collecting more data for better analysis accuracy"
    );
  }

  // Type-specific suggestions
  switch (reportType) {
    case "financial":
      suggestions.push("Add date columns for time-series analysis");
      suggestions.push("Include budget vs actual comparisons");
      break;
    case "sales":
      suggestions.push("Include customer acquisition cost data");
      suggestions.push("Add seasonal trend indicators");
      break;
    default:
      suggestions.push("Consider adding metadata for better categorization");
      suggestions.push("Implement data validation rules");
  }

  return suggestions;
}

function createErrorReport(
  fileName: string,
  errorMessage: string
): DynamicReport {
  return {
    id: uuidv4(),
    fileName,
    generatedAt: new Date().toISOString(),
    reportType: "error",
    data: {
      error: errorMessage,
      executiveSummary: `Failed to process ${fileName}: ${errorMessage}`,
    },
    summary: {
      totalRecords: 0,
      totalColumns: 0,
      reportType: "error",
      keyInsights: `Error processing file: ${errorMessage}`,
    },
    dataInfo: {
      rowsAnalyzed: 0,
      columnsAnalyzed: 0,
    },
    metadata: {
      confidence: 0,
      processingTime: 0,
      dataQuality: "Poor",
      suggestions: ["Fix data format issues", "Ensure file is not corrupted"],
    },
  };
}

/* ----------   MAIN API HANDLER   ---------- */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    console.log("Starting dynamic report generation...");

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const preferredReportType =
      (formData.get("reportType") as string) || "auto";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    console.log(
      `Processing ${files.length} file(s) with report type preference: ${preferredReportType}`
    );
    const reports: DynamicReport[] = [];

    // Process each file
    for (const file of files) {
      try {
        console.log(`Processing: ${file.name}`);

        // Parse the file
        const parsedData = await parseFile(file);

        if (!parsedData || parsedData.length === 0) {
          console.warn(`No data found in file: ${file.name}`);
          reports.push(createErrorReport(file.name, "No data found in file"));
          continue;
        }

        // Generate the dynamic report
        const report = await generateDynamicReport(
          parsedData,
          file.name,
          preferredReportType
        );
        reports.push(report);

        console.log(
          `Successfully processed: ${file.name} as ${report.reportType} report`
        );
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        const errorMessage =
          fileError instanceof Error ? fileError.message : "Unknown error";
        reports.push(createErrorReport(file.name, errorMessage));
      }
    }

    const processingTime = Date.now() - startTime;

    if (reports.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files could be processed successfully" },
        { status: 400 }
      );
    }

    // Return successful response
    const response = {
      success: true,
      message: `Successfully processed ${reports.length} file(s)`,
      reports,
      metadata: {
        totalFiles: files.length,
        successfulReports: reports.filter((r) => r.reportType !== "error")
          .length,
        failedReports: reports.filter((r) => r.reportType === "error").length,
        totalProcessingTime: processingTime,
        timestamp: new Date().toISOString(),
      },
    };

    console.log(`Report generation completed in ${processingTime}ms`);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in report generation API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET method for health check
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "healthy",
    service: "Dynamic Report Generator API",
    version: "1.0.0",
    supportedFormats: ["csv", "xlsx", "xls"],
    reportTypes: [
      "financial",
      "sales",
      "inventory",
      "customer",
      "marketing",
      "operational",
      "general",
    ],
    timestamp: new Date().toISOString(),
  });
}
