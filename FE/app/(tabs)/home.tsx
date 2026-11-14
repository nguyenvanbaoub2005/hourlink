import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/Colors';
import { useAuthStore } from '@store/authStore';
import { useTheme } from '@theme';

import IndividualHomeScreen from '../../src/screens/home/IndividualHomeScreen';
import OrganizationHomeScreen from '../../src/screens/home/OrganizationHomeScreen';
import AdminHomeScreen from '../../src/screens/home/AdminHomeScreen';
import CommunityHomeScreen from '../../src/screens/home/CommunityHomeScreen';

export default function HomeScreen() {
  const { role, user } = useAuthStore();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'individual' | 'community'>('individual');
  const isOrganization = role?.includes('ROLE_ORGANIZATION') || user?.userType === 'organization';

  const renderHomeContent = () => {
    if (isOrganization) {
      return <OrganizationHomeScreen />;
    }

    if (activeTab === 'community') {
      return <CommunityHomeScreen />;
    }

    if (role?.includes('ROLE_ADMIN') || user?.userType === 'admin') {
      return <AdminHomeScreen />;
    }
    return <IndividualHomeScreen />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.outline }]}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'individual' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('individual')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'individual' ? colors.primary : colors.textSecondary }]}>
            {isOrganization ? 'Cộng đồng' : 'Cá nhân'}
          </Text>
        </TouchableOpacity>
        {!isOrganization && (
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'community' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('community')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'community' ? colors.primary : colors.textSecondary }]}>
              Cộng đồng
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {renderHomeContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingTop: 12,
    borderBottomWidth: 1,
  },
  tabBtn: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabText: { fontSize: 16, fontWeight: '500' },
});
