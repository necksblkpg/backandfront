import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client'
import './App.css' // Importera CSS

const link = new HttpLink({
  uri: '/api/graphql'
})

const client = new ApolloClient({
  link,
  cache: new InMemoryCache()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
)
