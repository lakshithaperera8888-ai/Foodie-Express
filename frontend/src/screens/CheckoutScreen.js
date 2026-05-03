import React, { useState, useContext, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Truck, ShoppingBag, CreditCard, Wallet, Home as HomeIcon, CheckCircle, Globe } from 'lucide-react-native';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const CheckoutScreen = ({ navigation }) => {
  const { cart, cartTotal, restaurantId, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [orderType, setOrderType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [onlineProvider, setOnlineProvider] = useState('card'); // card, paypal
  const [address, setAddress] = useState(user?.address || '');
  const [selectedSavedMethod, setSelectedSavedMethod] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
  }, [user?.address]);

  useEffect(() => {
    // Default to the first saved method if available
    if (user?.withdrawalMethods?.length > 0) {
      setSelectedSavedMethod(user.withdrawalMethods[0]);
    }
  }, [user?.withdrawalMethods]);

  const handlePlaceOrder = async () => {
    if (orderType === 'delivery' && !address) {
      Alert.alert('Error', 'Please provide a delivery address');
      return;
    }

    if (paymentMethod === 'online') {
      navigation.navigate('PaymentDetails', {
        amount: (cartTotal + (new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50)),
        provider: selectedSavedMethod ? selectedSavedMethod.type : onlineProvider,
        savedMethod: selectedSavedMethod,
        address,
        orderType
      });
      return;
    }

    // Cash on delivery
    setLoading(true);
    try {
      // Group items by restaurant
      const groupedItems = cart.reduce((acc, item) => {
        const resId = item.restaurantId?._id || item.restaurantId;
        if (!acc[resId]) acc[resId] = [];
        acc[resId].push({ ...item, restaurantId: resId });
        return acc;
      }, {});

      const restaurantIds = Object.keys(groupedItems);

      for (const resId of restaurantIds) {
        const resItems = groupedItems[resId];
        const resSubtotal = resItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const orderData = {
          restaurant: resId,
          items: resItems.map(item => ({
            menuItem: item._id,
            name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity)
          })),
          totalAmount: Number((resSubtotal + 2.50).toFixed(2)),
          orderType,
          deliveryAddress: orderType === 'delivery' ? address : '',
          paymentMethod: 'cash',
          paymentStatus: 'pending',
        };

        await api.post('/orders', orderData);
      }

      clearCart();
      navigation.navigate('Main', { screen: 'OrdersTab' });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const deliveryFeeTotal = new Set(cart.map(i => i.restaurantId?._id || i.restaurantId)).size * 2.50;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 flex-row items-center border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
          <ArrowLeft size={20} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary ml-4">Checkout</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Order Type */}
        <Text className="text-base font-bold text-secondary mb-3">Order Type</Text>
        <View className="flex-row mb-6 space-x-3">
          <TouchableOpacity
            onPress={() => setOrderType('delivery')}
            className={`flex-1 p-4 rounded-2xl border flex-row items-center justify-center ${orderType === 'delivery' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
          >
            <Truck size={18} color={orderType === 'delivery' ? 'white' : 'gray'} />
            <Text className={`ml-2 font-bold ${orderType === 'delivery' ? 'text-white' : 'text-gray-500'}`}>Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setOrderType('takeaway')}
            className={`flex-1 p-4 rounded-2xl border flex-row items-center justify-center ${orderType === 'takeaway' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
          >
            <ShoppingBag size={18} color={orderType === 'takeaway' ? 'white' : 'gray'} />
            <Text className={`ml-2 font-bold ${orderType === 'takeaway' ? 'text-white' : 'text-gray-500'}`}>Takeaway</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Address */}
        {orderType === 'delivery' && (
          <View className="mb-6">
            <Text className="text-base font-bold text-secondary mb-3">Delivery Address</Text>
            <View className="bg-white flex-row items-center p-4 rounded-2xl border border-gray-200">
              <MapPin size={18} color="#ff5a5f" />
              <TextInput
                className="flex-1 ml-3 text-secondary"
                placeholder="Enter delivery address"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>
        )}

        {/* Payment Method */}
        <Text className="text-base font-bold text-secondary mb-3">Payment Method</Text>
        <View className="flex-row mb-4 space-x-3">
          <TouchableOpacity
            onPress={() => setPaymentMethod('online')}
            className={`flex-1 p-4 rounded-2xl border flex-row items-center justify-center ${paymentMethod === 'online' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
          >
            <CreditCard size={18} color={paymentMethod === 'online' ? 'white' : 'gray'} />
            <Text className={`ml-2 font-bold ${paymentMethod === 'online' ? 'text-white' : 'text-gray-500'}`}>Online</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPaymentMethod('cash')}
            className={`flex-1 p-4 rounded-2xl border flex-row items-center justify-center ${paymentMethod === 'cash' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
          >
            <Wallet size={18} color={paymentMethod === 'cash' ? 'white' : 'gray'} />
            <Text className={`ml-2 font-bold ${paymentMethod === 'cash' ? 'text-white' : 'text-gray-500'}`}>Cash</Text>
          </TouchableOpacity>
        </View>

        {/* Online Provider Selection */}
        {paymentMethod === 'online' && (
          <View className="mb-6">
            {/* Saved Methods */}
            {user?.withdrawalMethods?.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-500 mb-2">Saved Methods</Text>
                {user.withdrawalMethods.map((method, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedSavedMethod(method)}
                    className={`flex-row items-center p-4 rounded-2xl border mb-2 ${selectedSavedMethod === method ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                  >
                    {method.type === 'card' ? (
                      <CreditCard size={18} color={selectedSavedMethod === method ? '#ff5a5f' : 'gray'} />
                    ) : (
                      <Globe size={18} color={selectedSavedMethod === method ? '#ff5a5f' : 'gray'} />
                    )}
                    <View className="ml-3">
                      <Text className={`font-bold ${selectedSavedMethod === method ? 'text-primary' : 'text-secondary'}`}>
                        {method.type === 'card' ? `Card ending in ${method.details?.cardNumber?.slice(-4) || '****'}` : `PayPal: ${method.details?.email}`}
                      </Text>
                    </View>
                    {selectedSavedMethod === method && <CheckCircle size={18} color="#ff5a5f" style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setSelectedSavedMethod(null)}>
                  <Text className="text-primary text-sm font-semibold mt-1">+ Use a new method</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* New Method Selection */}
            {!selectedSavedMethod && (
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={() => setOnlineProvider('card')}
                  className={`flex-1 p-4 rounded-2xl border flex-row items-center justify-center ${onlineProvider === 'card' ? 'bg-secondary border-secondary' : 'bg-white border-gray-200'}`}
                >
                  <CreditCard size={18} color={onlineProvider === 'card' ? 'white' : 'gray'} />
                  <Text className={`ml-2 font-bold ${onlineProvider === 'card' ? 'text-white' : 'text-gray-500'}`}>Card</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setOnlineProvider('paypal')}
                  className={`flex-1 p-4 rounded-2xl border flex-row items-center justify-center ${onlineProvider === 'paypal' ? 'bg-secondary border-secondary' : 'bg-white border-gray-200'}`}
                >
                  <Globe size={18} color={onlineProvider === 'paypal' ? 'white' : 'gray'} />
                  <Text className={`ml-2 font-bold ${onlineProvider === 'paypal' ? 'text-white' : 'text-gray-500'}`}>PayPal</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Order Summary */}
        <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-8">
          <Text className="text-base font-bold text-secondary mb-4">Order Summary</Text>
          {cart.map((item) => (
            <View key={item._id} className="flex-row justify-between mb-2">
              <Text className="text-gray-500">{item.name} x{item.quantity}</Text>
              <Text className="font-semibold">${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View className="border-t border-gray-100 mt-2 pt-2">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-500">Subtotal</Text>
              <Text className="font-semibold">${cartTotal.toFixed(2)}</Text>
            </View>
            {orderType === 'delivery' && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-500">Delivery Fee</Text>
                <Text className="font-semibold">${deliveryFeeTotal.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between mt-2">
              <Text className="font-bold text-secondary">Total</Text>
              <Text className="font-bold text-primary text-lg">
                ${(cartTotal + (orderType === 'delivery' ? deliveryFeeTotal : 0)).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="px-6 pb-6 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={loading}
          className="bg-primary py-4 rounded-2xl items-center mt-4"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {paymentMethod === 'online' ? 'Proceed to Payment' : 'Place Order'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CheckoutScreen;
