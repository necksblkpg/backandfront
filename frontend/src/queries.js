import { gql } from '@apollo/client'

export const GET_PRODUCT_STOCKS = gql`
  query ProductStocks($limit: Int!, $page: Int!) {
    warehouses {
      stock(limit: $limit, page: $page) {
        productSize {
          quantity
          size {
            name
          }
          productVariant {
            product {
              id
              name
              status
              productNumber
              isBundle
            }
          }
        }
      }
    }
  }
`
