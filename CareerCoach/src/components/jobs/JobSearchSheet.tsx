import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';

// ─── Data ────────────────────────────────────────────────────────────────────

const FIELDS = [
  'Software Engineering', 'Data Science', 'Product Management',
  'Design', 'Marketing', 'Finance', 'DevOps', 'Cybersecurity', 'Other',
];

const EXPERIENCE_LEVELS = [
  'Fresher', 'Junior (1-3yr)', 'Mid (3-6yr)', 'Senior (6yr+)',
];

const JOB_TYPES = [
  'Full-time', 'Remote', 'Hybrid', 'Startup', 'MNC', 'Internship',
];

const QUICK_LOCATIONS = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Remote'];

const SALARY_MIN = 3;
const SALARY_MAX = 50;

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}

function Pill({ label, selected, onPress, multi }: PillProps) {
  return (
    <TouchableOpacity
      style={[
        styles.pill,
        selected && (multi ? styles.pillSelectedMulti : styles.pillSelectedSingle),
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {multi && selected && <Text style={styles.pillCheck}>✓ </Text>}
      <Text
        style={[
          styles.pillText,
          selected && styles.pillTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface JobSearchSheetProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (prefs: JobSearchPreferences) => void;
  defaultField?: string;
}

export interface JobSearchPreferences {
  field: string;
  experience_level: string;
  job_type: string[];
  location: string;
  salary_min: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function JobSearchSheet({
  visible,
  onClose,
  onSearch,
  defaultField = 'Software Engineering',
}: JobSearchSheetProps) {
  const slideAnim = useRef(new Animated.Value(800)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [field, setField] = useState(defaultField);
  const [experienceLevel, setExperienceLevel] = useState('Junior (1-3yr)');
  const [jobTypes, setJobTypes] = useState<string[]>(['Full-time']);
  const [location, setLocation] = useState('Bangalore');
  const [salaryMin, setSalaryMin] = useState(5);
  const [locationInput, setLocationInput] = useState('Bangalore');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 800,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const toggleJobType = (type: string) => {
    setJobTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSearch = () => {
    onSearch({
      field,
      experience_level: experienceLevel,
      job_type: jobTypes,
      location: locationInput || location,
      salary_min: salaryMin,
    });
  };

  const salaryLabel = salaryMin >= SALARY_MAX ? '₹50L+ LPA' : `₹${salaryMin}L LPA`;

  // Simple slider using touch
  const sliderRef = useRef<View>(null);
  const [sliderWidth, setSliderWidth] = useState(1);

  const handleSliderPress = (evt: any) => {
    const { locationX } = evt.nativeEvent;
    const ratio = Math.max(0, Math.min(1, locationX / sliderWidth));
    const val = Math.round(SALARY_MIN + ratio * (SALARY_MAX - SALARY_MIN));
    setSalaryMin(val);
  };

  const fillPercent = ((salaryMin - SALARY_MIN) / (SALARY_MAX - SALARY_MIN)) * 100;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Backdrop */}
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeX}>✕</Text>
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <Text style={styles.sheetTitle}>What kind of jobs are you looking for?</Text>

            {/* ROW 1 — Field */}
            <Text style={styles.rowLabel}>Field / Domain</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {FIELDS.map((f) => (
                <Pill
                  key={f}
                  label={f}
                  selected={field === f}
                  onPress={() => setField(f)}
                />
              ))}
            </ScrollView>

            {/* ROW 2 — Experience Level */}
            <Text style={styles.rowLabel}>Experience Level</Text>
            <View style={styles.pillWrap}>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <Pill
                  key={lvl}
                  label={lvl}
                  selected={experienceLevel === lvl}
                  onPress={() => setExperienceLevel(lvl)}
                />
              ))}
            </View>

            {/* ROW 3 — Job Type (multi-select) */}
            <Text style={styles.rowLabel}>Job Type <Text style={styles.multiHint}>(multi-select)</Text></Text>
            <View style={styles.pillWrap}>
              {JOB_TYPES.map((type) => (
                <Pill
                  key={type}
                  label={type}
                  selected={jobTypes.includes(type)}
                  onPress={() => toggleJobType(type)}
                  multi
                />
              ))}
            </View>

            {/* ROW 4 — Location */}
            <Text style={styles.rowLabel}>Location</Text>
            <View style={styles.locationInputWrapper}>
              <Text style={styles.locationIcon}>📍</Text>
              <TextInput
                style={styles.locationInput}
                value={locationInput}
                onChangeText={setLocationInput}
                placeholder="Enter city or Remote"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {QUICK_LOCATIONS.map((loc) => (
                <Pill
                  key={loc}
                  label={loc}
                  selected={locationInput === loc}
                  onPress={() => {
                    setLocation(loc);
                    setLocationInput(loc);
                  }}
                />
              ))}
            </ScrollView>

            {/* ROW 5 — Salary */}
            <Text style={styles.rowLabel}>
              Minimum Salary: <Text style={styles.salaryValue}>{salaryLabel}</Text>
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderTick}>₹3L</Text>
              <View
                ref={sliderRef}
                style={styles.sliderTrack}
                onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
                onStartShouldSetResponder={() => true}
                onResponderGrant={handleSliderPress}
                onResponderMove={handleSliderPress}
              >
                <View style={[styles.sliderFill, { width: `${Math.max(0, Math.min(100, fillPercent))}%` }]} />
                <View style={[styles.sliderThumb, { left: `${Math.max(0, Math.min(100, fillPercent))}%` }]} />
              </View>
              <Text style={styles.sliderTick}>₹50L+</Text>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearch}
              activeOpacity={0.85}
            >
              <Text style={styles.searchBtnText}>🔍  Search Jobs for Me</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 40,
    maxHeight: '90%',
    ...SHADOWS.large,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: SPACING.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeX: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  sheetTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
    paddingRight: 48,
    lineHeight: 28,
  },
  rowLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  multiHint: {
    fontWeight: '500',
    textTransform: 'none',
    fontSize: 11,
    letterSpacing: 0,
    color: COLORS.textMuted,
  },
  pillRow: {
    marginBottom: SPACING.xs,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  pillSelectedSingle: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillSelectedMulti: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  pillText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  pillCheck: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: '800',
  },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    height: 48,
  },
  locationIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  locationInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  sliderTick: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    minWidth: 32,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -8,
    marginLeft: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  salaryValue: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: TYPOGRAPHY.fontSizes.md,
    textTransform: 'none',
    letterSpacing: 0,
  },
  searchBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.medium,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
});
