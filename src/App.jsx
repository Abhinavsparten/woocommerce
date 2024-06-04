import { useState } from 'react'
import { Navigate,Route, Routes } from "react-router-dom";
import OrdersPage from './Components/OrdersPage';


function App() {


  return (
    <>
       <Routes>
    {/* Route for the Login page */}
    <Route path="/" element={ <OrdersPage />}></Route>
    <Route path="/product" element={<OrdersPage />} />
    </Routes>
    </>
  )
}

export default App
