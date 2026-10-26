import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const fontRegular = Platform.select({ ios: 'System', android: 'sans-serif' });
const fontMedium = Platform.select({ ios: 'System', android: 'sans-serif-medium' });
import axios from '../api/axios';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const ComplaintRaiseScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProg, setSelectedProg] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  
  const [type, setType] = useState('PC Hardware');
  const [remarks, setRemarks] = useState('');

  const complaintTypes = ['PC Hardware', 'Networking', 'Electrical', 'Plumbing', 'Carpentry', 'Software', 'Others'];

  useEffect(() => {
    axios.get('/master/departments').then(res => setDepartments(res.data)).catch(err => console.log(err));
    axios.get('/master/programmes').then(res => setProgrammes(res.data)).catch(err => console.log(err));
    axios.get('/master/blocks').then(res => setBlocks(res.data)).catch(err => console.log(err));
    axios.get('/master/rooms').then(res => setRooms(res.data)).catch(err => console.log(err));
  }, []);

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!selectedDept || !selectedProg || !selectedBlock || !selectedRoom || !type || !remarks) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      await axios.post('/complaints', { 
        department: selectedDept, 
        programme: selectedProg, 
        block: selectedBlock, 
        room: selectedRoom, 
        type, 
        remarks 
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Complaint raised successfully');
      navigation.goBack();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Could not raise complaint');
    }
  };

  const filteredProgrammes = (programmes || []).filter(p => (p.department?._id || p.department) === selectedDept);
  const filteredBlocks = (blocks || []).filter(b => selectedProg ? ((b.programme?._id || b.programme) === selectedProg) : ((b.department?._id || b.department) === selectedDept));
  const filteredRooms = (rooms || []).filter(r => (r.block?._id || r.block) === selectedBlock);

  const handlePickerChange = (setter, val, clearSetters = []) => {
    Haptics.selectionAsync();
    setter(val);
    clearSetters.forEach(s => s(''));
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      
      <Animated.View entering={FadeInDown.delay(100).duration(600)}>
        <Text style={[styles.label, { color: theme.text }]}>Department</Text>
        <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Picker 
            style={{color: theme.text}} 
            selectedValue={selectedDept} 
            dropdownIconColor={theme.textMuted}
            onValueChange={(val) => handlePickerChange(setSelectedDept, val, [setSelectedProg, setSelectedBlock, setSelectedRoom])}
          >
            <Picker.Item label="Select Department..." value="" color={theme.textMuted} />
            {departments.map((d) => <Picker.Item key={d._id} label={d.name} value={d._id} />)}
          </Picker>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <Text style={[styles.label, { color: theme.text }]}>Programme</Text>
        <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }, !selectedDept && {opacity: 0.5}]}>
          <Picker 
            style={{color: theme.text}} 
            selectedValue={selectedProg} 
            enabled={!!selectedDept} 
            dropdownIconColor={theme.textMuted}
            onValueChange={(val) => handlePickerChange(setSelectedProg, val, [setSelectedBlock, setSelectedRoom])}
          >
            <Picker.Item label="Select Programme..." value="" color={theme.textMuted} />
            {filteredProgrammes.map((p) => <Picker.Item key={p._id} label={p.name} value={p._id} />)}
          </Picker>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(600)}>
        <Text style={[styles.label, { color: theme.text }]}>Block</Text>
        <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }, !selectedProg && {opacity: 0.5}]}>
          <Picker 
            style={{color: theme.text}} 
            selectedValue={selectedBlock} 
            enabled={!!selectedProg} 
            dropdownIconColor={theme.textMuted}
            onValueChange={(val) => handlePickerChange(setSelectedBlock, val, [setSelectedRoom])}
          >
            <Picker.Item label="Select Block..." value="" color={theme.textMuted} />
            {filteredBlocks.map((b) => <Picker.Item key={b._id} label={b.name} value={b._id} />)}
          </Picker>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(600)}>
        <Text style={[styles.label, { color: theme.text }]}>Room</Text>
        <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }, (!selectedProg || !selectedBlock) && {opacity: 0.5}]}>
          <Picker 
            style={{color: theme.text}} 
            selectedValue={selectedRoom} 
            enabled={!!(selectedProg && selectedBlock)} 
            dropdownIconColor={theme.textMuted}
            onValueChange={(val) => handlePickerChange(setSelectedRoom, val)}
          >
            <Picker.Item label="Select Room..." value="" color={theme.textMuted} />
            {filteredRooms.map((r) => <Picker.Item key={r._id} label={r.roomNumber} value={r._id} />)}
          </Picker>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(600)}>
        <Text style={[styles.label, { color: theme.text }]}>Complaint Type</Text>
        <View style={[styles.pickerContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Picker 
            style={{color: theme.text}} 
            selectedValue={type} 
            dropdownIconColor={theme.textMuted}
            onValueChange={(val) => handlePickerChange(setType, val)}
          >
            {complaintTypes.map((t) => <Picker.Item key={t} label={t} value={t} />)}
          </Picker>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(600)}>
        <Text style={[styles.label, { color: theme.text }]}>Remarks</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]} 
          placeholder="Enter description here..." 
          placeholderTextColor={theme.textMuted}
          value={remarks} 
          onChangeText={setRemarks} 
          multiline 
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(700).duration(600)}>
        <TouchableOpacity onPress={handleSubmit} style={{ marginTop: 25, borderRadius: 16, overflow: 'hidden', shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}>
          <LinearGradient 
            colors={isDarkMode ? ['#8b5cf6', '#6d28d9'] : ['#7c3aed', '#5b21b6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            <Ionicons name="paper-plane-outline" size={20} color="#fff" style={{marginRight: 10}} />
            <Text style={styles.submitBtnText}>SUBMIT COMPLAINT</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, paddingBottom: 50 },
  label: { fontWeight: '700', marginTop: 15, marginBottom: 8, fontSize: 14, letterSpacing: 0.5, marginLeft: 5, fontFamily: fontMedium },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 5,
    overflow: 'hidden',
    height: 55,
    justifyContent: 'center'
  },
  input: { 
    borderWidth: 1, 
    padding: 15, 
    marginVertical: 5, 
    borderRadius: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    fontFamily: fontRegular
  },
  submitBtn: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
    fontFamily: fontMedium
  }
});

export default ComplaintRaiseScreen;