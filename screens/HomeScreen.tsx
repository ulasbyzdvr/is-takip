import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { Company } from '../types';

type RootStackParamList = {
    Home: undefined;
    AddCompany: undefined;
    EditCompany: { companyId: string; companyName: string };
    CompanyWorks: { companyId: string; companyName: string };
    Payment: undefined;
    Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
    const navigation = useNavigation<NavigationProp>();
    const { companies, works, loading, isOffline, hasPendingChanges, syncPendingChanges } = useApp();
    const [searchText, setSearchText] = useState('');

    const filteredCompanies = useMemo(() => {
        if (!searchText.trim()) {
            return companies;
        }
        const searchLower = searchText.toLowerCase().trim();
        return companies.filter(company =>
            company.name.toLowerCase().includes(searchLower)
        );
    }, [companies, searchText]);

    const getCompanyWorkCount = (companyId: string) => {
        return works.filter(w => w.companyId === companyId && !w.isDeleted).length;
    };

    const getCurrencySymbol = (currency: string) => {
        switch (currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'TRY': return '₺';
            default: return '₺';
        }
    };

    const getCompanyTotalAmounts = (companyId: string) => {
        const companyWorks = works.filter(w => w.companyId === companyId && !w.isDeleted);
        const totals: Record<string, number> = {};
        companyWorks.forEach(w => {
            const currency = w.currency || 'TRY';
            if (!totals[currency]) {
                totals[currency] = 0;
            }
            totals[currency] += w.amount;
        });
        return totals;
    };

    const renderCompanyItem = ({ item }: { item: Company }) => {
        const workCount = getCompanyWorkCount(item.id);
        const totalAmounts = getCompanyTotalAmounts(item.id);
        const totalAmountsText = Object.entries(totalAmounts)
            .map(([currency, amount]) => `${amount.toFixed(2)} ${getCurrencySymbol(currency)}`)
            .join(' • ');

        return (
            <TouchableOpacity
                style={styles.companyCard}
                onPress={() =>
                    navigation.navigate('CompanyWorks', {
                        companyId: item.id,
                        companyName: item.name,
                    })
                }
                onLongPress={() =>
                    navigation.navigate('EditCompany', {
                        companyId: item.id,
                        companyName: item.name,
                    })
                }
            >
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{item.name}</Text>
                    <Text style={styles.companyStats}>
                        {workCount} iş {totalAmountsText && `• Toplam: ${totalAmountsText}`}
                    </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>İş Takip</Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('AddCompany')}
                        >
                            <Text style={styles.headerButtonText}>+ Firma</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={() => navigation.navigate('Payment')}
                        >
                            <Text style={styles.headerButtonText}>Tahsilat</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => navigation.navigate('Settings')}
                        >
                            <Text style={styles.settingsButtonText}>⚙️</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Firma ara..."
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                {/* Offline/Pending Changes Indicator */}
                {(isOffline || hasPendingChanges) && (
                    <TouchableOpacity
                        style={styles.offlineIndicator}
                        onPress={syncPendingChanges}
                    >
                        <Text style={styles.offlineIcon}>
                            {isOffline ? '📡' : '🔄'}
                        </Text>
                        <Text style={styles.offlineText}>
                            {isOffline
                                ? 'Çevrimdışı - Değişiklikler kaydedildi'
                                : 'Senkronize edilecek değişiklikler var'}
                        </Text>
                        <Text style={styles.offlineSyncText}>Senkronize et ›</Text>
                    </TouchableOpacity>
                )}
            </View>

            {companies.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Henüz firma eklenmemiş</Text>
                    <Text style={styles.emptySubtext}>
                        Başlamak için ayarlar menüsünden firma ekleyin
                    </Text>
                </View>
            ) : filteredCompanies.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Arama sonucu bulunamadı</Text>
                    <Text style={styles.emptySubtext}>
                        "{searchText}" için firma bulunamadı
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredCompanies}
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
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 35,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        flexShrink: 1,
    },
    headerButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    headerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    settingsButton: {
        backgroundColor: '#666',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        minWidth: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    searchContainer: {
        marginBottom: 0,
    },
    searchInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 14,
        fontSize: 18,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    modalCloseButton: {
        padding: 5,
    },
    modalCloseText: {
        fontSize: 24,
        color: '#666',
    },
    settingsOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingsOptionText: {
        fontSize: 20,
        color: '#333',
    },
    settingsArrow: {
        fontSize: 24,
        color: '#999',
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
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    companyStats: {
        fontSize: 18,
        color: '#666',
    },
    arrow: {
        fontSize: 28,
        color: '#999',
        marginLeft: 10,
    },
    offlineIndicator: {
        backgroundColor: '#FFF3CD',
        borderLeftWidth: 4,
        borderLeftColor: '#FF9500',
        padding: 12,
        marginTop: 10,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    offlineIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    offlineText: {
        flex: 1,
        fontSize: 14,
        color: '#856404',
        fontWeight: '500',
    },
    offlineSyncText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 22,
        color: '#666',
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 18,
        color: '#999',
        textAlign: 'center',
    },
});

