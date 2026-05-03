import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, MapPin, Phone, MessageSquare, CheckCircle2 } from 'lucide-react-native';
import api from '../services/api';

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.log('Error fetching order', error);
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { title: 'Placed', status: 'placed' },
    { title: 'Confirmed', status: 'confirmed' },
    { title: 'Preparing', status: 'preparing' },
    { title: 'Ready', status: 'ready' },
    { title: 'Out for Delivery', status: 'out_for_delivery' },
    { title: 'Delivered', status: 'delivered' }
  ];

  const getStatusIndex = (status) => {
    return statusSteps.findIndex(step => step.status === status);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#ff5a5f" />
      </View>
    );
  }

  const currentIndex = getStatusIndex(order?.orderStatus);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.navigate('Main')} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
          <ArrowLeft size={20} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-secondary ml-4">Order Tracking</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Order Info */}
        <View className="bg-gray-50 p-4 rounded-2xl mb-6">
          <Text className="text-sm text-gray-500 mb-1">Order ID</Text>
          <Text className="font-bold text-secondary">#{order?._id?.slice(-8).toUpperCase()}</Text>
          <Text className="text-sm text-gray-500 mt-2 mb-1">Restaurant</Text>
          <Text className="font-bold text-secondary">{order?.restaurant?.name}</Text>
        </View>

        {/* Status Steps */}
        <Text className="text-base font-bold text-secondary mb-4">Order Status</Text>
        <View className="mb-6">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <View key={step.status} className="flex-row items-start mb-4">
                <View className="items-center mr-4">
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`}>
                    {isCompleted ? (
                      <CheckCircle2 size={16} color="white" />
                    ) : (
                      <View className="w-3 h-3 rounded-full bg-gray-400" />
                    )}
                  </View>
                  {index < statusSteps.length - 1 && (
                    <View className={`w-0.5 h-8 mt-1 ${isCompleted ? 'bg-primary' : 'bg-gray-200'}`} />
                  )}
                </View>
                <View className="flex-1 pt-1">
                  <Text className={`font-bold ${isCurrent ? 'text-primary' : isCompleted ? 'text-secondary' : 'text-gray-400'}`}>
                    {step.title}
                  </Text>
                  {isCurrent && (
                    <Text className="text-gray-500 text-sm mt-1">Current status</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Delivery Person Info */}
        {order?.deliveryPerson && (
          <View className="bg-gray-50 p-4 rounded-2xl mb-6">
            <Text className="text-base font-bold text-secondary mb-3">Delivery Person</Text>
            <View className="flex-row items-center">
              <Image
                source={{ uri: order.deliveryPerson.profileImage || 'https://via.placeholder.com/50' }}
                className="w-12 h-12 rounded-full"
              />
              <View className="ml-3 flex-1">
                <Text className="font-bold text-secondary">{order.deliveryPerson.name}</Text>
                <Text className="text-gray-500 text-sm">Your delivery driver</Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View className="bg-gray-50 p-4 rounded-2xl mb-8">
          <Text className="text-base font-bold text-secondary mb-3">Order Items</Text>
          {order?.items?.map((item, index) => (
            <View key={index} className="flex-row justify-between mb-2">
              <Text className="text-gray-600">{item.name} x{item.quantity}</Text>
              <Text className="font-semibold">${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View className="border-t border-gray-200 mt-2 pt-2 flex-row justify-between">
            <Text className="font-bold text-secondary">Total</Text>
            <Text className="font-bold text-primary">${order?.totalAmount?.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderTrackingScreen;
