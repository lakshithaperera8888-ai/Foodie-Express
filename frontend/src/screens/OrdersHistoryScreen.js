import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Clock, Star } from 'lucide-react-native';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import DeliveryReviewModal from '../components/DeliveryReviewModal';

const OrdersHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isReviewVisible, setIsReviewVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/myorders');
      const rawOrders = response.data;
      
      // Bundle orders that were placed at the exact same time (within 5 seconds)
      const bundledOrders = [];
      let currentBundle = null;
      
      for (const order of rawOrders) {
        if (!currentBundle) {
          currentBundle = {
            _id: `bundle-${order._id}`,
            isBundle: true,
            mainOrderId: order._id,
            orders: [order],
            items: [...order.items],
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            orderStatus: order.orderStatus
          };
        } else {
          const timeDiff = Math.abs(new Date(currentBundle.createdAt).getTime() - new Date(order.createdAt).getTime());
          if (timeDiff < 5000) {
            currentBundle.orders.push(order);
            currentBundle.items.push(...order.items);
            currentBundle.totalAmount += order.totalAmount;
          } else {
            bundledOrders.push(currentBundle);
            currentBundle = {
              _id: `bundle-${order._id}`,
              isBundle: true,
              mainOrderId: order._id,
              orders: [order],
              items: [...order.items],
              totalAmount: order.totalAmount,
              createdAt: order.createdAt,
              orderStatus: order.orderStatus
            };
          }
        }
      }
      if (currentBundle) bundledOrders.push(currentBundle);
      
      setOrders(bundledOrders);
    } catch (error) {
      console.log('Error fetching orders', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'preparing': return '#8b5cf6';
      case 'ready_for_delivery': return '#06b6d4';
      case 'accepted': return '#10b981';
      case 'picked_up': return '#f97316';
      case 'on_the_way': return '#6366f1';
      case 'delivered': return '#22c55e';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'placed': return 'Placed';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready_for_delivery': return 'Ready for Delivery';
      case 'accepted': return 'Accepted';
      case 'picked_up': return 'Picked Up';
      case 'on_the_way': return 'On the Way';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const OrderCard = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('OrderTracking', { orderId: item.mainOrderId || item._id })}
      className="bg-white p-4 rounded-3xl mb-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="font-bold text-secondary text-base">
            Order #{(item.mainOrderId || item._id).slice(-8).toUpperCase()}
          </Text>
          <View className="flex-row items-center mt-1">
            <Clock size={12} color="gray" />
            <Text className="text-gray-400 text-xs ml-1">
              {new Date(item.createdAt).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <View style={{ backgroundColor: getStatusColor(item.orderStatus) + '20' }} className="px-3 py-1 rounded-full">
            <Text style={{ color: getStatusColor(item.orderStatus) }} className="text-xs font-bold">
              {getStatusLabel(item.orderStatus)}
            </Text>
          </View>
          <ChevronRight size={16} color="gray" className="ml-2" />
        </View>
      </View>

      <View className="border-t border-gray-100 pt-3">
        <Text className="text-gray-500 text-sm mb-1" numberOfLines={2}>
          {item.items.slice(0, 3).map(i => `${i.name} x${i.quantity}`).join(', ')}
          {item.items.length > 3 ? ` +${item.items.length - 3} more` : ''}
        </Text>
        <View className="flex-row justify-between items-center mt-2">
          <Text className="font-bold text-primary text-base">${item.totalAmount.toFixed(2)}</Text>
          {item.orderStatus === 'delivered' && item.orders?.[0]?.deliveryPerson && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setSelectedOrder(item.orders[0]);
                setIsReviewVisible(true);
              }}
              className="flex-row items-center bg-amber-50 px-3 py-1 rounded-full border border-amber-200"
            >
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <Text className="text-amber-600 text-xs font-bold ml-1">Rate Driver</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4 border-b border-gray-100 bg-white">
        <Text className="text-2xl font-bold text-secondary">My Orders</Text>
      </View>

      {orders.length === 0 && !loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-xl font-bold text-secondary mb-2">No orders yet</Text>
          <Text className="text-gray-500 mb-6">Your order history will appear here</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('HomeTab')}
            className="bg-primary px-8 py-3 rounded-2xl"
          >
            <Text className="text-white font-bold">Order Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <OrderCard item={item} />}
          contentContainerStyle={{ padding: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff5a5f']} />}
        />
      )}

      {selectedOrder && (
        <DeliveryReviewModal
          visible={isReviewVisible}
          onClose={() => {
            setIsReviewVisible(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
      )}
    </SafeAreaView>
  );
};

export default OrdersHistoryScreen;
