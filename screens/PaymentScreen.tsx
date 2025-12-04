import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ScrollView,
    Linking,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Work, Company } from '../types';

export default function PaymentScreen() {
    const navigation = useNavigation();
    const { works, companies } = useApp();
    const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());

    const unpaidWorks = useMemo(() => {
        return works
            .filter(w => !w.isPaid && !w.isDeleted)
            .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    }, [works]);

    const getCompanyName = (companyId: string) => {
        const company = companies.find(c => c.id === companyId);
        return company?.name || 'Bilinmeyen Firma';
    };

    const getCurrencySymbol = (currency: string) => {
        switch (currency) {
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'TRY': return '₺';
            default: return '₺';
        }
    };

    const toggleWorkSelection = (workId: string) => {
        const newSelected = new Set(selectedWorks);
        if (newSelected.has(workId)) {
            newSelected.delete(workId);
        } else {
            newSelected.add(workId);
        }
        setSelectedWorks(newSelected);
    };

    const selectAll = () => {
        if (selectedWorks.size === unpaidWorks.length) {
            setSelectedWorks(new Set());
        } else {
            setSelectedWorks(new Set(unpaidWorks.map(w => w.id)));
        }
    };

    const generateWhatsAppMessage = () => {
        if (selectedWorks.size === 0) {
            Alert.alert('Uyarı', 'Lütfen en az bir iş seçiniz');
            return;
        }

        const selectedWorkList = unpaidWorks.filter(w => selectedWorks.has(w.id));

        let message = 'Tahsil edilmesi gereken işler:\n\n';

        selectedWorkList.forEach((work, index) => {
            const companyName = getCompanyName(work.companyId);
            const currency = work.currency || 'TRY';
            const currencySymbol = getCurrencySymbol(currency);

            message += `${index + 1}. ${companyName}\n`;
            message += `   Tutar: ${work.amount.toFixed(2)} ${currencySymbol}\n\n`;
        });

        const totalAmounts = selectedWorkList.reduce((acc, w) => {
            const currency = w.currency || 'TRY';
            if (!acc[currency]) {
                acc[currency] = 0;
            }
            acc[currency] += w.amount;
            return acc;
        }, {} as Record<string, number>);

        message += 'TOPLAM:\n';
        Object.entries(totalAmounts).forEach(([currency, amount]) => {
            message += `${getCurrencySymbol(currency)} ${amount.toFixed(2)}\n`;
        });

        return message;
    };

    const handleSendWhatsApp = () => {
        const message = generateWhatsAppMessage();
        if (!message) return;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;

        Linking.canOpenURL(whatsappUrl)
            .then(supported => {
                if (supported) {
                    return Linking.openURL(whatsappUrl);
                } else {
                    Alert.alert('Hata', 'WhatsApp yüklü değil');
                }
            })
            .catch(err => {
                Alert.alert('Hata', 'WhatsApp açılamadı');
                console.error(err);
            });
    };

    const renderWorkItem = ({ item }: { item: Work }) => {
        const isSelected = selectedWorks.has(item.id);
        const companyName = getCompanyName(item.companyId);
        const currency = item.currency || 'TRY';
        const currencySymbol = getCurrencySymbol(currency);
        const workDate = item.date ? new Date(item.date) : new Date(item.createdAt);
        const formattedDate = workDate.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        return (
            <TouchableOpacity
                style={[styles.workCard, isSelected && styles.workCardSelected]}
                onPress={() => toggleWorkSelection(item.id)}
            >
                <View style={styles.workCardContent}>
                    <View style={styles.checkboxContainer}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                            {isSelected && <Text style={styles.checkboxCheckmark}>✓</Text>}
                        </View>
                    </View>
                    <View style={styles.workInfo}>
                        <Text style={styles.companyName}>{companyName}</Text>
                        <Text style={styles.workAmount}>
                            {item.amount.toFixed(2)} {currencySymbol}
                        </Text>
                        <Text style={styles.workDate}>{formattedDate}</Text>
                        <Text style={styles.workDescription} numberOfLines={2}>
                            {item.description}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Tahsilat Yap</Text>
                <TouchableOpacity
                    style={styles.selectAllButton}
                    onPress={selectAll}
                >
                    <Text style={styles.selectAllText}>
                        {selectedWorks.size === unpaidWorks.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                    </Text>
                </TouchableOpacity>
            </View>

            {unpaidWorks.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        Tahsil edilmemiş iş bulunmuyor
                    </Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={unpaidWorks}
                        renderItem={renderWorkItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                    />
                    <View style={styles.footer}>
                        <Text style={styles.selectedCount}>
                            {selectedWorks.size} iş seçildi
                        </Text>
                        <TouchableOpacity
                            style={[styles.sendButton, selectedWorks.size === 0 && styles.sendButtonDisabled]}
                            onPress={handleSendWhatsApp}
                            disabled={selectedWorks.size === 0}
                        >
                            <Text style={styles.sendButtonText}>📱 WhatsApp ile Gönder</Text>
                        </TouchableOpacity>
                    </View>
                </>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    selectAllButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    selectAllText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    list: {
        padding: 15,
        paddingBottom: 100,
    },
    workCard: {
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    workCardSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#f0f7ff',
    },
    workCardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkboxContainer: {
        marginRight: 15,
        marginTop: 2,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    checkboxCheckmark: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    workInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    workAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 4,
    },
    workDate: {
        fontSize: 16,
        color: '#999',
        marginBottom: 6,
    },
    workDescription: {
        fontSize: 18,
        color: '#666',
        lineHeight: 24,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    selectedCount: {
        fontSize: 18,
        color: '#666',
        marginBottom: 12,
        textAlign: 'center',
    },
    sendButton: {
        backgroundColor: '#25D366',
        paddingVertical: 16,
        borderRadius: 8,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
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
        textAlign: 'center',
    },
});

