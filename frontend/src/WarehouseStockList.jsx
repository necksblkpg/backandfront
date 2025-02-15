import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { GET_PRODUCT_STOCKS } from './queries'

function WarehouseStockList() {
  const [limit, setLimit] = useState(3)
  const [page, setPage] = useState(1)

  const { loading, error, data } = useQuery(GET_PRODUCT_STOCKS, {
    variables: { limit, page }
  })

  if (loading) return <p>Laddar data...</p>
  if (error) return <p>Fel: {error.message}</p>

  return (
    <div>
      <h2>Data (limit: {limit}, page: {page})</h2>
      <div>
        <button onClick={() => setPage(page > 1 ? page - 1 : 1)}>Föregående</button>
        <button onClick={() => setPage(page + 1)}>Nästa</button>
      </div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export default WarehouseStockList
