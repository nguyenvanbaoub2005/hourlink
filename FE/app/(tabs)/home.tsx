import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';
import { useAuthStore } from '@store/authStore';

import IndividualHomeScreen from '../../src/screens/home/IndividualHomeScreen';
import OrganizationHomeScreen from '../../src/screens/home/OrganizationHomeScreen';
import AdminHomeScreen from '../../src/screens/home/AdminHomeScreen';
import CommunityHomeScreen from '../../src/screens/home/CommunityHomeScreen';

export default function HomeScreen() {
  const { role, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'individual' | 'community'>('individual');

  const renderHomeContent = () => {
    if (activeTab === 'community') {
      return <CommunityHomeScreen />;
    }

    if (role?.includes('ROLE_ADMIN') || user?.userType === 'admin') {
      return <AdminHomeScreen />;
    }
    if (role?.includes('ROLE_ORGANIZATION') || user?.userType === 'organization') {
      return <OrganizationHomeScreen />;
    }
    return <IndividualHomeScreen />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'individual' && styles.tabBtnActive]}
          onPress={() => setActiveTab('individual')}
        >
          <Text style={[styles.tabText, activeTab === 'individual' && styles.tabTextActive]}>Cá nhân</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'community' && styles.tabBtnActive]}
          onPress={() => setActiveTab('community')}
        >
          <Text style={[styles.tabText, activeTab === 'community' && styles.tabTextActive]}>Cộng đồng</Text>
        </TouchableOpacity>
      </View>
      {renderHomeContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  tabBtn: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 16, color: Colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: 'bold' },
});
