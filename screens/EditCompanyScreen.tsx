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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';

type RootStackParamList = {
  EditCompany: { companyId: string; companyName: string };
};

type EditCompanyRouteProp = RouteProp<RootStackParamList, 'EditCompany'>;

export default function EditCompanyScreen() {
  const navigation = useNavigation();
  const route = useRoute<EditCompanyRouteProp>();
  const { companyId, companyName } = route.params;
  const { updateCompany, deleteCompany } = useApp();
  const [name, setName] = useState(companyName);

  useEffect(() => {
    setName(companyName);
  }, [companyName]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen firma adını giriniz');
      return;
    }

    const result = await updateCompany(companyId, name.trim());
    if (result.success) {
      Alert.alert('Başarılı', 'Firma adı güncellendi', [
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
      'Firmayı Sil',
      'Bu firmayı silmek istediğinize emin misiniz? Bu firmaya ait tüm işler de silinecektir.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteCompany(companyId);
            if (result.success) {
              Alert.alert('Başarılı', 'Firma silindi', [
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>Firma Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Firma adını giriniz"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Firmayı Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
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
    marginBottom: 20,
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
});

