import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { Company } from '../types';

type RootStackParamList = {
  Home: undefined;
  AddCompany: undefined;
  AddWork: undefined;
  CompanyWorks: { companyId: string; companyName: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { companies, works } = useApp();

  const getCompanyWorkCount = (companyId: string) => {
    return works.filter(w => w.companyId === companyId).length;
  };

  const getCompanyTotalAmount = (companyId: string) => {
    return works
      .filter(w => w.companyId === companyId)
      .reduce((sum, w) => sum + w.amount, 0);
  };

  const renderCompanyItem = ({ item }: { item: Company }) => {
    const workCount = getCompanyWorkCount(item.id);
    const totalAmount = getCompanyTotalAmount(item.id);

    return (
      <TouchableOpacity
        style={styles.companyCard}
        onPress={() =>
          navigation.navigate('CompanyWorks', {
            companyId: item.id,
            companyName: item.name,
          })
        }
      >
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{item.name}</Text>
          <Text style={styles.companyStats}>
            {workCount} iş • Toplam: {totalAmount.toFixed(2)} ₺
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>İş Takip</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={() => navigation.navigate('AddCompany')}
          >
            <Text style={styles.buttonText}>+ Firma</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={() => navigation.navigate('AddWork')}
          >
            <Text style={styles.buttonText}>+ İş</Text>
          </TouchableOpacity>
        </View>
      </View>

      {companies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz firma eklenmemiş</Text>
          <Text style={styles.emptySubtext}>
            Başlamak için yukarıdaki "+ Firma" butonuna tıklayın
          </Text>
        </View>
      ) : (
        <FlatList
          data={companies}
          renderItem={renderCompanyItem}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  list: {
    padding: 15,
  },
  companyCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  companyStats: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#999',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

