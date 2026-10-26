import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl, 
  Alert, 
  Platform,
  Modal,
  ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import SkeletonLoader from '../components/SkeletonLoader';

const fontRegular = Platform.select({ ios: 'System', android: 'sans-serif' });
const fontMedium = Platform.select({ ios: 'System', android: 'sans-serif-medium' });

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
};

const ComplaintListScreen = ({ route }) => {
  const { theme, isDarkMode } = useTheme();
  const [complaints, setComplaints] = useState([]);
  const [role, setRole] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState(route.params?.filterStatus || 'All');

  // Interactive Modals
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  useEffect(() => {
    if (route.params?.filterStatus) {
      setSelectedStatus(route.params.filterStatus);
    }
  }, [route.params?.filterStatus]);

  const fetchComplaints = async () => {
    try {
      const res = await axios.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get('/master/users');
      const workers = res.data.filter(u => u.role?.name !== 'Superadmin' && u.role?.name !== 'User');
      setStaffList(workers);
    } catch(err) { console.log(err); }
  };

  useEffect(() => {
    fetchComplaints();
    AsyncStorage.getItem('role').then(r => {
      setRole(r);
      if (r === 'Superadmin') fetchStaff();
    });
  }, []);

  const onRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchComplaints().then(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRefreshing(false);
    });
  }, []);

  const updateStatus = async (id, newStatus, assignedTo = null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let payload = { status: newStatus };
      if (assignedTo) payload.assignedTo = assignedTo;
      await axios.put(`/complaints/${id}`, payload);
      fetchComplaints();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Complaint marked as ${newStatus}`);
    } catch (err) {
      console.log(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update complaint');
    }
  };

  const deleteComplaint = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Complaint', 'Are you sure you want to delete this complaint?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        onPress: async () => {
          try {
            await axios.delete(`/complaints/${id}`);
            fetchComplaints();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch(err) {
            Alert.alert('Error', 'Failed to delete complaint');
          }
        }, 
        style: 'destructive' 
      }
    ]);
  };

  const handleComplete = (item) => {
    Haptics.selectionAsync();
    if (item.status === 'Completed') {
      Alert.alert('Notice', 'This complaint is already marked as Completed.');
      return;
    }
    Alert.alert(
      'Complete Complaint',
      `Mark complaint "${item.type || 'General'}" as Completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: () => updateStatus(item._id, 'Completed') }
      ]
    );
  };

  const openAssignModal = (item) => {
    Haptics.selectionAsync();
    setSelectedComplaint(item);
    setAssignModalVisible(true);
  };

  const openStatusModal = (item) => {
    Haptics.selectionAsync();
    setSelectedComplaint(item);
    setStatusModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return '#eab308';
      case 'Assigned': return '#38bdf8';
      case 'In-Progress': return theme.primary;
      case 'On-Hold':
      case 'Onhold': return '#f97316';
      case 'Completed': return theme.success;
      case 'Closed': return theme.textMuted;
      default: return theme.textMuted;
    }
  };

  const statusOptions = ['Pending', 'Assigned', 'In-Progress', 'On-Hold', 'Completed', 'Closed'];

  const renderItem = ({ item, index }) => {
    const statusColor = getStatusColor(item.status);
    const roomDisplayName = item.room?.roomNumber 
      ? `Room ${item.room.roomNumber}` 
      : (item.room?.name || 'No Room');
    
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 80).duration(450)} 
        style={[
          styles.card, 
          { 
            backgroundColor: theme.card, 
            borderColor: theme.border 
          }
        ]}
      >
        {/* Left Vertical Accent Bar (Matching Screenshot Model) */}
        <View style={[styles.accentBar, { backgroundColor: statusColor }]} />

        {/* Top Row: Title, Date & Outlined Status Badge */}
        <View style={styles.topRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.complaintTitle, { color: theme.text }]} numberOfLines={1}>
              {item.type || 'General Issue'}
            </Text>
            <Text style={[styles.dateText, { color: theme.textMuted }]}>
              {formatDateTime(item.createdAt)}
            </Text>
          </View>
          
          {/* Outlined Status Badge */}
          <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: statusColor + '12' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {(item.status || 'PENDING').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Location Chips Row: Block and Room Badges */}
        <View style={styles.locationRow}>
          <View style={[styles.locationChip, { backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7' }]}>
            <Ionicons name="business" size={13} color={theme.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.locationChipText, { color: theme.text }]}>
              {item.block?.name || 'No Block'}
            </Text>
          </View>

          <View style={[styles.locationChip, { backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7' }]}>
            <Ionicons name="home-outline" size={13} color="#f59e0b" style={{ marginRight: 6 }} />
            <Text style={[styles.locationChipText, { color: theme.text }]}>
              {roomDisplayName}
            </Text>
          </View>
        </View>

        {/* Subtle Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Creator Row: Blue user icon + By: username */}
        <View style={styles.creatorRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <Ionicons name="person" size={13} color={theme.secondary} style={{ marginRight: 6 }} />
            <Text style={[styles.byLabel, { color: theme.textMuted }]}>By: </Text>
            <Text style={[styles.userName, { color: theme.text }]}>
              {item.user?.name || 'Unknown'}
            </Text>
            {item.assignedTo && (
              <View style={[styles.assignedTag, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '35' }]}>
                <Ionicons name="shield-checkmark" size={11} color={theme.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.assignedTagText, { color: theme.primary }]}>
                  {item.assignedTo.name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Remarks / Description if available */}
        {item.remarks ? (
          <Text style={[styles.remarksText, { color: theme.textMuted }]} numberOfLines={2}>
            {item.remarks}
          </Text>
        ) : null}

        {/* Action Buttons Row */}
        <View style={styles.actionsContainer}>
          {role === 'Superadmin' ? (
            /* Superadmin: ONLY Assign and Delete buttons side-by-side */
            <View style={styles.buttonsRow}>
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '10', flex: 1, marginRight: 8 }]}
                onPress={() => openAssignModal(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="person" size={14} color={theme.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.outlineBtnText, { color: theme.primary }]}>Assign</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: theme.error, backgroundColor: theme.error + '10', flex: 1 }]}
                onPress={() => deleteComplaint(item._id)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={14} color={theme.error} style={{ marginRight: 5 }} />
                <Text style={[styles.outlineBtnText, { color: theme.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Other Roles: Technicians (Complete, Status) & Regular Users (Delete pending) */
            <View style={styles.buttonsRow}>
              {/* Complete Button for Technicians/Staff */}
              {role !== 'User' && (
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: theme.success, backgroundColor: theme.success + '10' }]}
                  onPress={() => handleComplete(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-done" size={15} color={theme.success} style={{ marginRight: 5 }} />
                  <Text style={[styles.outlineBtnText, { color: theme.success }]}>Complete</Text>
                </TouchableOpacity>
              )}

              {/* Status Button for Technicians/Staff */}
              {role !== 'User' && (
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: theme.secondary, backgroundColor: theme.secondary + '10' }]}
                  onPress={() => openStatusModal(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="sync" size={14} color={theme.secondary} style={{ marginRight: 5 }} />
                  <Text style={[styles.outlineBtnText, { color: theme.secondary }]}>Status</Text>
                </TouchableOpacity>
              )}

              {/* Delete Button for regular User on pending complaints */}
              {role === 'User' && item.status === 'Pending' && (
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: theme.error, backgroundColor: theme.error + '10' }]}
                  onPress={() => deleteComplaint(item._id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={14} color={theme.error} style={{ marginRight: 5 }} />
                  <Text style={[styles.outlineBtnText, { color: theme.error }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  if (loading) return <SkeletonLoader />;

  const filteredComplaints = complaints.filter(c => {
    const typeMatch = selectedType === 'All' || c.type === selectedType;
    const statusMatch = selectedStatus === 'All' || c.status === selectedStatus;
    return typeMatch && statusMatch;
  });

  const complaintTypes = ['All', 'PC Hardware', 'Networking', 'Electrical', 'Plumbing', 'Carpentry', 'Software', 'Others'];
  const filterStatusTypes = ['All', 'Pending', 'Assigned', 'In-Progress', 'On-Hold', 'Completed', 'Closed'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Filters Header */}
      <View style={styles.filtersHeader}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>Filter by Type:</Text>
          <View style={[styles.filterContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Picker
              selectedValue={selectedType}
              onValueChange={(itemValue) => {
                Haptics.selectionAsync();
                setSelectedType(itemValue);
              }}
              style={{ color: theme.text, height: 48 }}
              dropdownIconColor={theme.text}
              mode="dropdown"
            >
              {complaintTypes.map((type, index) => (
                <Picker.Item key={index} label={type} value={type} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>Filter by Status:</Text>
          <View style={[styles.filterContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Picker
              selectedValue={selectedStatus}
              onValueChange={(itemValue) => {
                Haptics.selectionAsync();
                setSelectedStatus(itemValue);
              }}
              style={{ color: theme.text, height: 48 }}
              dropdownIconColor={theme.text}
              mode="dropdown"
            >
              {filterStatusTypes.map((status, index) => (
                <Picker.Item key={index} label={status} value={status} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Complaints List */}
      <FlatList 
        data={filteredComplaints} 
        keyExtractor={item => item._id} 
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={60} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No complaints found</Text>
          </View>
        }
      />

      {/* Modal: Assign Staff */}
      <Modal
        visible={assignModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Assign Staff</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                  {selectedComplaint?.type} • Ticket #{selectedComplaint?._id ? selectedComplaint._id.substring(selectedComplaint._id.length - 6).toUpperCase() : ''}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setAssignModalVisible(false)} 
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7' }]}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320, marginVertical: 10 }}>
              {staffList.length === 0 ? (
                <Text style={{ color: theme.textMuted, textAlign: 'center', padding: 20 }}>No staff members available</Text>
              ) : (
                staffList.map((staff) => {
                  const isAssigned = selectedComplaint?.assignedTo?._id === staff._id;
                  return (
                    <TouchableOpacity
                      key={staff._id}
                      style={[
                        styles.modalItem,
                        { 
                          backgroundColor: isAssigned ? (theme.primary + '20') : (isDarkMode ? '#27272a50' : '#f4f4f5'),
                          borderColor: isAssigned ? theme.primary : theme.border
                        }
                      ]}
                      onPress={() => {
                        setAssignModalVisible(false);
                        updateStatus(selectedComplaint._id, 'Assigned', staff._id);
                      }}
                    >
                      <View style={[styles.modalItemIcon, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="person" size={16} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalItemName, { color: theme.text }]}>{staff.name}</Text>
                        <Text style={[styles.modalItemSub, { color: theme.textMuted }]}>
                          {staff.role?.name || 'Staff'} {staff.phone ? `• ${staff.phone}` : ''}
                        </Text>
                      </View>
                      {isAssigned && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderColor: theme.border }]}
              onPress={() => setAssignModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Update Status */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Update Status</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                  Current Status: {selectedComplaint?.status}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setStatusModalVisible(false)} 
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7' }]}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 10 }}>
              {statusOptions.map((status) => {
                const sColor = getStatusColor(status);
                const isSelected = selectedComplaint?.status === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.modalItem,
                      { 
                        backgroundColor: isSelected ? (sColor + '20') : (isDarkMode ? '#27272a50' : '#f4f4f5'),
                        borderColor: isSelected ? sColor : theme.border
                      }
                    ]}
                    onPress={() => {
                      setStatusModalVisible(false);
                      updateStatus(selectedComplaint._id, status);
                    }}
                  >
                    <View style={[styles.statusDot, { backgroundColor: sColor, marginRight: 12, width: 10, height: 10, borderRadius: 5 }]} />
                    <Text style={[styles.modalItemName, { color: isSelected ? sColor : theme.text, flex: 1 }]}>
                      {status}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={sColor} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderColor: theme.border }]}
              onPress={() => setStatusModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  filtersHeader: { padding: 16, paddingBottom: 6, flexDirection: 'row', justifyContent: 'space-between' },
  filterLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2, fontFamily: fontMedium },
  filterContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 40 },

  // Card Structure Matching Screenshot Model
  card: { 
    position: 'relative',
    marginBottom: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    padding: 16, 
    paddingLeft: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 8, 
    elevation: 3,
    overflow: 'hidden'
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  complaintTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: fontMedium,
    letterSpacing: 0.3
  },
  dateText: {
    fontSize: 12,
    marginTop: 3,
    fontFamily: fontRegular
  },
  statusBadge: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: fontMedium
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  locationChipText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontMedium
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 10,
    opacity: 0.6
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  byLabel: {
    fontSize: 13,
    fontFamily: fontRegular
  },
  userName: {
    fontSize: 13,
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontFamily: fontMedium
  },
  assignedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8
  },
  assignedTagText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fontMedium
  },
  remarksText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
    fontFamily: fontRegular
  },

  // Action Outlined Buttons
  actionsContainer: {
    marginTop: 4
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  outlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fontMedium
  },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { marginTop: 15, fontSize: 16, fontFamily: fontRegular },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: fontMedium
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: fontRegular
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8
  },
  modalItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: fontMedium
  },
  modalItemSub: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: fontRegular
  },
  modalCancelBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center'
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontMedium
  }
});

export default ComplaintListScreen;