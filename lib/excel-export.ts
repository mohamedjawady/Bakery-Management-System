import type { Order } from "@/types/order"

export async function generateExcelFile(
  orders: Order[],
  userLabName: string | null,
  pendingOrders: Order[],
  productTotalsArray: Array<{ productName: string; productRef?: string; totalQuantity: number }>,
) {
  const ExcelJS = await import("exceljs").then((m) => m.default || m)
  const workbook = new ExcelJS.Workbook()

  const ordersToProduce = orders.filter((order) => order.status === "PENDING")

  // Build a matrix: products x bakeries with quantities
  const bakeries = Array.from(new Set(ordersToProduce.map((o) => o.bakeryName))).sort()
  const products = Array.from(
    new Set(ordersToProduce.flatMap((o) => o.products.map((p) => `${p.productName}|${p.productRef || ""}`))),
  ).sort()

  // Create matrix structure
  const matrix: { [productKey: string]: { [bakery: string]: number } } = {}
  products.forEach((productKey) => {
    matrix[productKey] = {}
    bakeries.forEach((bakery) => {
      matrix[productKey][bakery] = 0
    })
  })

  // Fill the matrix with quantities
  ordersToProduce.forEach((order) => {
    order.products.forEach((product) => {
      const productKey = `${product.productName}|${product.productRef || ""}`
      if (matrix[productKey]) {
        matrix[productKey][order.bakeryName] = (matrix[productKey][order.bakeryName] || 0) + product.quantity
      }
    })
  })

  // Sheet 1: Production Matrix (like the image provided)
  const matrixSheet = workbook.addWorksheet("Tableau Production")

  // Header row with bakery names
  const headerRow = matrixSheet.addRow(["PRODUIT", "REF", ...bakeries, "TOTAL"])
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8A542" }, // Orange like your image
  }
  headerRow.font = { bold: true, color: { argb: "FF000000" } }

  // Data rows
  const dataRows: Array<ExcelJS.Row> = []
  const bakeryCategoryTotals: { [bakery: string]: number } = {}
  bakeries.forEach((b) => {
    bakeryCategoryTotals[b] = 0
  })

  products.forEach((productKey) => {
    const [productName, productRef] = productKey.split("|")
    const row = matrixSheet.addRow([
      productName,
      productRef || "",
      ...bakeries.map((bakery) => matrix[productKey][bakery] || 0),
      productTotalsArray.find((p) => p.productName === productName)?.totalQuantity || 0,
    ])

    // Alternate row colors like your image
    const isEven = products.indexOf(productKey) % 2 === 0
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isEven ? "FFFEF3E8" : "FFFEFBF7" }, // Beige alternating
    }

    dataRows.push(row)
    row.font = { size: 10 }
  })

  // Total row at bottom
  const totalRow = matrixSheet.addRow([
    "TOTAL",
    "",
    ...bakeries.map((bakery) => {
      return products.reduce((sum, productKey) => {
        return sum + (matrix[productKey][bakery] || 0)
      }, 0)
    }),
    productTotalsArray.reduce((sum, p) => sum + p.totalQuantity, 0),
  ])
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8A542" }, // Orange like your image
  }
  totalRow.font = { bold: true, size: 11 }

  // Set column widths
  matrixSheet.columns = [
    { width: 30 }, // PRODUIT
    { width: 12 }, // REF
    ...bakeries.map(() => ({ width: 10 })),
    { width: 12 }, // TOTAL
  ]

  // Sheet 2: Detailed Breakdown per Bakery
  const detailSheet = workbook.addWorksheet("Détail par Boulangerie")
  detailSheet.columns = [
    { header: "Boulangerie", key: "bakeryName", width: 20 },
    { header: "Commande #", key: "orderReferenceId", width: 12 },
    { header: "Produit", key: "productName", width: 25 },
    { header: "Ref", key: "productRef", width: 15 },
    { header: "Quantité", key: "quantity", width: 12 },
  ]

  const detailHeaderRow = detailSheet.getRow(1)
  detailHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  }
  detailHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } }

  ordersToProduce.forEach((order) => {
    order.products.forEach((product) => {
      detailSheet.addRow({
        bakeryName: order.bakeryName,
        orderReferenceId: order.orderReferenceId,
        productName: product.productName,
        productRef: product.productRef || "-",
        quantity: product.quantity,
      })
    })
  })

  // Sheet 3: Summary Statistics
  const summarySheet = workbook.addWorksheet("Résumé")
  summarySheet.columns = [
    { header: "Métrique", key: "metric", width: 25 },
    { header: "Valeur", key: "value", width: 15 },
  ]

  const summaryHeaderRow = summarySheet.getRow(1)
  summaryHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFC55A11" },
  }
  summaryHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } }

  const totalQuantity = productTotalsArray.reduce((sum, p) => sum + p.totalQuantity, 0)
  const uniqueProducts = new Set(ordersToProduce.flatMap((o) => o.products.map((p) => p.productName))).size

  summarySheet.addRow({ metric: "Date de rapport", value: new Date().toLocaleDateString("fr-FR") })
  summarySheet.addRow({ metric: "Laboratoire", value: userLabName || "Non spécifié" })
  summarySheet.addRow({ metric: "Nombre de commandes", value: ordersToProduce.length })
  summarySheet.addRow({ metric: "Nombre de boulangeries", value: bakeries.length })
  summarySheet.addRow({ metric: "Nombre de produits", value: uniqueProducts })
  summarySheet.addRow({ metric: "Quantité totale", value: totalQuantity })

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

export function downloadExcel(buffer: Buffer | ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function printExcel(buffer: Buffer | ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = window.URL.createObjectURL(blob)
  // Open in new tab for printing
  const win = window.open(url, "_blank")
  if (win) {
    win.onload = () => {
      setTimeout(() => {
        win.print()
      }, 250)
    }
  }
}
