import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import AdminDashboardOrder from './pages/AdminDashboardOrder';
import AddProduct from './pages/AddProduct';
import CategoryManagement from './pages/CategoryManagement';
import EditProduct from './pages/EditProduct';
import Review from './pages/Review';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminDashboardOrder />} />
        <Route path="/admin/add-product" element={<AddProduct />} />
        <Route path="/admin/categories" element={<CategoryManagement />} />
        <Route path="/admin/edit-product/:id" element={<EditProduct />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/review" element={<Review />} />
      </Routes>
    </Router>
  );
}

export default App;
