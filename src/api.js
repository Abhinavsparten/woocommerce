import axios from 'axios';

const API_URL = 'https://ecommercedemo.backb.in/wp-json/wc/v3';
const CONSUMER_KEY = 'ck_3a0ac5695fd4c39171bb1539138dfd1f8a0737f8';
const CONSUMER_SECRET = 'cs_3daf48ee16d8cdc118a609aa94a2c728dec2f5d7';

const api = axios.create({
  baseURL: API_URL,
  auth: {
    username: CONSUMER_KEY,
    password: CONSUMER_SECRET,
  },
});

export const fetchOrders = async () => {
  try {
    const response = await api.get('/orders');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const calculateSubtotal = (quantity, price) => {
    return parseFloat(quantity) * parseFloat(price);
  };
  
  export const calculateTotal = (lineItems) => {
    return lineItems.reduce((total, item) => total + parseFloat(item.subtotal), 0).toFixed(2); // Round to 2 decimal places
  };
  
  export const updateOrderItemQuantity = async (orderId, updatedLineItems) => {
    try {
      // Calculate the new subtotal 
      updatedLineItems.forEach(item => {
        item.subtotal = calculateSubtotal(item.quantity, item.price).toString();
        item.quantity = parseInt(item.quantity); 
      });
  
      // Calculate the new total based on the updated line items
      const newTotal = calculateTotal(updatedLineItems);
  
      //  request data with updated line item and total
      const requestData = {
        line_items: updatedLineItems.map(item => ({
          total: item.subtotal,
          id: item.id,
          quantity: item.quantity,
          
        })),
        total: newTotal,
      };
  
      //  API request to update the order
      const response = await api.put(`/orders/${orderId}`, requestData);
  
      return response.data;
    } catch (error) {
      console.error('Error updating order item quantity:', error.response?.data || error.message);
      throw error;
    }
  };
  
  
  
export default api;
