import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Work } from '../types';

type RootStackParamList = {
  CompanyWorks: { companyId: string; companyName: string };
};

type CompanyWorksRouteProp = RouteProp<RootStackParamList, 'CompanyWorks'>;

export default function CompanyWorksScreen() {
  const route = useRoute<CompanyWorksRouteProp>();
  const navigation = useNavigation();
  const { companyId, companyName } = route.params;
  const { works, deleteWork } = useApp();

  const companyWorks = works
    .filter(w => w.companyId === companyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalAmount = companyWorks.reduce((sum, w) => sum + w.amount, 0);

  const handleDelete = (workId: string) => {
    Alert.alert('Sil', 'Bu işi silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => deleteWork(workId),
      },
    ]);
  };

  const renderWorkItem = ({ item }: { item: Work }) => {
    const date = new Date(item.createdAt);
    const formattedDate = date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.workCard}>
        <View style={styles.workHeader}>
          <View style={styles.workInfo}>
            <Text style={styles.workAmount}>{item.amount.toFixed(2)} ₺</Text>
            <Text style={styles.workDate}>{formattedDate}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteButtonText}>Sil</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.workDescription}>{item.description}</Text>
        {item.imageUri && (
          <Image source={{ uri: item.imageUri }} style={styles.workImage} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.companyName}>{companyName}</Text>
        <Text style={styles.totalAmount}>
          Toplam: {totalAmount.toFixed(2)} ₺
        </Text>
        <Text style={styles.workCount}>
          {companyWorks.length} {companyWorks.length === 1 ? 'iş' : 'iş'}
        </Text>
      </View>

      {companyWorks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Bu firma için henüz iş eklenmemiş
          </Text>
        </View>
      ) : (
        <FlatList
          data={companyWorks}
          renderItem={renderWorkItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  workCount: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 15,
  },
  workCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  workInfo: {
    flex: 1,
  },
  workAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  workDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  workDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    lineHeight: 22,
  },
  workImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

