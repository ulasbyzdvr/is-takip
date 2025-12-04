import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Calendar, CalendarList } from 'react-native-calendars';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Work } from '../types';

type RootStackParamList = {
  CompanyWorks: { companyId: string; companyName: string };
  AddWork: { companyId: string; companyName: string };
  EditWork: { workId: string };
};

type CompanyWorksRouteProp = RouteProp<RootStackParamList, 'CompanyWorks'>;

export default function CompanyWorksScreen() {
  const route = useRoute<CompanyWorksRouteProp>();
  const navigation = useNavigation();
  const { companyId, companyName } = route.params;
  const { works, deleteWork, updateWork } = useApp();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterPaidStatus, setFilterPaidStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<'TRY' | 'USD' | 'EUR' | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState<'single' | 'range'>('single');
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const [selectedEndDate, setSelectedEndDate] = useState<string>('');

  const allCompanyWorks = works
    .filter(w => w.companyId === companyId && !w.isDeleted)
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  const companyWorks = useMemo(() => {
    let filtered = [...allCompanyWorks];

    // Arama filtresi (açıklama)
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(w =>
        w.description.toLowerCase().includes(searchLower)
      );
    }

    // Tahsil durumu filtresi
    if (filterPaidStatus === 'paid') {
      filtered = filtered.filter(w => w.isPaid === true);
    } else if (filterPaidStatus === 'unpaid') {
      filtered = filtered.filter(w => !w.isPaid);
    }

    // Döviz filtresi
    if (filterCurrency !== 'all') {
      filtered = filtered.filter(w => (w.currency || 'TRY') === filterCurrency);
    }

    // Min ücret filtresi (sadece seçili döviz için)
    if (minAmount && filterCurrency !== 'all') {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(w => {
          const workCurrency = w.currency || 'TRY';
          return workCurrency === filterCurrency && w.amount >= min;
        });
      }
    }

    // Max ücret filtresi (sadece seçili döviz için)
    if (maxAmount && filterCurrency !== 'all') {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter(w => {
          const workCurrency = w.currency || 'TRY';
          return workCurrency === filterCurrency && w.amount <= max;
        });
      }
    }

    // Tarih aralığı filtresi
    if (startDate) {
      filtered = filtered.filter(w => {
        const workDate = w.date ? new Date(w.date) : new Date(w.createdAt);
        // Başlangıç tarihini gün başlangıcına ayarla (dahil edilsin)
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        const workDateStart = new Date(workDate);
        workDateStart.setHours(0, 0, 0, 0);
        return workDateStart >= startOfDay;
      });
    }

    if (endDate) {
      filtered = filtered.filter(w => {
        const workDate = w.date ? new Date(w.date) : new Date(w.createdAt);
        // Bitiş tarihini gün sonuna ayarla (dahil edilsin)
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        return workDate <= endOfDay;
      });
    }

    return filtered;
  }, [allCompanyWorks, filterPaidStatus, minAmount, maxAmount, startDate, endDate]);

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'TRY': return '₺';
      default: return '₺';
    }
  };

  const totalAmounts = useMemo(() => {
    return companyWorks.reduce((acc, w) => {
      const currency = w.currency || 'TRY';
      if (!acc[currency]) {
        acc[currency] = 0;
      }
      acc[currency] += w.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [companyWorks]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const clearFilters = () => {
    setFilterPaidStatus('all');
    setMinAmount('');
    setMaxAmount('');
    setFilterCurrency('all');
    setSearchText('');
    setStartDate(null);
    setEndDate(null);
    setDateFilterMode('single');
  };

  const openDatePicker = () => {
    if (startDate) {
      const startStr = startDate.toISOString().split('T')[0];
      setSelectedStartDate(startStr);
    } else {
      setSelectedStartDate('');
    }
    if (endDate) {
      const endStr = endDate.toISOString().split('T')[0];
      setSelectedEndDate(endStr);
    } else {
      setSelectedEndDate('');
    }
    setShowDatePicker(true);
  };

  const applyDateFilter = () => {
    if (dateFilterMode === 'single') {
      if (selectedStartDate) {
        setStartDate(new Date(selectedStartDate + 'T00:00:00'));
        setEndDate(null);
      } else {
        setStartDate(null);
        setEndDate(null);
      }
    } else {
      if (selectedStartDate && selectedEndDate) {
        const start = new Date(selectedStartDate + 'T00:00:00');
        const end = new Date(selectedEndDate + 'T23:59:59');
        if (start <= end) {
          setStartDate(start);
          setEndDate(end);
        } else {
          // Tarihler ters çevrilmişse düzelt
          setStartDate(end);
          setEndDate(start);
        }
      } else {
        setStartDate(null);
        setEndDate(null);
      }
    }
    setShowDatePicker(false);
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedStartDate('');
    setSelectedEndDate('');
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    if (dateFilterMode === 'single') {
      if (selectedStartDate) {
        marked[selectedStartDate] = {
          selected: true,
          selectedColor: '#007AFF',
          selectedTextColor: '#fff',
        };
      }
    } else {
      if (selectedStartDate) {
        marked[selectedStartDate] = {
          startingDay: true,
          color: '#007AFF',
          textColor: '#fff',
        };
      }
      if (selectedEndDate) {
        marked[selectedEndDate] = {
          endingDay: true,
          color: '#007AFF',
          textColor: '#fff',
        };
      }
      // Aralıktaki tarihleri işaretle
      if (selectedStartDate && selectedEndDate) {
        const start = new Date(selectedStartDate);
        const end = new Date(selectedEndDate);
        if (start <= end) {
          const current = new Date(start);
          while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            if (dateStr !== selectedStartDate && dateStr !== selectedEndDate) {
              marked[dateStr] = {
                color: '#007AFF',
                textColor: '#fff',
              };
            }
            current.setDate(current.getDate() + 1);
          }
        }
      }
    }
    
    return marked;
  };

  const onDayPress = (day: any) => {
    if (dateFilterMode === 'single') {
      setSelectedStartDate(day.dateString);
      setSelectedEndDate('');
    } else {
      if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        // Yeni seçim başlat
        setSelectedStartDate(day.dateString);
        setSelectedEndDate('');
      } else {
        // Bitiş tarihi seç
        if (day.dateString >= selectedStartDate) {
          setSelectedEndDate(day.dateString);
        } else {
          // Başlangıç tarihinden önce seçilmişse, yeni başlangıç yap
          setSelectedEndDate(selectedStartDate);
          setSelectedStartDate(day.dateString);
        }
      }
    }
  };

  const hasActiveFilters = filterPaidStatus !== 'all' || minAmount || maxAmount || filterCurrency !== 'all' || searchText.trim() || startDate || (dateFilterMode === 'range' && endDate);

  const handleDelete = (workId: string) => {
    Alert.alert('Sil', 'Bu işi silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteWork(workId);
          if (!result.success) {
            Alert.alert('Hata', result.message);
          }
        },
      },
    ]);
  };

  const handleTogglePaid = async (workId: string, currentStatus: boolean) => {
    const result = await updateWork(workId, { isPaid: !currentStatus });
    if (!result.success) {
      Alert.alert('Hata', result.message);
    }
  };

  const renderWorkItem = ({ item }: { item: Work }) => {
    const workDate = item.date ? new Date(item.date) : new Date(item.createdAt);
    const formattedDate = workDate.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const currency = item.currency || 'TRY';
    const currencySymbol = getCurrencySymbol(currency);
    const isPaid = item.isPaid || false;

    return (
      <View style={[styles.workCard, isPaid && styles.workCardPaid]}>
        <View style={styles.workHeader}>
          <View style={styles.workInfo}>
            <Text style={[styles.workAmount, isPaid && styles.workAmountPaid]}>
              {item.amount.toFixed(2)} {currencySymbol}
            </Text>
            <Text style={styles.workDate}>{formattedDate}</Text>
          </View>
          <View style={styles.workActions}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleTogglePaid(item.id, isPaid)}
            >
              <View style={[styles.checkbox, isPaid && styles.checkboxChecked]}>
                {isPaid && <Text style={styles.checkboxCheckmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditWork', { workId: item.id })}
            >
              <Text style={styles.editButtonText}>Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.deleteButtonText}>Sil</Text>
            </TouchableOpacity>
          </View>
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
        <View style={styles.headerTop}>
          <Text style={styles.companyName}>{companyName}</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.addWorkButton}
              onPress={() => navigation.navigate('AddWork', { companyId, companyName })}
            >
              <Text style={styles.addWorkButtonText}>+ İş Ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
                🔍 Filtrele
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="İş açıklamasında ara..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {Object.keys(totalAmounts).length > 0 && (
          <View style={styles.totalAmountsContainer}>
            {Object.entries(totalAmounts).map(([curr, amount]) => (
              <Text key={curr} style={styles.totalAmount}>
                Toplam ({curr}): {amount.toFixed(2)} {getCurrencySymbol(curr)}
              </Text>
            ))}
          </View>
        )}
        <Text style={styles.workCount}>
          {companyWorks.length} {companyWorks.length === 1 ? 'iş' : 'iş'}
          {hasActiveFilters && ' (filtrelenmiş)'}
        </Text>
      </View>

      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrele</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterContent}>
              <Text style={styles.filterLabel}>Tahsil Durumu</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, filterPaidStatus === 'all' && styles.filterOptionActive]}
                  onPress={() => setFilterPaidStatus('all')}
                >
                  <Text style={[styles.filterOptionText, filterPaidStatus === 'all' && styles.filterOptionTextActive]}>
                    Tümü
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, filterPaidStatus === 'paid' && styles.filterOptionActive]}
                  onPress={() => setFilterPaidStatus('paid')}
                >
                  <Text style={[styles.filterOptionText, filterPaidStatus === 'paid' && styles.filterOptionTextActive]}>
                    Tahsil Edildi
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, filterPaidStatus === 'unpaid' && styles.filterOptionActive]}
                  onPress={() => setFilterPaidStatus('unpaid')}
                >
                  <Text style={[styles.filterOptionText, filterPaidStatus === 'unpaid' && styles.filterOptionTextActive]}>
                    Tahsil Edilmedi
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>Döviz</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, filterCurrency === 'all' && styles.filterOptionActive]}
                  onPress={() => setFilterCurrency('all')}
                >
                  <Text style={[styles.filterOptionText, filterCurrency === 'all' && styles.filterOptionTextActive]}>
                    Tümü
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, filterCurrency === 'TRY' && styles.filterOptionActive]}
                  onPress={() => setFilterCurrency('TRY')}
                >
                  <Text style={[styles.filterOptionText, filterCurrency === 'TRY' && styles.filterOptionTextActive]}>
                    ₺ TRY
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, filterCurrency === 'USD' && styles.filterOptionActive]}
                  onPress={() => setFilterCurrency('USD')}
                >
                  <Text style={[styles.filterOptionText, filterCurrency === 'USD' && styles.filterOptionTextActive]}>
                    $ USD
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, filterCurrency === 'EUR' && styles.filterOptionActive]}
                  onPress={() => setFilterCurrency('EUR')}
                >
                  <Text style={[styles.filterOptionText, filterCurrency === 'EUR' && styles.filterOptionTextActive]}>
                    € EUR
                  </Text>
                </TouchableOpacity>
              </View>

              {filterCurrency !== 'all' && (
                <>
                  <Text style={styles.filterLabel}>Min Ücret ({filterCurrency === 'TRY' ? '₺' : filterCurrency === 'USD' ? '$' : '€'})</Text>
                  <TextInput
                    style={styles.filterInput}
                    value={minAmount}
                    onChangeText={setMinAmount}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />

                  <Text style={styles.filterLabel}>Max Ücret ({filterCurrency === 'TRY' ? '₺' : filterCurrency === 'USD' ? '$' : '€'})</Text>
                  <TextInput
                    style={styles.filterInput}
                    value={maxAmount}
                    onChangeText={setMaxAmount}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />
                </>
              )}

              <Text style={styles.filterLabel}>Tarih Filtresi</Text>
              <View style={styles.dateFilterModeContainer}>
                <TouchableOpacity
                  style={[styles.dateFilterModeButton, dateFilterMode === 'single' && styles.dateFilterModeButtonActive]}
                  onPress={() => setDateFilterMode('single')}
                >
                  <Text style={[styles.dateFilterModeText, dateFilterMode === 'single' && styles.dateFilterModeTextActive]}>
                    Tek Gün
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateFilterModeButton, dateFilterMode === 'range' && styles.dateFilterModeButtonActive]}
                  onPress={() => setDateFilterMode('range')}
                >
                  <Text style={[styles.dateFilterModeText, dateFilterMode === 'range' && styles.dateFilterModeTextActive]}>
                    Tarih Aralığı
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={openDatePicker}
              >
                <Text style={styles.datePickerButtonText}>
                  {dateFilterMode === 'single' 
                    ? (startDate ? formatDate(startDate) : 'Tarih seçiniz...')
                    : (startDate && endDate 
                        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                        : 'Tarih aralığı seçiniz...')
                  }
                </Text>
              </TouchableOpacity>

              {(startDate || endDate) && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={clearDateFilter}
                >
                  <Text style={styles.clearDateText}>Tarih Filtresini Temizle</Text>
                </TouchableOpacity>
              )}

              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFilterText}>Filtreleri Temizle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyFilterButton}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.applyFilterText}>Uygula</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tarih Seçici Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {dateFilterMode === 'single' ? 'Tarih Seçiniz' : 'Tarih Aralığı Seçiniz'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterContent}>
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={onDayPress}
                  markedDates={getMarkedDates()}
                  markingType={dateFilterMode === 'range' ? 'period' : 'simple'}
                  theme={{
                    backgroundColor: '#fff',
                    calendarBackground: '#fff',
                    textSectionTitleColor: '#333',
                    selectedDayBackgroundColor: '#007AFF',
                    selectedDayTextColor: '#fff',
                    todayTextColor: '#007AFF',
                    dayTextColor: '#333',
                    textDisabledColor: '#ddd',
                    dotColor: '#007AFF',
                    selectedDotColor: '#fff',
                    arrowColor: '#007AFF',
                    monthTextColor: '#333',
                    indicatorColor: '#007AFF',
                    textDayFontWeight: '400',
                    textMonthFontWeight: '600',
                    textDayHeaderFontWeight: '600',
                    textDayFontSize: 20,
                    textMonthFontSize: 22,
                    textDayHeaderFontSize: 18,
                  }}
                  enableSwipeMonths={true}
                />
              </View>

              {dateFilterMode === 'range' && (
                <View style={styles.dateRangeInfo}>
                  <Text style={styles.dateRangeInfoText}>
                    {selectedStartDate 
                      ? `Başlangıç: ${formatDate(new Date(selectedStartDate + 'T00:00:00'))}`
                      : 'Başlangıç tarihi seçiniz'
                    }
                  </Text>
                  {selectedEndDate && (
                    <Text style={styles.dateRangeInfoText}>
                      Bitiş: {formatDate(new Date(selectedEndDate + 'T23:59:59'))}
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.datePickerActionButton}
                  onPress={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setSelectedStartDate(today);
                    if (dateFilterMode === 'range') {
                      setSelectedEndDate(today);
                    } else {
                      setSelectedEndDate('');
                    }
                  }}
                >
                  <Text style={styles.datePickerActionText}>Bugün</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.datePickerActionButton}
                  onPress={() => {
                    setSelectedStartDate('');
                    setSelectedEndDate('');
                  }}
                >
                  <Text style={styles.datePickerActionText}>Temizle</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePickerActionButton, styles.datePickerActionButtonPrimary]}
                  onPress={applyDateFilter}
                >
                  <Text style={[styles.datePickerActionText, styles.datePickerActionTextPrimary]}>Uygula</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {allCompanyWorks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Bu firma için henüz iş eklenmemiş
          </Text>
        </View>
      ) : companyWorks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Filtre kriterlerine uygun iş bulunamadı
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  companyName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addWorkButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addWorkButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 8,
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
  filterButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  totalAmountsContainer: {
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  workCardPaid: {
    backgroundColor: '#f0fdf4',
    borderColor: '#34C759',
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
  workActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  workAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 6,
  },
  workAmountPaid: {
    color: '#34C759',
  },
  workDate: {
    fontSize: 16,
    color: '#999',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  workDescription: {
    fontSize: 20,
    color: '#333',
    marginBottom: 12,
    lineHeight: 28,
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
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
  },
  checkboxContainer: {
    padding: 4,
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
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  checkboxCheckmark: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
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
    maxHeight: '90%',
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
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalCloseText: {
    fontSize: 28,
    color: '#666',
  },
  filterContent: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  filterOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 18,
    color: '#333',
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 20,
    color: '#333',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  datePickerButtonText: {
    fontSize: 20,
    color: '#333',
  },
  datePickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  dateInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  dateInputGroup: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 20,
    color: '#333',
    width: 90,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  datePickerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  datePickerActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  datePickerActionButtonPrimary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  datePickerActionText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  datePickerActionTextPrimary: {
    color: '#fff',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  clearFilterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  clearFilterText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '600',
  },
  applyFilterButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyFilterText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  dateFilterModeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  dateFilterModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dateFilterModeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dateFilterModeText: {
    fontSize: 18,
    color: '#333',
  },
  dateFilterModeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  clearDateButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  clearDateText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
  },
  dateRangeInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 14,
    marginBottom: 15,
  },
  dateRangeInfoText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 6,
  },
});

