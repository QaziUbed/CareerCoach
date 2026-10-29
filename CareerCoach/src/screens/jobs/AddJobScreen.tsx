import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Text, Menu, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { get } from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import useJobStore from '../../store/useJobStore';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { Input, Button, Card } from '../../components/ui';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type AddJobRouteProp = RouteProp<RootStackParamList, 'AddJob'>;

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AddJobScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddJobRouteProp>();
  const user = useAuthStore((state) => state.user);
  const { addApplication, updateApplication, deleteApplication } = useJobStore();
  
  const applicationId = route.params?.applicationId;
  const isEditMode = !!applicationId;

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [status, setStatus] = useState<any>('applied');
  const [notes, setNotes] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (isEditMode && applicationId) {
      fetchApplicationData(applicationId);
    }
  }, [applicationId]);

  const fetchApplicationData = async (id: string) => {
    try {
      const data = await get<any>(`/api/applications/${id}`);
      setCompanyName(data.company_name || '');
      setJobTitle(data.job_title || '');
      setJobUrl(data.job_url || '');
      setJobDescription(data.job_description || '');
      setStatus(data.status || 'applied');
      setNotes(data.notes || '');
    } catch (error) {
      Alert.alert('Error', 'Failed to load application data');
    } finally {
      setFetchingData(false);
    }
  };

  const validateForm = () => {
    if (!companyName.trim()) {
      Alert.alert('Error', 'Company Name is required');
      return false;
    }
    if (!jobTitle.trim()) {
      Alert.alert('Error', 'Job Title is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !user?.id) return;

    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        company_name: companyName.trim(),
        job_title: jobTitle.trim(),
        job_url: jobUrl.trim() || undefined,
        job_description: jobDescription.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
        applied_date: new Date().toISOString(),
      };

      if (isEditMode && applicationId) {
        await updateApplication(applicationId, payload);
      } else {
        await addApplication(payload);
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save application.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Application',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    if (!applicationId) return;
    setDeleting(true);
    try {
      await deleteApplication(applicationId);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete application.');
      setDeleting(false);
    }
  };

  if (fetchingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, isDesktop && styles.headerDesktop]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Job' : 'Track New Job'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={isDesktop && styles.formWrapper}>
           <Card style={styles.formCard}>
              <Input
                label="Company Name *"
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="e.g. Google"
              />
              <Input
                label="Job Title *"
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="e.g. Frontend Engineer"
              />
              <Input
                label="Job URL (Optional)"
                value={jobUrl}
                onChangeText={setJobUrl}
                placeholder="https://jobs.google.com/..."
                keyboardType="url"
                autoCapitalize="none"
              />
              <Input
                label="Job Description (Optional)"
                value={jobDescription}
                onChangeText={setJobDescription}
                placeholder="Paste the job description here..."
                multiline
                numberOfLines={6}
              />
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Interview Status</Text>
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setMenuVisible(true)}
                    >
                      <Text style={styles.pickerButtonText}>
                        {STATUS_OPTIONS.find(o => o.value === status)?.label}
                      </Text>
                      <Text style={styles.pickerIcon}>▼</Text>
                    </TouchableOpacity>
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <Menu.Item
                      key={option.value}
                      onPress={() => {
                        setStatus(option.value);
                        setMenuVisible(false);
                      }}
                      title={option.label}
                    />
                  ))}
                </Menu>
              </View>

              <Input
                label="Personal Notes"
                value={notes}
                onChangeText={setNotes}
                placeholder="Interview logs, contacts, etc."
                multiline
                numberOfLines={3}
              />

              <Button
                title={isEditMode ? 'Save Changes' : 'Track Job'}
                onPress={handleSave}
                loading={loading}
                disabled={loading || deleting}
                variant="primary"
                style={styles.saveButton}
              />

              {isEditMode && (
                <Button
                  title="Delete Application"
                  onPress={handleDelete}
                  loading={deleting}
                  disabled={loading || deleting}
                  variant="danger"
                  style={styles.deleteButton}
                />
              )}
           </Card>
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  headerDesktop: {
    paddingHorizontal: SPACING.xxxl,
    paddingVertical: SPACING.xl,
  },
  cancelButton: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  desktopScrollContent: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  formWrapper: {
    width: '100%',
    maxWidth: 600,
  },
  formCard: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
  },
  pickerButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  pickerIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  saveButton: {
    marginTop: SPACING.lg,
  },
  deleteButton: {
    marginTop: SPACING.sm,
    borderColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
