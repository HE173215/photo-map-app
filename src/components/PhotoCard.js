import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function PhotoCard({ photo, onPress, onDelete }) {
  const formattedDate = new Date(photo.timestamp).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: photo.uri }} style={styles.image} />
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#06b6d4" />
          <Text style={styles.locationText} numberOfLines={1}>
            {photo.address || `${photo.latitude.toFixed(4)}, ${photo.longitude.toFixed(4)}`}
          </Text>
        </View>

        <Text style={styles.descriptionText} numberOfLines={2}>
          {photo.description || 'Không có mô tả cho bức ảnh này.'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 6,
    borderRadius: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: '#06b6d4',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
    flex: 1,
  },
  descriptionText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
});
