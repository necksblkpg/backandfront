import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useApolloClient } from "@apollo/client";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Stack,
} from "@mui/material";
import { GET_WAREHOUSE_STOCK, GET_SALES_ORDERS } from "../../queries";

// Hjälpfunktion för att formatera datum enligt svensk lokal tid ("YYYY-MM-DD")
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = ("0" + (date.getMonth() + 1)).slice(-2);
  const day = ("0" + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
};

const StockAndSalesTable = () => {
  const limit = 100;

  // Användarens val av försäljningsperiod (i dagar). Null = inget valt än.
  const [selectedDays, setSelectedDays] = useState(null);

  // Datum: computedToDate och computedFromDate baseras på svensk lokal tid
  const computedToDate = formatDateLocal(new Date());
  const computedFromDate = selectedDays
    ? formatDateLocal(new Date(new Date().getTime() - selectedDays * 24 * 60 * 60 * 1000))
    : null;

  // Tillstånd för aggregerad lager- och försäljningsdata
  const [allStockData, setAllStockData] = useState(null);
  const [allSalesOrders, setAllSalesOrders] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingSales, setLoadingSales] = useState(false);

  const client = useApolloClient();

  // --- Lagerdata ---
  const { data: initialStockData, error: stockError } = useQuery(GET_WAREHOUSE_STOCK, {
    variables: { limit, page: 1 },
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    async function loadAllStock() {
      if (!initialStockData) return;
      const aggregated = await Promise.all(
        initialStockData.warehouses.map(async (warehouse, index) => {
          let allStock = [...warehouse.stock];
          let currentPage = 1;
          while (true) {
            currentPage++;
            try {
              const { data: moreData } = await client.query({
                query: GET_WAREHOUSE_STOCK,
                variables: { limit, page: currentPage },
                fetchPolicy: "network-only",
              });
              const additionalStock = moreData.warehouses[index]?.stock || [];
              if (additionalStock.length === 0) break;
              allStock = [...allStock, ...additionalStock];
            } catch (error) {
              console.error(
                "Fel vid hämtning av mer lagerdata för warehouse med index",
                index,
                error
              );
              break;
            }
          }
          return { ...warehouse, stock: allStock };
        })
      );
      setAllStockData(aggregated);
      setLoadingStock(false);
    }
    loadAllStock();
  }, [initialStockData, limit, client]);

  // --- Försäljningsdata ---
  const { data: initialSalesData, error: salesError, fetchMore: fetchMoreSales } = useQuery(
    GET_SALES_ORDERS,
    {
      variables: selectedDays
        ? {
            from: `${computedFromDate}T00:00:00Z`,
            to: `${computedToDate}T23:59:59Z`,
            page: 1,
            limit,
          }
        : {},
      fetchPolicy: "network-only",
      skip: !selectedDays,
    }
  );

  useEffect(() => {
    async function loadAllSales() {
      if (!initialSalesData) return;
      setLoadingSales(true);
      let aggregatedOrders = initialSalesData.orders;
      let currentPage = 1;
      while (true) {
        currentPage++;
        try {
          const { data: moreSalesData } = await fetchMoreSales({
            variables: { page: currentPage, limit },
          });
          if (!moreSalesData || !moreSalesData.orders || moreSalesData.orders.length === 0)
            break;
          aggregatedOrders = [...aggregatedOrders, ...moreSalesData.orders];
          if (moreSalesData.orders.length < limit) break;
        } catch (error) {
          console.error("Fel vid hämtning av fler försäljningsorder:", error);
          break;
        }
      }
      setAllSalesOrders(aggregatedOrders);
      setLoadingSales(false);
    }
    if (selectedDays) {
      loadAllSales();
    }
  }, [initialSalesData, fetchMoreSales, limit, selectedDays, computedFromDate, computedToDate]);

  // Aggregera försäljningsdata per produkt och storlek (använd composite key)
  const salesMap = useMemo(() => {
    const map = {};
    allSalesOrders.forEach((order) => {
      order.lines.forEach((line) => {
        const productId = line.productVariant.product.id;
        const size = line.size || "N/A";
        const key = `${productId}_${size}`;
        map[key] = (map[key] || 0) + parseInt(line.quantity, 10);
      });
    });
    return map;
  }, [allSalesOrders]);

  // Bearbeta lagerdata: skapa lista med data vi vill visa
  const stockList = useMemo(() => {
    const list = [];
    if (allStockData) {
      allStockData.forEach((warehouse) => {
        if (warehouse.stock) {
          warehouse.stock.forEach((item) => {
            const product = item.productSize.productVariant.product;
            const size = item.productSize.size?.name || "N/A";
            list.push({
              productId: product.id,
              productName: product.name,
              productNumber: product.productNumber,
              status: product.status,
              collection: product.collection?.name || "Ingen kollektion",
              size: size,
              stock: item.productSize.quantity,
            });
          });
        }
      });
    }
    return list;
  }, [allStockData]);

  // Hantera val av försäljningsperiod
  const handlePeriodChange = (event) => {
    const days = event.target.value;
    setSelectedDays(days);
    setAllSalesOrders([]); // Återställ tidigare försäljningsdata
  };

  return (
    <Paper sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom>
        Lager och försäljning
      </Typography>
      <Stack spacing={2}>
        {/* Dropdown för att välja försäljningsperiod */}
        <FormControl variant="outlined" sx={{ minWidth: 220 }}>
          <InputLabel id="sales-period-label">Välj försäljningsperiod</InputLabel>
          <Select
            labelId="sales-period-label"
            label="Välj försäljningsperiod"
            value={selectedDays || ""}
            onChange={handlePeriodChange}
          >
            <MenuItem value={30}>Senaste 30 dagarna</MenuItem>
            <MenuItem value={160}>Senaste 160 dagarna</MenuItem>
            <MenuItem value={360}>Senaste 360 dagarna</MenuItem>
          </Select>
        </FormControl>
        {/* Instruktionstext */}
        {!selectedDays && (
          <Alert severity="info">
            Vänligen välj en försäljningsperiod för att ladda försäljningsdata.
          </Alert>
        )}
      </Stack>
      {(loadingStock || (selectedDays && loadingSales)) && (
        <Box sx={{ textAlign: "center", marginTop: 2 }}>
          <CircularProgress />
          <Typography>Laddar data...</Typography>
        </Box>
      )}
      {stockError || salesError ? (
        <Typography color="error" sx={{ marginTop: 2 }}>
          Fel vid hämtning av data: {stockError?.message || salesError?.message}
        </Typography>
      ) : (
        allStockData && (
          <Table sx={{ marginTop: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Produkt</TableCell>
                <TableCell>Art.nr</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Kollektion</TableCell>
                <TableCell>Storlek</TableCell>
                <TableCell>Lager</TableCell>
                {selectedDays && (
                  <>
                    <TableCell>Försäljning ({selectedDays} dagar)</TableCell>
                    <TableCell>Snitt/dag</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {stockList.map((item, index) => {
                const key = `${item.productId}_${item.size}`;
                const totalSales = salesMap[key] || 0;
                const avgDailySales = selectedDays ? (totalSales / selectedDays).toFixed(1) : "N/A";
                return (
                  <TableRow key={`${item.productId}-${item.size}-${index}`}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.productNumber}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{item.collection}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    {selectedDays && (
                      <>
                        <TableCell>{totalSales}</TableCell>
                        <TableCell>{avgDailySales}</TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )
      )}
    </Paper>
  );
};

export default StockAndSalesTable;
