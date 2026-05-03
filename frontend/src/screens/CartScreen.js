import React, { useContext } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, Plus, Minus, CreditCard, ChevronRight } from 'lucide-react-native';
import { CartContext } from '../context/CartContext';

const CartScreen = ({ navigation }) => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useContext(CartContext);

  const CartItem = ({ item }) => (
    <View className="bg-white p-4 rounded-3xl mb-4 flex-row shadow-sm border border-gray-100">
      <Image 
        source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
        className="w-20 h-20 rounded-2xl"
      />
      <View className="flex-1 ml-4 justify-between">
        <View className="flex-row justify-between">
          <Text className="text-lg font-bold text-secondary" numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity onPress={() => removeFromCart(item._id)}>
            <Trash2 size={18} color="#ff5a5f" />
          </TouchableOpacity>
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="text-primary font-bold text-lg">${item.price}</Text>
          <View className="flex-row items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
            <TouchableOpacity 
              onPress={() => updateQuantity(item._id, item.quantity - 1)}
              className="w-8 h-8 bg-white rounded-lg items-center justify-center"
            >
              <Minus size={16} color="black" />
            </TouchableOpacity>
            <Text className="mx-3 font-bold">{item.quantity}</Text>
            <TouchableOpacity 
              onPress={() => updateQuantity(item._id, item.quantity + 1)}
              className="w-8 h-8 bg-white rounded-lg items-center justify-center"
            >
              <Plus size={16} color="black" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-2xl font-bold text-secondary mb-2">Your cart is empty</Text>
        <Text className="text-gray-500 mb-6">Add items from a restaurant to get started</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('HomeTab')}
          className="bg-primary px-8 py-3 rounded-2xl"
        >
          <Text className="text-white font-bold text-lg">Browse Restaurants</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
          <ArrowLeft size={20} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary">My Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text className="text-primary font-semibold">Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <CartItem item={item} />}
        contentContainerStyle={{ padding: 24 }}
        ListFooterComponent={
          <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4">
            <Text className="text-lg font-bold text-secondary mb-4">Order Summary</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Subtotal</Text>
              <Text className="font-semibold">${cartTotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500">Delivery Fee</Text>
              <Text className="font-semibold">$2.50</Text>
            </View>
            <View className="border-t border-gray-100 mt-2 pt-2 flex-row justify-between">
              <Text className="font-bold text-secondary">Total</Text>
              <Text className="font-bold text-primary text-lg">${(cartTotal + 2.50).toFixed(2)}</Text>
            </View>
          </View>
        }
      />

      <View className="px-6 pb-6 bg-white border-t border-gray-100">
        <TouchableOpacity 
          onPress={() => navigation.navigate('Checkout')}
          className="bg-primary py-4 rounded-2xl flex-row items-center justify-center mt-4"
        >
          <CreditCard size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">Proceed to Checkout</Text>
          <ChevronRight size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CartScreen;
