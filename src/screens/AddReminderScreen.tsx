import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { v4 as uuidv4 } from 'uuid';
import { RootStackParamList, ThemeContext } from '../../App';
import Colors from '../constants/Colors';
import { useRoute, RouteProp } from '@react-navigation/native';
import { getReminders, saveReminder, updateReminder, Reminder } from '../utils/storage';
import { scheduleNotification } from '../utils/notifications';
type AddReminderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AddReminder'
>;

type Props = {
  navigation: AddReminderScreenNavigationProp;
};

type AddReminderRouteProp = RouteProp<RootStackParamList, 'AddReminder'>;

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 10,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
        color: colors.text,
    },
    input: {
        backgroundColor: colors.input,
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        fontSize: 16,
        justifyContent: 'center',
        color: colors.text,
    },
    inputText: {
        color: colors.text,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    frequencyContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    frequencyButton: {
        borderWidth: 1,
        borderColor: colors.input,
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    frequencyButtonSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    frequencyButtonText: {
        color: colors.text,
    },
    frequencyButtonTextSelected: {
        color: colors.buttonText,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    button: {
        borderRadius: 10,
        paddingVertical: 15,
        paddingHorizontal: 40,
    },
    saveButton: {
        backgroundColor: colors.primary,
    },
    clearButton: {
        backgroundColor: colors.input,
    },
    buttonText: {
        color: colors.buttonText,
        fontWeight: 'bold',
        fontSize: 16,
    },
    clearButtonText: {
        color: colors.buttonTextSecondary,
    },
});

const AddReminderScreen: React.FC<Props> = ({ navigation }) => {
  const route = useRoute<AddReminderRouteProp>();
  const reminderId = route.params?.reminderId;
  const [isEditMode, setIsEditMode] = useState(!!reminderId);

  const { theme } = useContext(ThemeContext);
  const themeColors = Colors[theme];
  const styles = getStyles(themeColors);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState<
    'One time' | 'Daily' | 'Weekly' | 'Custom'
  >('One time');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (isEditMode && reminderId) {
      const loadReminder = async () => {
        const reminders = await getReminders();
        const reminderToEdit = reminders.find(r => r.id === reminderId);
        if (reminderToEdit) {
          setTitle(reminderToEdit.title);
          const savedDate = new Date(reminderToEdit.date);
          const savedTime = new Date(reminderToEdit.time);
          const reminderDateTime = new Date(savedDate.getFullYear(), savedDate.getMonth(), savedDate.getDate(), savedTime.getHours(), savedTime.getMinutes());

          if (reminderDateTime < new Date()) {
            setDate(new Date());
            setTime(new Date());
          } else {
            setDate(savedDate);
            setTime(savedTime);
          }
          
          setNote(reminderToEdit.note || '');
          setFrequency(reminderToEdit.frequency);
        }
      };
      loadReminder();
    }
  }, [isEditMode, reminderId]);

  
  const handleSave = async () => {
    if (!title) {
      alert('Please enter a title.');
      return;
    }

    const reminderDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes());

    if (reminderDateTime < new Date()) {
      alert("You cannot set a reminder for a past date or time.");
      return;
    }

    const reminderData: Omit<Reminder, 'id'> = {
      title,
      date: date.toISOString(),
      time: time.toISOString(),
      note,
      frequency,
    };

    if (isEditMode && reminderId) {
      await updateReminder({ id: reminderId, ...reminderData });
      await scheduleNotification(reminderId, reminderData.title, reminderDateTime, frequency);
    } else {
      const newId = uuidv4();
      await saveReminder({ id: newId, ...reminderData });
      await scheduleNotification(newId, reminderData.title, reminderDateTime, frequency);
    }

    navigation.goBack();
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);

    const now = new Date();
    if (
      currentDate.getFullYear() === now.getFullYear() &&
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getDate() === now.getDate() &&
      time < now
    ) {
      setTime(now);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, backgroundColor: themeColors.background }}>
      <View style={styles.card}>
        <Text style={styles.label}>Task Title*</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Youth Meeting"
          placeholderTextColor={themeColors.icon}
        />

        <Text style={styles.label}>Reminder Date*</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.input}
        >
          <Text style={styles.inputText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
            themeVariant={theme}
          />
        )}

        <Text style={styles.label}>Reminder Time*</Text>
        <TouchableOpacity
          onPress={() => setShowTimePicker(true)}
          style={styles.input}
        >
          <Text style={styles.inputText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            display="default"
            onChange={onTimeChange}
            minimumDate={
              new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
              ).toDateString() === new Date().toDateString()
                ? new Date()
                : undefined
            }
            themeVariant={theme}
          />
        )}

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={note}
          onChangeText={setNote}
          placeholder="Add a note..."
          placeholderTextColor={themeColors.icon}
          multiline
        />

        <Text style={styles.label}>Reminder Frequency*</Text>
        <View style={styles.frequencyContainer}>
          {['One time', 'Daily', 'Weekly', 'Custom'].map(freq => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                frequency === freq && styles.frequencyButtonSelected,
              ]}
              onPress={() =>
                setFrequency(freq as 'One time' | 'Daily' | 'Weekly' | 'Custom')
              }
            >
              <Text
                style={[
                  styles.frequencyButtonText,
                  frequency === freq && styles.frequencyButtonTextSelected,
                ]}
              >
                {freq}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={() => navigation.goBack()}>
            <Text style={[styles.buttonText, styles.clearButtonText]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default AddReminderScreen;