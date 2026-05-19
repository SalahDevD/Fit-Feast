// routes.jsx - Configuration des routes pour Stripe et Cart
// Ajouter ce code à votre App.jsx ou router.jsx

import CartPage from './pages/Cart/CartPage';
import CheckoutPageNew from './pages/Checkout/CheckoutPageNew';
import CheckoutSuccess from './pages/Checkout/CheckoutSuccess';

// Routes à ajouter à votre routeur React Router v6:

export const stripeRoutes = [
  {
    path: '/cart',
    element: <CartPage />,
  },
  {
    path: '/checkout/:orderId',
    element: <CheckoutPageNew />,
  },
  {
    path: '/checkout/success',
    element: <CheckoutSuccess />,
  },
];

/* 
   INTÉGRATION COMPLÈTE DANS App.jsx:

   import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
   import CartPage from './pages/Cart/CartPage';
   import CheckoutPageNew from './pages/Checkout/CheckoutPageNew';
   import CheckoutSuccess from './pages/Checkout/CheckoutSuccess';

   function App() {
     return (
       <Router>
         <Routes>
           {/* Autres routes... */}
           
           {/* Routes Stripe/Paiement */}
           <Route path="/cart" element={<CartPage />} />
           <Route path="/checkout/:orderId" element={<CheckoutPageNew />} />
           <Route path="/checkout/success" element={<CheckoutSuccess />} />
           
           {/* ... autres routes ... */}
         </Routes>
       </Router>
     );
   }

   export default App;
*/
