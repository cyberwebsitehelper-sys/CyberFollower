// Types
export interface CyberComplaint {
  id: string;
  bankName: string;
  ackNumber: string;
  ifscCode: string;
  stateName: string;
  dist: string;
  layer: string;
  txnAmount: number;
  disputeAmount: number;
  utrNumber: string;
  policeStation: string;
  vendorName: string;
  nocFile: File | null;
  nocFileName: string;
  isComplete: boolean;
  createdAt: Date;
  completedAt: Date | null;
  employeeId: string;
}

export interface AdvEntry {
  id: string;
  advName: string;
  advFees: number;
  createdAt: Date;
  employeeId: string;
}

export interface CyberEntry {
  id: string;
  cyberName: string;
  cyberFees: number;
  createdAt: Date;
  employeeId: string;
}

export interface Employee {
  id: string;
  phoneNumber: string;
  name: string;
}

// Mock data store (in a real app, this would be a database)
let activeComplaints: CyberComplaint[] = [];
let closedComplaints: CyberComplaint[] = [];
let advEntries: AdvEntry[] = [];
let cyberEntries: CyberEntry[] = [];

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Complaints functions
export function getActiveComplaints(): CyberComplaint[] {
  return [...activeComplaints];
}

export function getClosedComplaints(): CyberComplaint[] {
  return [...closedComplaints];
}

export function addComplaint(complaint: Omit<CyberComplaint, 'id' | 'createdAt' | 'completedAt'>): CyberComplaint {
  const newComplaint: CyberComplaint = {
    ...complaint,
    id: generateId(),
    createdAt: new Date(),
    completedAt: null,
  };
  activeComplaints.push(newComplaint);
  return newComplaint;
}

export function updateComplaint(id: string, updates: Partial<CyberComplaint>): CyberComplaint | null {
  const index = activeComplaints.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  activeComplaints[index] = { ...activeComplaints[index], ...updates };
  return activeComplaints[index];
}

export function moveToClosedComplaints(id: string): boolean {
  const index = activeComplaints.findIndex(c => c.id === id);
  if (index === -1) return false;
  
  const complaint = activeComplaints[index];
  complaint.isComplete = true;
  complaint.completedAt = new Date();
  closedComplaints.push(complaint);
  activeComplaints.splice(index, 1);
  return true;
}

export function deleteActiveComplaint(id: string): boolean {
  const index = activeComplaints.findIndex(c => c.id === id);
  if (index === -1) return false;
  activeComplaints.splice(index, 1);
  return true;
}

// ADV and Cyber fees functions
export function getAdvEntries(): AdvEntry[] {
  return [...advEntries];
}

export function getCyberEntries(): CyberEntry[] {
  return [...cyberEntries];
}

export function addAdvEntry(entry: Omit<AdvEntry, 'id' | 'createdAt'>): AdvEntry {
  const newEntry: AdvEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date(),
  };
  advEntries.push(newEntry);
  return newEntry;
}

export function addCyberEntry(entry: Omit<CyberEntry, 'id' | 'createdAt'>): CyberEntry {
  const newEntry: CyberEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date(),
  };
  cyberEntries.push(newEntry);
  return newEntry;
}

// History/Analytics functions
export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function filterByTime<T extends { createdAt: Date }>(items: T[], filter: TimeFilter): T[] {
  const now = new Date();
  const startDate = new Date();
  
  switch (filter) {
    case 'daily':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'yearly':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }
  
  return items.filter(item => new Date(item.createdAt) >= startDate);
}

export function getHistoryStats(filter: TimeFilter) {
  const filteredActive = filterByTime(activeComplaints, filter);
  const filteredClosed = filterByTime(closedComplaints, filter);
  const filteredAdv = filterByTime(advEntries, filter);
  const filteredCyber = filterByTime(cyberEntries, filter);
  
  return {
    activeCount: filteredActive.length,
    closedCount: filteredClosed.length,
    totalComplaints: filteredActive.length + filteredClosed.length,
    advTotal: filteredAdv.reduce((sum, e) => sum + e.advFees, 0),
    cyberTotal: filteredCyber.reduce((sum, e) => sum + e.cyberFees, 0),
    advEntries: filteredAdv,
    cyberEntries: filteredCyber,
  };
}

export function getAllComplaints(): CyberComplaint[] {
  return [...activeComplaints, ...closedComplaints];
}

// Initialize with some sample data
export function initializeSampleData() {
  if (activeComplaints.length === 0 && closedComplaints.length === 0) {
    // Add some sample active complaints
    const sampleActive: Omit<CyberComplaint, 'id' | 'createdAt' | 'completedAt'>[] = [
      {
        bankName: 'State Bank of India',
        ackNumber: 'ACK001234',
        ifscCode: 'SBIN0001234',
        stateName: 'Maharashtra',
        dist: 'Mumbai',
        layer: 'Layer 1',
        txnAmount: 50000,
        disputeAmount: 45000,
        utrNumber: 'UTR123456789',
        policeStation: 'Andheri PS',
        vendorName: 'Vendor A',
        nocFile: null,
        nocFileName: '',
        isComplete: false,
        employeeId: 'emp001',
      },
      {
        bankName: 'HDFC Bank',
        ackNumber: 'ACK001235',
        ifscCode: 'HDFC0001234',
        stateName: 'Delhi',
        dist: 'New Delhi',
        layer: 'Layer 2',
        txnAmount: 75000,
        disputeAmount: 70000,
        utrNumber: 'UTR987654321',
        policeStation: 'Saket PS',
        vendorName: 'Vendor B',
        nocFile: null,
        nocFileName: 'noc_document.pdf',
        isComplete: false,
        employeeId: 'emp001',
      },
    ];

    sampleActive.forEach(complaint => addComplaint(complaint));

    // Add some sample ADV entries
    addAdvEntry({ advName: 'ADV Kumar', advFees: 5000, employeeId: 'emp001' });
    addAdvEntry({ advName: 'ADV Sharma', advFees: 7500, employeeId: 'emp001' });

    // Add some sample Cyber entries
    addCyberEntry({ cyberName: 'Cyber Case 1', cyberFees: 3000, employeeId: 'emp001' });
    addCyberEntry({ cyberName: 'Cyber Case 2', cyberFees: 4500, employeeId: 'emp001' });
  }
}
