import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { Currency, Work } from '../types';

type RootStackParamList = {
  EditWork: { workId: string };
};

type EditWorkRouteProp = RouteProp<RootStackParamList, 'EditWork'>;

export default function EditWorkScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditWorkRouteProp>();
  const { workId } = route.params;
  const { allWorks, companies, updateWork, deleteWork } = useApp();
  
  const work = allWorks.find(w => w.id === workId);
  const company = work ? companies.find(c => c.id === work.companyId) : null;

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [isPaid, setIsPaid] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const currencies: { label: string; value: Currency; symbol: string }[] = [
    { label: 'Türk Lirası', value: 'TRY', symbol: '₺' },
    { label: 'Dolar', value: 'USD', symbol: '$' },
    { label: 'Euro', value: 'EUR', symbol: '€' },
  ];

  useEffect(() => {
    if (work) {
      setAmount(work.amount.toString());
      setCurrency(work.currency || 'TRY');
      setDate(work.date ? new Date(work.date) : new Date(work.createdAt));
      setDescription(work.description);
      setImageUri(work.imageUri);
      setIsPaid(work.isPaid || false);
    }
  }, [work]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için izin gereklidir');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin gereklidir');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Görsel Değiştir', 'Görsel seçmek için bir yöntem seçin', [
      { text: 'Kamera', onPress: takePhoto },
      { text: 'Galeri', onPress: pickImage },
      { text: 'Görseli Kaldır', onPress: () => setImageUri(undefined), style: 'destructive' },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir tutar giriniz');
      return;
    }

    if (description.trim().length === 0) {
      Alert.alert('Hata', 'Lütfen iş açıklaması giriniz');
      return;
    }

    const result = await updateWork(workId, {
      amount: parseFloat(amount),
      currency,
      date: date.toISOString(),
      description: description.trim(),
      imageUri,
      isPaid,
    });

    if (result.success) {
      Alert.alert('Başarılı', 'İş başarıyla güncellendi', [
        {
          text: 'Tamam',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      Alert.alert('Hata', result.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'İşi Sil',
      'Bu işi silmek istediğinize emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteWork(workId);
            if (result.success) {
              Alert.alert('Başarılı', 'İş silindi', [
                {
                  text: 'Tamam',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } else {
              Alert.alert('Hata', result.message);
            }
          },
        },
      ]
    );
  };

  if (!work || !company) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>İş bulunamadı</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.label}>Firma</Text>
          <View style={styles.companyDisplay}>
            <Text style={styles.companyDisplayText}>{company.name}</Text>
          </View>

          <Text style={styles.label}>Tarih</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {formatDate(date)}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>

          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Tarih Seçiniz</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContainer}>
                  <View style={styles.dateInputRow}>
                    <View style={styles.dateInputGroup}>
                      <Text style={styles.dateLabel}>Gün</Text>
                      <TextInput
                        style={styles.dateInput}
                        value={date.getDate().toString()}
                        onChangeText={(text) => {
                          const day = parseInt(text) || 1;
                          const newDate = new Date(date);
                          newDate.setDate(Math.min(Math.max(day, 1), 31));
                          setDate(newDate);
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View style={styles.dateInputGroup}>
                      <Text style={styles.dateLabel}>Ay</Text>
                      <TextInput
                        style={styles.dateInput}
                        value={(date.getMonth() + 1).toString()}
                        onChangeText={(text) => {
                          const month = parseInt(text) || 1;
                          const newDate = new Date(date);
                          newDate.setMonth(Math.min(Math.max(month - 1, 0), 11));
                          setDate(newDate);
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View style={styles.dateInputGroup}>
                      <Text style={styles.dateLabel}>Yıl</Text>
                      <TextInput
                        style={styles.dateInput}
                        value={date.getFullYear().toString()}
                        onChangeText={(text) => {
                          const year = parseInt(text) || new Date().getFullYear();
                          const newDate = new Date(date);
                          newDate.setFullYear(year);
                          setDate(newDate);
                        }}
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.dateConfirmButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.dateConfirmText}>Tamam</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Tutar</Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={[styles.input, styles.amountInput]}
              placeholder="0.00"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={styles.currencyButton}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <Text style={styles.currencySymbol}>
                {currencies.find(c => c.value === currency)?.symbol || '₺'}
              </Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={showCurrencyPicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCurrencyPicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Döviz Seçiniz</Text>
                  <TouchableOpacity
                    onPress={() => setShowCurrencyPicker(false)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                {currencies.map((curr) => (
                  <TouchableOpacity
                    key={curr.value}
                    style={styles.currencyOption}
                    onPress={() => {
                      setCurrency(curr.value);
                      setShowCurrencyPicker(false);
                    }}
                  >
                    <Text style={styles.currencyOptionText}>
                      {curr.symbol} {curr.label}
                    </Text>
                    {currency === curr.value && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="İş açıklamasını giriniz"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, isPaid && styles.checkboxChecked]}
              onPress={() => setIsPaid(!isPaid)}
            >
              {isPaid && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Ücret Tahsil Edildi</Text>
          </View>

          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImageUri(undefined)}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.imageButton}
            onPress={showImageOptions}
          >
            <Text style={styles.imageButtonText}>
              {imageUri ? 'Görseli Değiştir' : 'Görsel Ekle'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>İşi Sil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 20,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  companyDisplay: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  companyDisplayText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 20,
    color: '#333',
  },
  pickerArrow: {
    fontSize: 16,
    color: '#666',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  amountInput: {
    flex: 1,
    marginRight: 10,
  },
  currencyButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 20,
    color: '#333',
  },
  checkmark: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 18,
    borderRadius: 8,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
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
    maxHeight: '80%',
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
    fontSize: 22,
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
  datePickerContainer: {
    padding: 20,
  },
  dateInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
  dateConfirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
  },
  dateConfirmText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  currencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currencyOptionText: {
    fontSize: 20,
    color: '#333',
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

