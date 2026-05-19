import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
import { cartAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      const response = await cartAPI.getCart();
      setCart(response.data);
    } catch (error) {
      console.error('Erreur chargement panier', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await cartAPI.updateItem(itemId, newQuantity);
      await fetchCart();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const removeItem = async (itemId) => {
    try {
      await cartAPI.removeItem(itemId);
      await fetchCart();
      toast.success('Article supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clearCart();
      await fetchCart();
      toast.success('Panier vidé');
    } catch (error) {
      toast.error('Erreur lors du vidage');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <FaShoppingCart className="text-6xl text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Votre panier est vide</h2>
        <p className="text-gray-600 mb-8">Ajoutez des plats pour passer commande</p>
        <Link to="/menu" className="btn-primary">Voir le menu</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">Mon Panier</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {cart.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <img 
                    src={item.dish_details?.image || item.custom_dish_details?.base_dish_details?.image || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22 viewBox=%220 0 80 80%22%3E%3Crect fill=%22%23e0e0e0%22 width=%2280%22 height=%2280%22/%3E%3Ctext x=%2240%22 y=%2245%22 font-size=%2214%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E'} 
                    alt={item.item_name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{item.item_name}</h3>
                    <p className="text-primary font-bold">{item.unit_price}€</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FaMinus />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FaPlus />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={clearCart} className="text-red-500 hover:text-red-700">
                Vider le panier
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Récapitulatif</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{cart.subtotal}€</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span>Gratuite</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{cart.subtotal}€</span>
                </div>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full text-center block">
              Passer à la caisse
            </Link>
            <Link to="/menu" className="block text-center mt-4 text-primary hover:underline">
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;