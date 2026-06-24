import React from 'react';
import { StyleSheet, Text, View, Image, Modal, TouchableOpacity, ScrollView, Dimensions, Alert, Linking, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function DetailModal({ visible, photo, onClose, onDelete }) {
  if (!photo) return null;

  const formattedDate = new Date(photo.timestamp).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xoá',
      'Bạn có chắc chắn muốn xoá bức ảnh này khỏi bộ sưu tập không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xoá', 
          style: 'destructive',
          onPress: () => {
            onDelete(photo.id);
            onClose();
          }
        }
      ]
    );
  };

  const initialRegion = {
    latitude: photo.latitude,
    longitude: photo.longitude,
    latitudeDelta: 0.00922,
    longitudeDelta: 0.00421,
  };

  const openInGoogleMaps = () => {
    // Deep link to open location in Google Maps app
    const url = `https://www.google.com/maps/search/?api=1&query=${photo.latitude},${photo.longitude}`;
    
    Linking.openURL(url).catch(err => {
      console.error("Không thể mở Google Maps:", err);
      Alert.alert("Lỗi", "Không thể mở ứng dụng bản đồ.");
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={24} color="#f8fafc" />
            <Text style={styles.headerTitle}>Chi tiết ảnh</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Main Photo View */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: photo.uri }} style={styles.image} />
          </View>

          {/* AI Description Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={18} color="#a855f7" />
              <Text style={styles.sectionTitle}>Mô tả bởi Gemini AI</Text>
            </View>
            <Text style={styles.descriptionText}>
              {photo.description || 'Đang tạo mô tả từ Gemini...'}
            </Text>
          </View>

          {/* Location Map Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="map-outline" size={18} color="#06b6d4" />
              <Text style={styles.sectionTitle}>Vị trí chụp ảnh</Text>
            </View>
            
            {photo.address ? (
              <Text style={styles.addressText}>{photo.address}</Text>
            ) : null}
            
            <Text style={styles.coordinatesText}>
              Tọa độ: {photo.latitude.toFixed(6)}, {photo.longitude.toFixed(6)}
            </Text>

            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={initialRegion}
                showsUserLocation={false}
                zoomControlEnabled={true}
              >
                <Marker
                  coordinate={{
                    latitude: photo.latitude,
                    longitude: photo.longitude,
                  }}
                  title="Vị trí chụp"
                  description={photo.address || "Tọa độ chụp ảnh"}
                />
              </MapView>
            </View>

            <TouchableOpacity style={styles.googleMapsButton} onPress={openInGoogleMaps}>
              <Ionicons name="navigate" size={16} color="#ffffff" />
              <Text style={styles.googleMapsButtonText}>Mở trong Google Maps</Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thời gian:</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{photo.id}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 22,
  },
  addressText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  coordinatesText: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#475569',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  googleMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  googleMapsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  infoSection: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  infoValue: {
    color: '#94a3b8',
    fontSize: 12,
    maxWidth: '70%',
  },
});
