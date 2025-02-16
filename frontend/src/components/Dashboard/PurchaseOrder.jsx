import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMutation, gql } from '@apollo/client';

const CREATE_PURCHASE_ORDER = gql`
  mutation CreatePurchaseOrder($items: [PurchaseOrderItemInput!]!, $notes: String) {
    createPurchaseOrder(items: $items, notes: $notes) {
      id
      createdAt
      status
      items {
        productId
        quantity
        variantName
        size
      }
      notes
    }
  }
`;

const PurchaseOrder = ({ open, onClose, selectedItems }) => {
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState(selectedItems);
  
  const [createPurchaseOrder, { loading }] = useMutation(CREATE_PURCHASE_ORDER);

  const handleQuantityChange = (index, newQuantity) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: parseInt(newQuantity) || 0
    };
    setOrderItems(updatedItems);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const items = orderItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        variantName: item.variant_name,
        size: item.size
      }));

      await createPurchaseOrder({
        variables: {
          items,
          notes
        }
      });

      onClose(true); // true indicates successful creation
    } catch (error) {
      console.error('Error creating purchase order:', error);
    }
  };

  const totalValue = orderItems.reduce((sum, item) => 
    sum + (item.quantity * item.price), 0
  );

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>Skapa inköpsorder</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Orderdetaljer
          </Typography>
          <List>
            {orderItems.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleRemoveItem(index)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${item.product_name} - ${item.variant_name} ${item.size ? `(${item.size})` : ''}`}
                    secondary={`Pris per enhet: ${new Intl.NumberFormat('sv-SE', {
                      style: 'currency',
                      currency: 'SEK'
                    }).format(item.price)}`}
                  />
                  <TextField
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    sx={{ width: 100, ml: 2 }}
                    label="Antal"
                    size="small"
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="subtitle1">
              Totalt ordervärde: {new Intl.NumberFormat('sv-SE', {
                style: 'currency',
                currency: 'SEK'
              }).format(totalValue)}
            </Typography>
          </Box>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Anteckningar"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Avbryt</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || orderItems.length === 0}
        >
          {loading ? 'Skapar order...' : 'Skapa order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseOrder; 