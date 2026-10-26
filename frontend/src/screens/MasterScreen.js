import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert, 
  ScrollView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const fontRegular = Platform.select({ ios: 'System', android: 'sans-serif' });
const fontMedium = Platform.select({ ios: 'System', android: 'sans-serif-medium' });

const MasterScreen = ({ route }) => {
  const { theme, isDarkMode } = useTheme();
  const { title, endpoint } = route.params;
  const isUserEndpoint = endpoint.includes('users');
  const isDept = endpoint.includes('departments');
  const isProg = endpoint.includes('programmes');
  const isBlock = endpoint.includes('blocks');
  const isRoom = endpoint.includes('rooms');
  const isRole = endpoint.includes('roles');

  // Updated Modern Section Theme & Colors
  const getSectionTheme = () => {
    if (isDept) return { color: '#0284c7', lightColor: '#38bdf8', icon: 'business-outline', label: 'DEPARTMENT' };
    if (isProg) return { color: '#059669', lightColor: '#10b981', icon: 'school-outline', label: 'PROGRAMME' };
    if (isBlock) return { color: '#d97706', lightColor: '#f59e0b', icon: 'cube-outline', label: 'CAMPUS BLOCK' };
    if (isRoom) return { color: '#7c3aed', lightColor: '#a855f7', icon: 'home-outline', label: 'ROOM / LAB' };
    if (isRole) return { color: '#e11d48', lightColor: '#f43f5e', icon: 'shield-checkmark-outline', label: 'USER ROLE' };
    if (isUserEndpoint) return { color: '#4f46e5', lightColor: '#6366f1', icon: 'people-outline', label: 'USER ACCOUNT' };
    return { color: '#0284c7', lightColor: '#38bdf8', icon: 'apps-outline', label: 'MASTER' };
  };

  const sectionTheme = getSectionTheme();
  
  const [data, setData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [blocks, setBlocks] = useState([]);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  // Input fields
  const [inputValue, setInputValue] = useState('');
  const [shortNameValue, setShortNameValue] = useState('');
  const [departmentValue, setDepartmentValue] = useState('');
  const [programmeValue, setProgrammeValue] = useState('');
  const [blockValue, setBlockValue] = useState('');
  const [floorValue, setFloorValue] = useState('1');
  const [capacityValue, setCapacityValue] = useState('5');

  // User specific fields
  const [emailValue, setEmailValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [roleValue, setRoleValue] = useState('');

  const fetchData = async () => {
    try {
      const res = await axios.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching master data:', err);
    }
  };

  const fetchDropdownMasters = async () => {
    try {
      if (isProg || isBlock || isRoom || isUserEndpoint) {
        const dRes = await axios.get('/master/departments');
        setDepartments(dRes.data);
      }
      if (isBlock || isRoom || isUserEndpoint) {
        const pRes = await axios.get('/master/programmes');
        setProgrammes(pRes.data);
      }
      if (isRoom) {
        const bRes = await axios.get('/master/blocks');
        setBlocks(bRes.data);
      }
      if (isUserEndpoint) {
        const rRes = await axios.get('/master/roles');
        setRoles(rRes.data);
      }
    } catch (err) {
      console.error('Error fetching master dropdowns:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDropdownMasters();
  }, [endpoint]);

  const handleSave = async () => {
    if (!inputValue) {
      return Alert.alert('Error', isRoom ? 'Please enter Room Number' : 'Please enter Name');
    }
    
    let payload = {};

    if (isDept) {
      payload = {
        name: inputValue,
        shortName: shortNameValue || '-'
      };
    } else if (isProg) {
      payload = {
        name: inputValue,
        shortName: shortNameValue || '-',
        department: departmentValue || null
      };
    } else if (isBlock) {
      payload = {
        name: inputValue,
        department: departmentValue || null,
        programme: programmeValue || null
      };
    } else if (isRoom) {
      payload = {
        roomNumber: inputValue,
        department: departmentValue || null,
        programme: programmeValue || null,
        block: blockValue || null,
        floor: floorValue || '1',
        capacity: capacityValue || '5'
      };
    } else if (isUserEndpoint) {
      if (!emailValue || !phoneValue || !roleValue) {
        return Alert.alert('Error', 'Please fill all fields: Name, Email, Phone, and Role');
      }
      payload = { 
        name: inputValue, 
        email: emailValue, 
        phone: phoneValue, 
        role: roleValue,
        password: 'password123' 
      };
    } else {
      payload = { name: inputValue };
    }

    try {
      if (currentItem) {
        await axios.put(`${endpoint}/${currentItem._id}`, payload);
        
        if (isUserEndpoint) {
           const myUserStr = await AsyncStorage.getItem('user');
           if (myUserStr) {
             const myUser = JSON.parse(myUserStr);
             if (myUser.id === currentItem._id) {
                myUser.name = payload.name;
                myUser.email = payload.email;
                myUser.phone = payload.phone;
                await AsyncStorage.setItem('user', JSON.stringify(myUser));
             }
           }
        }
      } else {
        await axios.post(endpoint, payload);
      }
      setModalVisible(false);
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to save. Check backend constraints.');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: async () => {
          try {
            await axios.delete(`${endpoint}/${id}`);
            fetchData();
          } catch(err) {
            Alert.alert('Error', 'Failed to delete');
          }
      }, style: 'destructive' }
    ]);
  };

  const openEdit = (item) => {
    setCurrentItem(item);
    setInputValue(item.name || item.roomNumber || item.email || '');
    setShortNameValue(item.shortName || '');
    setDepartmentValue(item.department?._id || item.department || '');
    setProgrammeValue(item.programme?._id || item.programme || '');
    setBlockValue(item.block?._id || item.block || '');
    setFloorValue(item.floor || '1');
    setCapacityValue(item.capacity || '5');

    if (isUserEndpoint) {
      setEmailValue(item.email || '');
      setPhoneValue(item.phone || '');
      setRoleValue(item.role?._id || item.role || '');
    }
    setModalVisible(true);
  };

  const openAdd = () => {
    setCurrentItem(null);
    setInputValue('');
    setShortNameValue('');
    setDepartmentValue('');
    setProgrammeValue('');
    setBlockValue('');
    setFloorValue('1');
    setCapacityValue('5');

    if (isUserEndpoint) {
      setEmailValue('');
      setPhoneValue('');
      setRoleValue('');
    }
    setModalVisible(true);
  };

  const modalProgrammes = departmentValue
    ? programmes.filter(p => (p.department?._id || p.department) === departmentValue)
    : programmes;

  const modalBlocks = programmeValue
    ? blocks.filter(b => (b.programme?._id || b.programme) === programmeValue)
    : departmentValue
    ? blocks.filter(b => (b.department?._id || b.department) === departmentValue)
    : blocks;

  const renderItem = ({ item }) => (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
          borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
          borderTopColor: sectionTheme.color,
          borderTopWidth: 3.5
        }
      ]}
    >
      {/* 1. Header Row: Section Icon + Title & ShortName Badge */}
      <View style={styles.cardHeader}>
        <View style={[styles.headerIconBox, { backgroundColor: sectionTheme.color + '18' }]}>
          <Ionicons name={sectionTheme.icon} size={20} color={sectionTheme.color} />
        </View>

        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.tagLabel, { color: sectionTheme.lightColor }]}>
            {sectionTheme.label}
          </Text>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
            {isRoom ? (item.roomNumber ? `Room ${item.roomNumber}` : item.name) : (item.name || item.email || '-')}
          </Text>
        </View>

        {item.shortName ? (
          <View style={[styles.badgeChip, { backgroundColor: sectionTheme.color + '18', borderColor: sectionTheme.color + '35' }]}>
            <Text style={[styles.badgeChipText, { color: sectionTheme.lightColor }]}>{item.shortName}</Text>
          </View>
        ) : isRoom ? (
          <View style={[styles.badgeChip, { backgroundColor: sectionTheme.color + '18', borderColor: sectionTheme.color + '35' }]}>
            <Text style={[styles.badgeChipText, { color: sectionTheme.lightColor }]}>Floor {item.floor || '1'}</Text>
          </View>
        ) : null}
      </View>

      {/* 2. Structured Information Chips */}
      <View style={styles.chipsContainer}>
        {isDept && item.shortName && (
          <View style={[styles.infoChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
            <Ionicons name="pricetag-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
            <Text style={[styles.infoChipText, { color: theme.text }]}>Code: {item.shortName}</Text>
          </View>
        )}

        {isProg && (
          <>
            {item.shortName && (
              <View style={[styles.infoChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                <Ionicons name="pricetag-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
                <Text style={[styles.infoChipText, { color: theme.text }]}>Code: {item.shortName}</Text>
              </View>
            )}
            <View style={[styles.infoChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="business-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
              <Text style={[styles.infoChipText, { color: theme.text }]}>
                {item.department?.name || item.department || 'No Dept'}
              </Text>
            </View>
          </>
        )}

        {isBlock && (
          <>
            <View style={[styles.infoChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="business-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
              <Text style={[styles.infoChipText, { color: theme.text }]}>
                {item.department?.name || item.department || 'No Dept'}
              </Text>
            </View>
            <View style={[styles.infoChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="school-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
              <Text style={[styles.infoChipText, { color: theme.text }]}>
                {item.programme?.name || item.programme || 'No Prog'}
              </Text>
            </View>
          </>
        )}

        {isRoom && (
          <>
            <View style={[styles.infoChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="cube-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
              <Text style={[styles.infoChipText, { color: theme.text }]}>
                {item.block?.name || 'No Block'}
              </Text>
            </View>
            <View style={[styles.infoChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="layers-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
              <Text style={[styles.infoChipText, { color: theme.text }]}>Floor {item.floor || '1'}</Text>
            </View>
            <View style={[styles.infoChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="people-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
              <Text style={[styles.infoChipText, { color: theme.text }]}>Capacity: {item.capacity || '5'}</Text>
            </View>
          </>
        )}

        {isUserEndpoint && (
          <>
            <View style={[styles.infoChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="mail-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
              <Text style={[styles.infoChipText, { color: theme.text }]}>{item.email || '-'}</Text>
            </View>
            <View style={[styles.infoChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="call-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
              <Text style={[styles.infoChipText, { color: theme.text }]}>{item.phone || '-'}</Text>
            </View>
            <View style={[styles.infoChip, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="shield-checkmark-outline" size={13} color={theme.textMuted} style={{ marginRight: 5 }} />
              <Text style={[styles.infoChipText, { color: theme.text }]}>{item.role?.name || item.role || '-'}</Text>
            </View>
          </>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1e293b' : '#e2e8f0' }]} />

      {/* 3. Action Row - Outlined Pill Edit & Delete Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.btn, styles.editBtn]} 
          onPress={() => openEdit(item)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={13} color="#38bdf8" style={{ marginRight: 5 }} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, styles.deleteBtn]} 
          onPress={() => handleDelete(item._id)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={13} color="#f43f5e" style={{ marginRight: 5 }} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: sectionTheme.color, shadowColor: sectionTheme.color }]} 
          onPress={openAdd}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Form Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <View style={[styles.modalIconBox, { backgroundColor: sectionTheme.color + '18', borderColor: sectionTheme.color + '35' }]}>
                <Ionicons name={currentItem ? "create-outline" : "add-circle-outline"} size={26} color={sectionTheme.color} />
              </View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{currentItem ? 'Edit' : 'Add'} {title}</Text>
            </View>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
              
              <Text style={[styles.inputFieldLabel, { color: theme.textMuted }]}>
                {isRoom ? 'ROOM NUMBER *' : isRole ? 'ROLE NAME *' : 'NAME *'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', borderColor: theme.border, color: theme.text }]}
                placeholder={isRoom ? "e.g. 201" : "Enter Name..."}
                placeholderTextColor={theme.textMuted}
                value={inputValue}
                onChangeText={setInputValue}
              />

              {(isDept || isProg) && (
                <>
                  <Text style={[styles.inputFieldLabel, { color: theme.textMuted }]}>SHORT NAME / CODE</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', borderColor: theme.border, color: theme.text }]}
                    placeholder="e.g. MBA, CS, BCA"
                    placeholderTextColor={theme.textMuted}
                    value={shortNameValue}
                    onChangeText={setShortNameValue}
                  />
                </>
              )}

              {(isProg || isBlock || isRoom) && (
                <>
                  <Text style={[styles.inputFieldLabel, { color: theme.textMuted }]}>DEPARTMENT</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', borderColor: theme.border }]}>
                    <Picker
                      selectedValue={departmentValue}
                      onValueChange={(val) => setDepartmentValue(val)}
                      style={{ color: theme.text, height: 55, fontFamily: fontRegular }}
                      dropdownIconColor={theme.text}
                      mode="dropdown"
                    >
                      <Picker.Item label="Select Department..." value="" />
                      {departments.map(d => (
                        <Picker.Item key={d._id} label={d.name} value={d._id} />
                      ))}
                    </Picker>
                  </View>
                </>
              )}

              {(isBlock || isRoom) && (
                <>
                  <Text style={[styles.inputFieldLabel, { color: theme.textMuted }]}>PROGRAMME</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', borderColor: theme.border }]}>
                    <Picker
                      selectedValue={programmeValue}
                      onValueChange={(val) => setProgrammeValue(val)}
                      style={{ color: theme.text, height: 55, fontFamily: fontRegular }}
                      dropdownIconColor={theme.text}
                      mode="dropdown"
                    >
                      <Picker.Item label="Select Programme..." value="" />
                      {modalProgrammes.map(p => (
                        <Picker.Item key={p._id} label={p.name} value={p._id} />
                      ))}
                    </Picker>
                  </View>
                </>
              )}

              {isRoom && (
                <>
                  <Text style={[styles.inputFieldLabel, { color: theme.textMuted }]}>BLOCK</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', borderColor: theme.border }]}>
                    <Picker
                      selectedValue={blockValue}
                      onValueChange={(val) => setBlockValue(val)}
                      style={{ color: theme.text, height: 55, fontFamily: fontRegular }}
                      dropdownIconColor={theme.text}
                      mode="dropdown"
                    >
                      <Picker.Item label="Select Block..." value="" />
                      {modalBlocks.map(b => (
                        <Picker.Item key={b._id} label={b.name} value={b._id} />
                      ))}
                    </Picker>
                  </View>

                  <Text style={[styles.inputFieldLabel, { color: theme.textMuted }]}>FLOOR</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', borderColor: theme.border, color: theme.text }]}
                    placeholder="e.g. 1, 2, 3"
                    placeholderTextColor={theme.textMuted}
                    value={floorValue}
                    onChangeText={setFloorValue}
                  />

                  <Text style={[styles.inputFieldLabel, { color: theme.textMuted }]}>CAPACITY</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', borderColor: theme.border, color: theme.text }]}
                    placeholder="e.g. 5"
                    placeholderTextColor={theme.textMuted}
                    value={capacityValue}
                    onChangeText={setCapacityValue}
                  />
                </>
              )}

              {isUserEndpoint && (
                <>
                  <Text style={[styles.inputFieldLabel, { color: theme.textMuted }]}>EMAIL *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', borderColor: theme.border, color: theme.text }]}
                    placeholder="Enter Email"
                    placeholderTextColor={theme.textMuted}
                    value={emailValue}
                    onChangeText={setEmailValue}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text style={[styles.inputFieldLabel, { color: theme.textMuted }]}>PHONE NUMBER *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', borderColor: theme.border, color: theme.text }]}
                    placeholder="Enter Phone Number"
                    placeholderTextColor={theme.textMuted}
                    value={phoneValue}
                    onChangeText={setPhoneValue}
                    keyboardType="phone-pad"
                  />
                  <Text style={[styles.inputFieldLabel, { color: theme.textMuted }]}>ROLE *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5', borderColor: theme.border }]}>
                    <Picker
                      selectedValue={roleValue}
                      onValueChange={(itemValue) => setRoleValue(itemValue)}
                      style={{ color: theme.text, height: 55, fontFamily: fontRegular }}
                      dropdownIconColor={theme.text}
                      mode="dropdown"
                    >
                      <Picker.Item label="Select Role..." value="" />
                      {roles.map(r => (
                        <Picker.Item key={r._id} label={r.name} value={r._id} />
                      ))}
                    </Picker>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={[styles.modalActionRow, { borderTopColor: theme.border }]}>
              <TouchableOpacity 
                style={[styles.cancelBtn, { backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7', borderColor: theme.border }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={{ flex: 1, marginLeft: 10 }}>
                <LinearGradient
                  colors={[sectionTheme.color, sectionTheme.lightColor]}
                  style={styles.saveBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.saveBtnText}>Save</Text>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginLeft: 6 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    fontFamily: fontMedium, 
    letterSpacing: 0.3 
  },
  addBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 10, 
    elevation: 3, 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 5 
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13, fontFamily: fontMedium },
  
  // Redesigned Card Container
  card: { 
    padding: 16, 
    marginBottom: 14, 
    borderRadius: 16, 
    borderWidth: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tagLabel: { 
    fontSize: 10, 
    fontWeight: '800', 
    letterSpacing: 1, 
    textTransform: 'uppercase',
    fontFamily: fontMedium,
    marginBottom: 2,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    letterSpacing: 0.2, 
    fontFamily: fontMedium,
  },
  badgeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeChipText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: fontMedium,
  },

  // Information Chips Row
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  infoChipText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontMedium,
  },

  divider: { 
    height: 1, 
    marginVertical: 10,
    opacity: 0.6,
  },

  // Action Buttons
  actionRow: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    alignItems: 'center',
  },
  btn: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 8, 
    marginLeft: 8,
    borderWidth: 1.5,
  },
  editBtn: { 
    backgroundColor: 'rgba(56, 189, 248, 0.1)', 
    borderColor: '#38bdf8',
  },
  deleteBtn: { 
    backgroundColor: 'rgba(244, 63, 94, 0.1)', 
    borderColor: '#f43f5e',
  },
  editBtnText: { color: '#38bdf8', fontWeight: 'bold', fontSize: 12, fontFamily: fontMedium },
  deleteBtnText: { color: '#f43f5e', fontWeight: 'bold', fontSize: 12, fontFamily: fontMedium },

  // Modal styling
  modalBg: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', padding: 20 },
  modalCard: { padding: 22, borderRadius: 20, borderWidth: 1, maxHeight: '88%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, borderBottomWidth: 1, paddingBottom: 14 },
  modalIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5, fontFamily: fontMedium },
  inputFieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase', fontFamily: fontMedium },
  input: { padding: 14, borderRadius: 12, marginBottom: 14, borderWidth: 1, fontSize: 14, fontFamily: fontRegular },
  pickerContainer: { borderRadius: 12, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 15, borderTopWidth: 1 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  cancelBtnText: { fontWeight: 'bold', fontSize: 15, fontFamily: fontMedium },
  saveBtnGradient: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, fontFamily: fontMedium }
});

export default MasterScreen;
