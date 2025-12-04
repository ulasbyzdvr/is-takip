import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../context/AppContext';

export default function SettingsScreen() {
  const { refreshData, loading, isOffline, hasPendingChanges, syncPendingChanges } = useApp();

  const handleRefresh = async () => {
    const result = await refreshData();

    if (result.success) {
      Alert.alert('Başarılı', result.message);
    } else {
      Alert.alert('Hata', result.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sunucu Bilgileri</Text>
        <Text style={styles.infoText}>
          Tüm verileriniz direkt olarak sunucuda tutulmaktadır. Her işlemde otomatik olarak sunucuya kaydedilir.
        </Text>

        <View style={styles.syncInfo}>
          <Text style={styles.syncLabel}>Sunucu:</Text>
          <Text style={styles.syncValue}>ejderbeyazdavar.com/mobile-api</Text>
        </View>

        <View style={styles.syncInfo}>
          <Text style={styles.syncLabel}>Durum:</Text>
          <Text style={[styles.syncValue, isOffline ? styles.statusOffline : styles.statusActive]}>
            {isOffline ? '📡 Çevrimdışı' : '✓ Çevrimiçi'}
          </Text>
        </View>

        {hasPendingChanges && (
          <View style={[styles.syncInfo, styles.pendingInfo]}>
            <Text style={styles.syncLabel}>⚠️ Bekleyen Değişiklikler:</Text>
            <Text style={styles.syncValue}>Senkronize edilmedi</Text>
          </View>
        )}

        {hasPendingChanges && (
          <TouchableOpacity
            style={[styles.button, styles.syncButton, loading && styles.buttonDisabled]}
            onPress={async () => {
              const result = await syncPendingChanges();
              Alert.alert(
                result.success ? 'Başarılı' : 'Hata',
                result.message
              );
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Değişiklikleri Senkronize Et</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.refreshButton, loading && styles.buttonDisabled]}
          onPress={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verileri Yenile</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          • Tüm veriler direkt sunucuda saklanır{'\n'}
          • Her işlem anında sunucuya kaydedilir{'\n'}
          • İnternet bağlantısı gereklidir{'\n'}
          • Birden fazla cihazdan aynı verilere erişebilirsiniz{'\n'}
          • Manuel yenileme için yukarıdaki butonu kullanabilirsiniz
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 18,
    color: '#333',
    backgroundColor: '#fff',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  downloadButton: {
    backgroundColor: '#FF9500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  syncInfo: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  syncLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  syncValue: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  statusActive: {
    color: '#34C759',
  },
  statusOffline: {
    color: '#FF9500',
  },
  pendingInfo: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  syncButton: {
    backgroundColor: '#FF9500',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 10,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },
});

