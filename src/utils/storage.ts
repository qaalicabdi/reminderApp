import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  note?: string;
  frequency: 'One time' | 'Daily' | 'Weekly' | 'Custom';
}

const REMINDERS_KEY = 'reminders';

export const getReminders = async (): Promise<Reminder[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(REMINDERS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to fetch reminders.', e);
    return [];
  }
};

export const saveReminder = async (reminder: Reminder): Promise<void> => {
  try {
    const existingReminders = await getReminders();
    const newReminders = [reminder, ...existingReminders];
    const jsonValue = JSON.stringify(newReminders);
    await AsyncStorage.setItem(REMINDERS_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to save reminder.', e);
  }
};

export const updateReminder = async (updatedReminder: Reminder): Promise<void> => {
  try {
    const existingReminders = await getReminders();
    const newReminders = existingReminders.map(r => r.id === updatedReminder.id ? updatedReminder : r);
    const jsonValue = JSON.stringify(newReminders);
    await AsyncStorage.setItem(REMINDERS_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to update reminder.', e);
  }
};

export const deleteReminder = async (id: string): Promise<void> => {
  try {
    const existingReminders = await getReminders();
    const newReminders = existingReminders.filter(r => r.id !== id);
    const jsonValue = JSON.stringify(newReminders);
    await AsyncStorage.setItem(REMINDERS_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to delete reminder.', e);
  }
};

export const deleteAllReminders = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to delete all reminders.', e);
  }
};

export const deleteSelectedReminders = async (ids: string[]): Promise<void> => {
  try {
    const existingReminders = await getReminders();
    const newReminders = existingReminders.filter(r => !ids.includes(r.id));
    const jsonValue = JSON.stringify(newReminders);
    await AsyncStorage.setItem(REMINDERS_KEY, jsonValue);
  } catch (e) {
    console.error('Failed to delete selected reminders.', e);
  }
};
