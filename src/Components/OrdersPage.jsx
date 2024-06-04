import React, { useState, useEffect } from 'react';
import { Row, Col, Dropdown, Container, Modal, Button, Spinner } from 'react-bootstrap';
import { MdOutlineFilterAlt } from 'react-icons/md';
import { IoSearchSharp } from 'react-icons/io5';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchOrders, updateOrderItemQuantity, calculateSubtotal, calculateTotal } from '../api';
import './OrdersPage.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); //for pagenation
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newQuantity, setNewQuantity] = useState(0);
  const [isShow, setIsShow] = useState(false); //for confirm modal
  const [totalUpdated, setTotalUpdated] = useState(false);
  const [search, setSearch] = useState(''); //for search
  const [filterType, setFilterType] = useState('id');
  const [filterText, setFilterText] = useState('Filter');
  const [statusFilter, setStatusFilter] = useState('');//for filter
  const [loading, setLoading] = useState(true); // State to manage loading spinner

  const ordersPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Start loading spinner
      try {
        const data = await fetchOrders();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
      setLoading(false); // Stop loading spinner
    };
    fetchData();
  }, [totalUpdated]);

  const handleQuantityChange = async (orderId, itemId, quantity, lineItems) => {
    try {
      const itemToUpdate = lineItems.find(item => item.id === itemId);
      const newSubtotal = calculateSubtotal(quantity, itemToUpdate.price);

      const updatedLineItems = lineItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: quantity,
            subtotal: newSubtotal,
          };
        }
        return item;
      });

      const newTotal = calculateTotal(updatedLineItems);

      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            line_items: updatedLineItems,
            total: newTotal,
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      await updateOrderItemQuantity(orderId, updatedLineItems);
      setTotalUpdated(!totalUpdated);
    } catch (error) {
      console.error('Error updating order item quantity:', error);
    }
  };

  const handleEditClick = (orderId, itemId, currentQuantity) => {
    setEditingOrderId(orderId);
    setEditingItemId(itemId);
    setNewQuantity(currentQuantity);
  };

  const handleSaveClick = () => {
    setIsShow(true);
  };

  const handleConfirmClick = () => {
    const order = orders.find(order => order.id === editingOrderId);
    const lineItems = order.line_items;
    if (!newQuantity || isNaN(newQuantity) || newQuantity < 0) return;
    handleQuantityChange(editingOrderId, editingItemId, newQuantity, lineItems);
    handleCloseModal();
    toast.success("Quantity Updated Successfully");
  };

  const handleCloseModal = () => {
    setEditingOrderId(null);
    setEditingItemId(null);
    setIsShow(false);
  };

  const handleFilterSelect = (type, text) => {
    setFilterType(type);
    setFilterText(text);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = search.toLowerCase();
    const matchesSearch = (() => {
      switch (filterType) {
        case 'id':
          return order.id.toString().includes(searchLower);
        case 'customerName':
          return `${order.billing.first_name} ${order.billing.last_name}`.toLowerCase().includes(searchLower);
        case 'total':
          return order.total.toString().includes(searchLower);
        case 'date_created':
          return new Date(order.date_created).toLocaleString().toLowerCase().includes(searchLower);
        case 'quantity':
          return order.line_items.some(item => item.quantity.toString().includes(searchLower));
        default:
          return true;
      }
    })();
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const changeCpage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Container>
      <div className="orders-container">
        <h2 align="center">Order Details</h2>
        <Row className="mb-2 mt-2 justify-content-start">
          <Col xs={12} sm={6} md="auto" className="mb-2 mb-md-0">
            <Dropdown className="hov w-100">
              <Dropdown.Toggle
                className="w-100"
                style={{
                  fontSize: '16px',
                  padding: '7px',
                  backgroundColor: '#f5f0f0',
                  color: 'rgb(50, 49, 49)',
                  border: 'none',
                  fontWeight: 'normal',
                }}
                id="dropdown-basic"
              >
                <MdOutlineFilterAlt id="filter-icon" /> {filterText}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleFilterSelect('id', 'Order ID')}>Order ID</Dropdown.Item>
                <Dropdown.Item onClick={() => handleFilterSelect('customerName', 'Customer Name')}>Customer Name</Dropdown.Item>
                <Dropdown.Item onClick={() => handleFilterSelect('total', 'Total Amount')}>Total Amount</Dropdown.Item>
                <Dropdown.Item onClick={() => handleFilterSelect('date_created', 'Order Date')}>Order Date</Dropdown.Item>
                <Dropdown.Item onClick={() => handleFilterSelect('quantity', 'Quantity')}>Quantity</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col xs={12} sm={6} md="auto" className="mb-2 mb-md-0">
            <div className="input-wrapper hov w-100">
              <IoSearchSharp id="search-icon" />
              <input
                type="text"
                placeholder="Search"
                className="w-100"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </Col>
          <Col xs={12} sm={6} md="auto">
            <Dropdown className="hov w-100">
              <Dropdown.Toggle
                className="w-100"
                style={{
                  fontSize: '16px',
                  padding: '7px',
                  backgroundColor: '#f5f0f0',
                  color: 'rgb(50, 49, 49)',
                  border: 'none',
                  fontWeight: 'normal',
                }}
                id="dropdown-basic"
              >
                <MdOutlineFilterAlt id="filter-icon" /> {statusFilter || 'Status Filter'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleStatusFilterChange('')}>All</Dropdown.Item>
                <Dropdown.Item onClick={() => handleStatusFilterChange('pending')}>Pending</Dropdown.Item>
                <Dropdown.Item onClick={() => handleStatusFilterChange('processing')}>Processing</Dropdown.Item>
                <Dropdown.Item onClick={() => handleStatusFilterChange('completed')}>Completed</Dropdown.Item>
                <Dropdown.Item onClick={() => handleStatusFilterChange('cancelled')}>Cancelled</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
        <div className="table-responsive">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <table className="orders-table mt-2 table table-bordered">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Quantity</th>
                  <th>Order Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map(order => (
                  <React.Fragment key={order.id}>
                    {order.line_items.map(item => (
                      <tr key={`${order.id}-${item.id}`}>
                        <td>{order.id}</td>
                        <td>{order.billing.first_name} {order.billing.last_name}</td>
                        <td>{new Date(order.date_created).toLocaleString()}</td>
                        <td>{order.total}</td>
                        <td>
                          {editingOrderId === order.id && editingItemId === item.id ? (
                            <input
                              type="number"
                              value={newQuantity}
                              onChange={(e) => setNewQuantity(Math.max(0, e.target.value))}
                              min="0"
                            />
                          ) : (
                            item.quantity
                          )}
                        </td>
                        <td>{order.status}</td>
                        <td>
                          {editingOrderId === order.id && editingItemId === item.id ? (
                            <>
                              <button className="save-btn" onClick={handleSaveClick}>Save</button>
                              <button className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                            </>
                          ) : (
                            <button className="edit-btn bg-warning text-white" onClick={() => handleEditClick(order.id, item.id, item.quantity)}>Edit Quantity</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <ul className="pagination text-dark">
          <li className={`me-2 page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <a className="page-link" onClick={() => changeCpage(currentPage - 1)}>Previous</a>
          </li>
          {pageNumbers.map((n, i) => (
            <li className={`ms-2 me-2 page-item ${currentPage === n ? 'active' : ''}`} key={i}>
              <a className="page-link" onClick={() => changeCpage(n)}>{n}</a>
            </li>
          ))}
          <li className={`ms-2 page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <a className="page-link" onClick={() => changeCpage(currentPage + 1)}>Next</a>
          </li>
        </ul>
      </div>
      <Modal className='deleteModal' show={isShow} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Quantity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="deleteModalContent">
            <p>Are you sure you want to update the quantity?</p>
            <input
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(Math.max(0, e.target.value))}
              className="form-control"
              min="0"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmClick}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer autoClose={1400} position="top-center" />
    </Container>
  );
};

export default OrdersPage;
