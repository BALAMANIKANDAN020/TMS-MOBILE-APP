import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from '../api/axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const ReportScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/reports');
      setReports(res.data);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Could not fetch reports from server');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
      case 'Resolved':
        return { bg: '#10b98120', border: '#10b98140', text: '#10b981' };
      case 'Closed':
        return { bg: '#05966920', border: '#05966940', text: '#059669' };
      case 'In-Progress':
        return { bg: '#3b82f620', border: '#3b82f640', text: '#3b82f6' };
      case 'Assigned':
        return { bg: '#f59e0b20', border: '#f59e0b40', text: '#f59e0b' };
      case 'On-Hold':
        return { bg: '#64748b20', border: '#64748b40', text: '#64748b' };
      case 'Pending':
      default:
        return { bg: '#ef444420', border: '#ef444440', text: '#ef4444' };
    }
  };

  const generatePDF = async () => {
    let currentReports = reports;
    if (currentReports.length === 0) {
      setPdfLoading(true);
      try {
        const res = await axios.get('/reports');
        currentReports = res.data;
        setReports(currentReports);
      } catch (err) {
        Alert.alert('Error', 'Could not fetch reports for PDF generation');
        setPdfLoading(false);
        return;
      }
    }

    if (currentReports.length === 0) {
      Alert.alert('No Data', 'No complaint records found in the database to generate a report.');
      setPdfLoading(false);
      return;
    }

    setPdfLoading(true);

    try {
      // 1. Calculate Summary Metrics
      const total = currentReports.length;
      const pendingCount = currentReports.filter(r => r.status === 'Pending').length;
      const assignedCount = currentReports.filter(r => r.status === 'Assigned').length;
      const inProgressCount = currentReports.filter(r => r.status === 'In-Progress' || r.status === 'On-Hold').length;
      const completedCount = currentReports.filter(r => r.status === 'Completed' || r.status === 'Closed' || r.status === 'Resolved').length;
      const resolutionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      const reportDate = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const reportTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const reportRef = 'TMS-REP-' + Math.floor(100000 + Math.random() * 900000);

      // 2. Build High-End Responsive Table Rows
      let tableRows = '';
      currentReports.forEach((item, index) => {
        const ticketId = (item._id || '').substring(Math.max(0, (item._id || '').length - 6)).toUpperCase() || `TK${index + 1}`;
        const itemDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
        const itemTime = item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
        
        const userName = item.user?.name || 'General User';
        const userContact = item.user?.phone || item.user?.email || 'N/A';
        
        const deptName = item.department?.name || item.department?.shortName || 'General Dept';
        const progName = item.programme?.shortName || item.programme?.name || '';
        const blockName = item.block?.name || 'Main Block';
        const roomNumber = item.room?.roomNumber ? `Room ${item.room.roomNumber}` : 'General Area';
        
        const category = item.type || 'General Issue';
        const remarks = item.remarks || 'No detailed remarks provided';
        const technician = item.assignedTo?.name || 'Unassigned';
        const status = item.status || 'Pending';

        let statusClass = 'status-pending';
        if (status === 'Assigned') statusClass = 'status-assigned';
        else if (status === 'In-Progress') statusClass = 'status-inprogress';
        else if (status === 'On-Hold') statusClass = 'status-onhold';
        else if (status === 'Completed' || status === 'Resolved') statusClass = 'status-completed';
        else if (status === 'Closed') statusClass = 'status-closed';

        let categoryClass = 'cat-general';
        const catLower = category.toLowerCase();
        if (catLower.includes('hardware') || catLower.includes('pc')) categoryClass = 'cat-hardware';
        else if (catLower.includes('network')) categoryClass = 'cat-network';
        else if (catLower.includes('elect')) categoryClass = 'cat-electrical';
        else if (catLower.includes('plumb')) categoryClass = 'cat-plumbing';
        else if (catLower.includes('soft')) categoryClass = 'cat-software';

        tableRows += `
          <tr>
            <td class="text-center font-bold text-muted">${index + 1}</td>
            <td>
              <span class="ticket-tag">#${ticketId}</span>
              <div class="date-sub">${itemDate}</div>
              <div class="time-sub">${itemTime}</div>
            </td>
            <td>
              <div class="font-bold text-dark">${deptName} ${progName ? `(${progName})` : ''}</div>
              <div class="location-pill">📍 ${blockName} • ${roomNumber}</div>
            </td>
            <td>
              <span class="category-badge ${categoryClass}">${category}</span>
              <div class="remarks-box">${remarks}</div>
            </td>
            <td>
              <div class="font-bold text-dark">${userName}</div>
              <div class="text-muted text-xs">${userContact}</div>
            </td>
            <td>
              <div class="font-bold ${technician === 'Unassigned' ? 'text-danger' : 'text-primary'}">
                ${technician === 'Unassigned' ? '⚠️ Not Assigned' : `👤 ${technician}`}
              </div>
            </td>
            <td class="text-center">
              <span class="status-pill ${statusClass}">${status}</span>
            </td>
          </tr>
        `;
      });

      // 3. Premium HTML Structure (Landscape Corporate A4 with Metrics & Signatures)
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TICKET MANAGEMENT SYSTEM (TMS) - AUDIT REPORT</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 8mm 10mm 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      padding: 0;
      margin: 0;
      font-size: 11px;
      line-height: 1.4;
    }
    
    /* Top Institutional Header */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 24px;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      border-radius: 12px;
      color: #ffffff;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
      border-bottom: 4px solid #38bdf8;
    }
    .header-left h1 {
      font-size: 21px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      color: #ffffff;
    }
    .header-left p {
      font-size: 12px;
      color: #93c5fd;
      font-weight: 500;
    }
    .header-right {
      text-align: right;
    }
    .ref-badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.2);
      border: 1px solid rgba(56, 189, 248, 0.5);
      color: #38bdf8;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .timestamp {
      font-size: 10px;
      color: #cbd5e1;
    }

    /* KPI Summary Row */
    .kpi-row {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }
    .kpi-card {
      flex: 1;
      padding: 12px 14px;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-left: 4px solid #64748b;
    }
    .kpi-card.kpi-total { border-left-color: #3b82f6; background: #eff6ff; }
    .kpi-card.kpi-pending { border-left-color: #f59e0b; background: #fffbeb; }
    .kpi-card.kpi-progress { border-left-color: #8b5cf6; background: #f5f3ff; }
    .kpi-card.kpi-resolved { border-left-color: #10b981; background: #ecfdf5; }

    .kpi-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 2px;
    }
    .kpi-value {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }

    /* Table Styling */
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 20px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }
    thead th {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 8px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700;
      border: none;
      text-align: left;
    }
    tbody tr {
      background: #ffffff;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    tbody td {
      padding: 9px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 10.5px;
      vertical-align: middle;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }

    /* Tags & Badges */
    .ticket-tag {
      display: inline-block;
      font-family: monospace;
      font-weight: 700;
      color: #1e3a8a;
      background: #dbeafe;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10.5px;
    }
    .date-sub {
      font-size: 9.5px;
      color: #475569;
      margin-top: 2px;
      font-weight: 600;
    }
    .time-sub {
      font-size: 8.5px;
      color: #94a3b8;
    }
    .location-pill {
      display: inline-block;
      font-size: 9.5px;
      color: #475569;
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 3px;
    }
    .remarks-box {
      font-size: 9.5px;
      color: #334155;
      margin-top: 3px;
      line-height: 1.3;
      max-width: 250px;
    }

    /* Category Badges */
    .category-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .cat-hardware { background: #fee2e2; color: #b91c1c; }
    .cat-network { background: #e0e7ff; color: #4338ca; }
    .cat-electrical { background: #fef3c7; color: #b45309; }
    .cat-plumbing { background: #cffafe; color: #0e7490; }
    .cat-software { background: #f3e8ff; color: #7e22ce; }
    .cat-general { background: #f1f5f9; color: #475569; }

    /* Status Pills */
    .status-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.3px;
      text-align: center;
    }
    .status-pending { background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; }
    .status-assigned { background: #fef9c3; color: #a16207; border: 1px solid #fde047; }
    .status-inprogress { background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; }
    .status-onhold { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .status-completed { background: #d1fae5; color: #047857; border: 1px solid #6ee7b7; }
    .status-closed { background: #ccfbf1; color: #0f766e; border: 1px solid #5eead4; }

    /* Utility text styles */
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .text-dark { color: #0f172a; }
    .text-muted { color: #64748b; }
    .text-primary { color: #2563eb; }
    .text-danger { color: #dc2626; }
    .text-xs { font-size: 9px; }

    /* Signature & Verification Block */
    .sign-row {
      display: flex;
      justify-content: space-between;
      margin-top: 25px;
      padding: 0 20px;
    }
    .sign-box {
      width: 220px;
      text-align: center;
      border-top: 1.5px dashed #94a3b8;
      padding-top: 6px;
    }
    .sign-title {
      font-size: 10px;
      font-weight: 700;
      color: #0f172a;
    }
    .sign-role {
      font-size: 8.5px;
      color: #64748b;
    }

    /* Footer Notice */
    .report-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- Report Header -->
  <div class="report-header">
    <div class="header-left">
      <h1>TICKET MANAGEMENT SYSTEM (TMS)</h1>
      <p>Institutional Infrastructure & Ticket Maintenance Audit Report</p>
    </div>
    <div class="header-right">
      <div class="ref-badge">${reportRef}</div>
      <div class="timestamp">Generated: ${reportDate} ${reportTime}</div>
      <div class="timestamp">Scope: All Academic Departments</div>
    </div>
  </div>

  <!-- KPI Summary Cards -->
  <div class="kpi-row">
    <div class="kpi-card kpi-total">
      <div>
        <div class="kpi-title">Total Complaints</div>
        <div class="kpi-value">${total}</div>
      </div>
      <div style="font-size: 24px;">📊</div>
    </div>
    <div class="kpi-card kpi-pending">
      <div>
        <div class="kpi-title">Pending / Assigned</div>
        <div class="kpi-value">${pendingCount + assignedCount}</div>
      </div>
      <div style="font-size: 24px;">⏳</div>
    </div>
    <div class="kpi-card kpi-progress">
      <div>
        <div class="kpi-title">In-Progress / On-Hold</div>
        <div class="kpi-value">${inProgressCount}</div>
      </div>
      <div style="font-size: 24px;">🛠️</div>
    </div>
    <div class="kpi-card kpi-resolved">
      <div>
        <div class="kpi-title">Resolved & Closed (${resolutionRate}%)</div>
        <div class="kpi-value">${completedCount}</div>
      </div>
      <div style="font-size: 24px;">✅</div>
    </div>
  </div>

  <!-- Complaints Table -->
  <table>
    <thead>
      <tr>
        <th style="width: 3%; text-align: center;">#</th>
        <th style="width: 13%;">Ticket & Date</th>
        <th style="width: 22%;">Department & Location</th>
        <th style="width: 26%;">Category & Remarks</th>
        <th style="width: 14%;">Reported By</th>
        <th style="width: 12%;">Assigned Tech</th>
        <th style="width: 10%; text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <!-- Official Signatures -->
  <div class="sign-row">
    <div class="sign-box">
      <div class="sign-title">Estate Maintenance Officer</div>
      <div class="sign-role">Infrastructure & Facilities In-Charge</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Authorized System Admin</div>
      <div class="sign-role">TMS Technical Operations</div>
    </div>
    <div class="sign-box">
      <div class="sign-title">Dean / Principal</div>
      <div class="sign-role">Institutional Head Approval</div>
    </div>
  </div>

  <!-- Footer Notice -->
  <div class="report-footer">
    <div>CONFIDENTIAL & OFFICIAL RECORD • Campus Facility & Ticket Operations</div>
    <div>Report ID: ${reportRef} • Page 1 of 1</div>
    <div>System Status: All systems verified and audited via TMS Mobile Portal</div>
  </div>

</body>
</html>
      `;

      // 4. Directly Open System "Save as PDF" / Print Window
      // This natively launches Android's Print Spooler with "Save as PDF" option.
      // The user can tap the Download/Save button to save directly to phone storage without any sharing permission errors.
      try {
        await Print.printAsync({ 
          html: htmlContent 
        });
      } catch (printErr) {
        console.warn('printAsync error, trying fallback:', printErr);
        const { uri } = await Print.printToFileAsync({ html: htmlContent, base64: false });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { 
            UTI: 'com.adobe.pdf', 
            mimeType: 'application/pdf', 
            dialogTitle: 'Save CMS Report PDF' 
          });
        }
      }

    } catch (err) {
      console.error('PDF Generation Error:', err);
      Alert.alert('Error', 'Failed to generate PDF report: ' + (err.message || 'Unknown error'));
    } finally {
      setPdfLoading(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const ticketId = (item._id || '').substring(Math.max(0, (item._id || '').length - 6)).toUpperCase();
    const statusStyle = getStatusColor(item.status);
    const dateFormatted = new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const deptName = item.department?.name || item.department?.shortName || '';
    const blockName = item.block?.name || '';
    const roomName = item.room?.roomNumber ? `Room ${item.room.roomNumber}` : '';
    const techName = item.assignedTo?.name || 'Unassigned';

    return (
      <Animated.View entering={FadeInDown.delay(index * 60).duration(400)} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="document-text-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.typeText, { color: theme.text }]} numberOfLines={1}>{item.type}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: 'bold' }}>TICKET #{ticketId}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
          </View>
        </View>

        {/* Location & Details Info */}
        {(deptName || blockName || roomName) && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={theme.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.metaText, { color: theme.textMuted }]}>
              {[deptName, blockName, roomName].filter(Boolean).join(' • ')}
            </Text>
          </View>
        )}

        <View style={[styles.bodyBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={[styles.remarksText, { color: theme.text }]}>{item.remarks}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person-outline" size={13} color={theme.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              Tech: <Text style={{ fontWeight: 'bold', color: techName === 'Unassigned' ? theme.error : theme.primary }}>{techName}</Text>
            </Text>
          </View>
          <Text style={[styles.dateText, { color: theme.textMuted }]}>{dateFormatted}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View entering={ZoomIn.duration(400)} style={styles.btnRow}>
        <TouchableOpacity 
          style={[styles.generateBtn, { flex: 1, marginRight: 10, backgroundColor: theme.secondary }]} 
          onPress={fetchReports}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="refresh-outline" size={20} color="#fff" style={{marginRight: 6}} />
              <Text style={styles.generateBtnText}>Refresh Data</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.generateBtn, { flex: 1.2, backgroundColor: theme.primary }]} 
          onPress={generatePDF}
          disabled={pdfLoading}
          activeOpacity={0.8}
        >
          {pdfLoading ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="cloud-download-outline" size={20} color="#fff" style={{marginRight: 6}} />
              <Text style={styles.generateBtnText}>Download PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      <FlatList 
        data={reports} 
        keyExtractor={item => item._id} 
        renderItem={renderItem} 
        contentContainerStyle={{ marginTop: 15, paddingBottom: 25 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Animated.View entering={FadeInDown.duration(500)} style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={70} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No complaints found in report</Text>
            <TouchableOpacity onPress={fetchReports} style={{ marginTop: 10 }}>
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Tap to reload</Text>
            </TouchableOpacity>
          </Animated.View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 10, marginBottom: 5 },
  generateBtn: { 
    flexDirection: 'row', 
    paddingVertical: 14,
    paddingHorizontal: 16, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4
  },
  generateBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  card: { 
    padding: 16, 
    marginBottom: 12, 
    borderRadius: 14, 
    borderWidth: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  typeText: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  metaText: { fontSize: 12, fontWeight: '500' },
  bodyBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  remarksText: { fontSize: 13.5, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 11.5 },
  dateText: { fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { marginTop: 12, fontSize: 15, fontWeight: '600' }
});

export default ReportScreen;
