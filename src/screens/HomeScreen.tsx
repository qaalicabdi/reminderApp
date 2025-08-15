import React, { useCallback, useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, ThemeContext } from '../../App';
import Colors from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { getReminders, deleteReminder, Reminder, deleteSelectedReminders } from '../utils/storage';
import { cancelNotification } from '../utils/notifications';
import { SafeAreaView } from 'react-native-safe-area-context';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const getStyles = (colors, isSelected = false) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 20,
  },
  searchInput: {
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 10,
    padding: 10,
    marginTop: 15,
  },
  noRemindersText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: colors.icon,
  },
  list: {
    padding: 10,
  },
  card: {
    backgroundColor: isSelected ? colors.primary + '33' : colors.card,
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: isSelected ? 1 : 0,
    borderColor: isSelected ? colors.primary : 'transparent',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: colors.text,
  },
  cardText: {
    color: colors.text,
  },
  checkbox: {
    marginLeft: 15,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { theme, toggleTheme } = useContext(ThemeContext);
  const themeColors = Colors[theme];
  
  const loadReminders = async () => {
    const storedReminders = await getReminders();
    setReminders(storedReminders);
  };

  const handleSearchToggle = () => {
    if (isSearchVisible) {
      setSearchQuery('');
    }
    setIsSearchVisible(!isSearchVisible);
  };

  const handleLongPress = (id: string) => {
    setIsSelectionMode(true);
    setSelectedIds([id]);
  };

  const handlePress = (id: string) => {
    if (isSelectionMode) {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      } else {
        setSelectedIds([...selectedIds, id]);
      }
    } else {
      navigation.navigate('AddReminder', { reminderId: id });
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      `Delete ${selectedIds.length} Reminder(s)`,
      'Are you sure you want to delete the selected reminders?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteSelectedReminders(selectedIds);
          await Promise.all(selectedIds.map(id => cancelNotification(id)));
          exitSelectionMode();
          loadReminders();
        }},
      ]
    );
  };

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredReminders(reminders);
    } else {
      const filtered = reminders.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredReminders(filtered);
    }
  }, [searchQuery, reminders]);

  useEffect(() => {
    if (isSelectionMode && selectedIds.length === 0) {
      exitSelectionMode();
    }
  }, [selectedIds, isSelectionMode]);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
      exitSelectionMode(); // Exit selection mode on screen focus
    }, [])
  );

  const renderItem = ({ item }: { item: Reminder }) => {
    const isSelected = selectedIds.includes(item.id);
    const styles = getStyles(themeColors, isSelected);
    return (
      <TouchableOpacity 
        onPress={() => handlePress(item.id)}
        onLongPress={() => handleLongPress(item.id)}
      >
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardText}>{new Date(item.date).toLocaleDateString()}</Text>
            <Text style={styles.cardText}>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          {isSelectionMode && (
            <View style={styles.checkbox}>
              <Ionicons 
                name={isSelected ? 'checkbox' : 'square-outline'} 
                size={24} 
                color={themeColors.primary} 
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const styles = getStyles(themeColors);

  return (
    <View style={styles.container} >
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>
            {isSelectionMode ? `${selectedIds.length} selected` : 'Reminders'}
          </Text>
          <View style={styles.headerIcons}>
            {isSelectionMode ? (
              <>
                <TouchableOpacity onPress={handleDeleteSelected} style={styles.iconButton}>
                  <Ionicons name="trash" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={exitSelectionMode} style={styles.iconButton}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedIds.length === reminders.length && reminders.length > 0) {
                      setSelectedIds([]);
                    } else {
                      setSelectedIds(reminders.map(r => r.id));
                    }
                  }}
                  style={styles.iconButton}
                >
                  <Ionicons name={selectedIds.length === reminders.length && reminders.length > 0 ? "checkbox" : "square-outline"} size={24} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={handleSearchToggle} style={styles.iconButton}>
                  <Ionicons name={isSearchVisible ? 'close' : 'search'} size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
                  <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={24} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        {isSearchVisible && !isSelectionMode && (
          <TextInput 
            style={styles.searchInput}
            placeholder="Search reminders..."
            placeholderTextColor={themeColors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        )}
      </View>

      {filteredReminders.length === 0 ? (
        <Text style={styles.noRemindersText}>
          {searchQuery ? 'No reminders found.' : 'You have no reminders.'}
        </Text>
      ) : (
        <FlatList
          data={filteredReminders}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          extraData={selectedIds} // Re-render list when selection changes
        />
      )}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate({ name: 'AddReminder', params: {} })}
      >
        <Ionicons name="add" size={32} color={themeColors.buttonText} />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;