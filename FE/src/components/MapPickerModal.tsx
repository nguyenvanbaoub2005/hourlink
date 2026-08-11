import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface MapPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (address: string) => void;
}

export default function MapPickerModal({ visible, onClose, onSelect }: MapPickerModalProps) {
  const [region, setRegion] = useState<Region>({
    latitude: 10.762622, // Default to Ho Chi Minh City
    longitude: 106.660172,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [address, setAddress] = useState<{main: string, sub: string}>({ main: 'Đang tìm vị trí...', sub: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập bị từ chối', 'Vui lòng cấp quyền vị trí để ứng dụng định vị bạn tự động.');
        // Don't return, let them manually pan
      } else {
        let location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        fetchAddress(location.coords.latitude, location.coords.longitude);
      }
    } catch (error) {
      console.log('Error getting location', error);
    }
  };

  const fetchAddress = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'HourLinkApp/1.0',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          }
        }
      );
      
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        
        // 1. Tên chính (Tòa nhà / Tên đường)
        let mainName = addr.amenity || addr.building || addr.shop || addr.office || addr.leisure || addr.tourism || '';
        
        let street = '';
        if (addr.house_number && addr.road) {
          street = `${addr.house_number} ${addr.road}`;
        } else if (addr.road) {
          street = addr.road;
        }

        let main = '';
        const subParts = [];

        if (mainName) {
          main = mainName;
          if (street) subParts.push(street);
        } else if (street) {
          main = street;
        }
        
        // 2. Địa chỉ phụ (Phường, Quận, Thành phố, Quốc gia)
        subParts.push(addr.suburb || addr.quarter || addr.neighbourhood || addr.hamlet);
        subParts.push(addr.city_district || addr.district || addr.county);
        subParts.push(addr.city || addr.town || addr.village || addr.province || addr.state);
        subParts.push(addr.postcode);
        subParts.push(addr.country);
        
        // Xóa trùng lặp
        const uniqueSub = Array.from(new Set(subParts.filter(Boolean)));
        const sub = uniqueSub.join(', ');
        
        setAddress({
          main: main || sub || 'Vị trí đã chọn',
          sub: main ? sub : ''
        });
      } else if (data && data.display_name) {
        const parts = data.display_name.split(', ');
        if (parts.length > 1) {
          setAddress({
            main: parts[0],
            sub: parts.slice(1).join(', ')
          });
        } else {
          setAddress({ main: data.display_name, sub: '' });
        }
      } else {
        setAddress({ main: 'Không xác định được địa chỉ', sub: '' });
      }
    } catch (error) {
      console.log('Error fetching address', error);
      setAddress({ main: 'Lỗi khi lấy địa chỉ', sub: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    fetchAddress(newRegion.latitude, newRegion.longitude);
  };

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 99999, backgroundColor: '#fff' }]}>
      <View style={styles.container}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={true}
        />
        
        {/* Center Pin Marker */}
        <View style={styles.markerFixed}>
          <Ionicons name="location" size={40} color="#E11D48" />
        </View>

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        {/* Address Card */}
        <View style={styles.addressCard}>
          <View style={styles.addressContainer}>
            <View style={styles.addressIconContainer}>
              <Ionicons name="location-outline" size={24} color="#0D9488" />
            </View>
            <View style={styles.addressTextContainer}>
              {loading ? (
                <ActivityIndicator size="small" color="#0D9488" style={{ alignSelf: 'flex-start' }} />
              ) : (
                <>
                  <Text style={styles.mainAddressText}>{address.main}</Text>
                  {!!address.sub && <Text style={styles.subAddressText}>{address.sub}</Text>}
                </>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.confirmButton} 
            onPress={() => {
              const fullAddress = address.main + (address.sub ? ', ' + address.sub : '');
              onSelect(fullAddress);
              onClose();
            }}
            disabled={loading}
          >
            <Text style={styles.confirmText}>Xác nhận địa điểm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40, // Adjust to make the pin point at the exact center
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addressCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 0,
    marginBottom: 20,
    minHeight: 56,
  },
  addressIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  mainAddressText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 4,
  },
  subAddressText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: '#0D9488',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
