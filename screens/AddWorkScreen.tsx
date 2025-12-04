import React, { useState } from 'react';
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
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { Currency } from '../types';

type RootStackParamList = {
  AddWork: { companyId: string; companyName: string };
};

type AddWorkRouteProp = RouteProp<RootStackParamList, 'AddWork'>;

export default function AddWorkScreen() {
  const navigation = useNavigation();
  const route = useRoute<AddWorkRouteProp>();
  const { companyId, companyName } = route.params;
  const { addWork } = useApp();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [isPaid, setIsPaid] = useState(false);

  const currencies: { label: string; value: Currency; symbol: string }[] = [
    { label: 'Türk Lirası', value: 'TRY', symbol: '₺' },
    { label: 'Dolar', value: 'USD', symbol: '$' },
    { label: 'Euro', value: 'EUR', symbol: '€' },
  ];

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
    Alert.alert('Görsel Ekle', 'Görsel seçmek için bir yöntem seçin', [
      { text: 'Kamera', onPress: takePhoto },
      { text: 'Galeri', onPress: pickImage },
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

    const result = await addWork({
      companyId,
      amount: parseFloat(amount),
      currency,
      date: date.toISOString(),
      description: description.trim(),
      imageUri,
      isPaid,
    });

    if (result.success) {
      Alert.alert('Başarılı', 'İş başarıyla eklendi', [
        {
          text: 'Tamam',
          onPress: () => {
            setAmount('');
            setCurrency('TRY');
            setDate(new Date());
            setDescription('');
            setImageUri(undefined);
            setIsPaid(false);
            navigation.goBack();
          },
        },
      ]);
    } else {
      Alert.alert('Hata', result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.label}>Firma</Text>
          <View style={styles.companyDisplay}>
            <Text style={styles.companyDisplayText}>{companyName}</Text>
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
                        keyboardType="number-pad"
                        onChangeText={(text) => {
                          const day = parseInt(text) || 1;
                          const newDate = new Date(date);
                          newDate.setDate(Math.min(Math.max(day, 1), 31));
                          setDate(newDate);
                        }}
                      />
                    </View>
                    <View style={styles.dateInputGroup}>
                      <Text style={styles.dateLabel}>Ay</Text>
                      <TextInput
                        style={styles.dateInput}
                        value={(date.getMonth() + 1).toString()}
                        keyboardType="number-pad"
                        onChangeText={(text) => {
                          const month = parseInt(text) || 1;
                          const newDate = new Date(date);
                          newDate.setMonth(Math.min(Math.max(month - 1, 0), 11));
                          setDate(newDate);
                        }}
                      />
                    </View>
                    <View style={styles.dateInputGroup}>
                      <Text style={styles.dateLabel}>Yıl</Text>
                      <TextInput
                        style={styles.dateInput}
                        value={date.getFullYear().toString()}
                        keyboardType="number-pad"
                        onChangeText={(text) => {
                          const year = parseInt(text) || new Date().getFullYear();
                          const newDate = new Date(date);
                          newDate.setFullYear(year);
                          setDate(newDate);
                        }}
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

          <Text style={styles.label}>Döviz</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowCurrencyPicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {currencies.find(c => c.value === currency)?.label || 'Döviz seçiniz...'}
            </Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>

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
                <FlatList
                  data={currencies}
                  keyExtractor={item => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.companyOption}
                      onPress={() => {
                        setCurrency(item.value);
                        setShowCurrencyPicker(false);
                      }}
                    >
                      <Text style={styles.companyOptionText}>
                        {item.symbol} {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Tutar</Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={[styles.input, styles.amountInput]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
            <Text style={styles.currencySymbol}>
              {currencies.find(c => c.value === currency)?.symbol}
            </Text>
          </View>

          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="İş açıklamasını giriniz"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Görsel (İsteğe Bağlı)</Text>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImageUri(undefined)}
              >
                <Text style={styles.removeImageText}>Görseli Kaldır</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imageButton}
              onPress={showImageOptions}
            >
              <Text style={styles.imageButtonText}>+ Görsel Ekle</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsPaid(!isPaid)}
          >
            <View style={[styles.checkbox, isPaid && styles.checkboxChecked]}>
              {isPaid && <Text style={styles.checkboxCheckmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Ücret Tahsil Edildi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>İptal</Text>
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
    flexGrow: 1,
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 20,
    color: '#333',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 20,
    color: '#333',
    flex: 1,
  },
  pickerButtonPlaceholder: {
    color: '#999',
  },
  pickerArrow: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
    fontSize: 22,
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
  companyOption: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  companyOptionText: {
    fontSize: 20,
    color: '#333',
  },
  imageButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    marginBottom: 10,
  },
  imageButtonText: {
    color: '#007AFF',
    fontSize: 20,
    fontWeight: '600',
  },
  imageContainer: {
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  removeImageButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 10,
    borderRadius: 8,
  },
  removeImageText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
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
  currencySymbol: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    minWidth: 35,
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
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
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
  checkboxLabel: {
    fontSize: 20,
    color: '#333',
  },
});

