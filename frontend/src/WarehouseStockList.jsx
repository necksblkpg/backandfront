import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_PRODUCT_STOCKS } from './queries'

function WarehouseStockList() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(3)

  // Anropa GraphQL-queryn med variabler
  const { loading, error, data } = useQuery(GET_PRODUCT_STOCKS, {
    variables: { limit, page }
  })

  if (loading) return <p>Laddar data...</p>
  if (error) return <p>Fel: {error.message}</p>

  return (
    <div>
      <h2>Data (limit: {limit}, page: {page})</h2>

      {/* Navigering */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setPage(page > 1 ? page - 1 : 1)}>Föregående</button>
        <span style={{ margin: '0 1rem' }}>Sida {page}</span>
        <button onClick={() => setPage(page + 1)}>Nästa</button>
      </div>

      {/* Visar en tabell med datan */}
      <table border="1" cellPadding="6" cellSpacing="0">
        <thead>
          <tr>
            <th>Warehouse #</th>
            <th>Produkt ID</th>
            <th>Namn</th>
            <th>Status</th>
            <th>Art.nr</th>
            <th>Är Bundle?</th>
            <th>Storlek</th>
            <th>Kvantitet</th>
          </tr>
        </thead>
        <tbody>
          {data.warehouses.map((warehouse, warehouseIndex) =>
            warehouse.stock.map((stockItem, stockIndex) => {
              const { productSize } = stockItem
              const { quantity, size, productVariant } = productSize
              const { product } = productVariant

              return (
                <tr key={`${warehouseIndex}-${stockIndex}`}>
                  <td>{warehouseIndex + 1}</td>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.status}</td>
                  <td>{product.productNumber}</td>
                  <td>{product.isBundle ? 'Ja' : 'Nej'}</td>
                  <td>{size?.name ?? 'N/A'}</td>
                  <td>{quantity}</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default WarehouseStockList
