import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const OrderAnalytics = () => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderData();
  }, []);

  const fetchOrderData = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetOrders {
              orders(limit: 100) {
                id
                number
                status
                created
                modified
                items {
                  id
                  productName
                  quantity
                  price
                }
                customer {
                  id
                  email
                  firstName
                  lastName
                }
              }
            }
          `,
        }),
      });

      const data = await response.json();
      const analytics = await analyzeOrderData(data.data.orders);
      setOrderData(analytics);
      setLoading(false);
    } catch (err) {
      setError('Kunde inte hämta orderdata');
      setLoading(false);
    }
  };

  const analyzeOrderData = async (orders) => {
    const response = await fetch('/api/analyze/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orders }),
    });
    return await response.json();
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!orderData) return null;

  const customerSegmentData = Object.entries(orderData.customer_metrics.customer_segments)
    .map(([key, value]) => ({
      name: key.replace('_', ' ').toUpperCase(),
      value,
    }));

  const dailyOrderData = Object.entries(orderData.daily_order_count)
    .map(([date, count]) => ({
      date,
      orders: count,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Dagliga ordrar
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyOrderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Kundsegment
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerSegmentData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {customerSegmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Populära produkter
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Produkt</TableCell>
                    <TableCell align="right">Antal sålda</TableCell>
                    <TableCell align="right">Intäkt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderData.popular_products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {product.name}
                      </TableCell>
                      <TableCell align="right">{product.total_quantity}</TableCell>
                      <TableCell align="right">
                        {new Intl.NumberFormat('sv-SE', {
                          style: 'currency',
                          currency: 'SEK',
                        }).format(product.total_revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Kundmetriker
            </Typography>
            <Typography variant="body1">
              Genomsnittligt ordervärde:{' '}
              {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK',
              }).format(orderData.customer_metrics.average_order_value)}
            </Typography>
            <Typography variant="body1">
              Återkommande kunder:{' '}
              {(orderData.customer_metrics.repeat_customer_rate * 100).toFixed(1)}%
            </Typography>
            <Typography variant="body1">
              Totalt antal kunder: {orderData.customer_metrics.total_customers}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default OrderAnalytics; 