import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SmallCheckbox } from "@/components/ui/small-checkbox";
import { SolidDropdown } from "@/components/ui/solid-dropdown";
import {
  Activity,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Filter,
  Grid3X3,
  LayoutGrid,
  List,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  Target,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AddColumnsModal } from "../components/AddColumnsModal";
import { CallLogDetailsModal } from "../components/CallLogDetailsModal";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useContacts } from "../contexts/ContactsContext";
import { formatCustomDate } from "../lib/utils";

// Helper function to safely display contact fields
const displayField = (
  value: string | undefined | null,
  defaultValue: string = ""
) => {
  return value || defaultValue;
};

// Types
interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  status:
    | "new"
    | "contacted"
    | "interested"
    | "qualified"
    | "converted"
    | "unqualified"
    | "pending";
  priority: "low" | "medium" | "high";
  source: string;
  campaign: string;
  notes?: string;
  cid: string;
  date: string;
  value: number;
  assignedTo: string;
  assignedToId?: string;
  lastContactDate: string;
  nextFollowUp?: string;
  tags: string[];
  socialProfiles: {
    linkedin?: string;
    x?: string;
    website?: string;
  };
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  leadQuality: "hot" | "warm" | "cold";
  originalCallId?: string;
  vapiCallId?: string;
  lastActivity: string;
  activities: number;
  deals: number;
  revenue: number;
  isStarred: boolean;
}

interface Team {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isActive: boolean;
}

// Mock Data
const teams: Team[] = [
  {
    id: "user-1",
    name: "Sarah Wilson",
    email: "s.wilson@company.com",
    role: "Sales Manager",
    isActive: true,
  },
  {
    id: "user-2",
    name: "Mark Johnson",
    email: "m.johnson@company.com",
    role: "Sales Rep",
    isActive: true,
  },
  {
    id: "user-3",
    name: "Emily Chen",
    email: "e.chen@company.com",
    role: "Sales Rep",
    isActive: true,
  },
  {
    id: "user-4",
    name: "David Rodriguez",
    email: "d.rodriguez@company.com",
    role: "Sales Rep",
    isActive: true,
  },
  {
    id: "user-5",
    name: "Lisa Park",
    email: "l.park@company.com",
    role: "SDR",
    isActive: true,
  },
];

// Mock data removed - now using shared ContactsContext
/* const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@techcorp.com',
    phone: '+1 (555) 123-4567',
    company: 'TechCorp Solutions',
    title: 'VP of Sales',
    status: 'qualified',
    priority: 'high',
    source: 'AI Outbound Call',
    campaign: 'Q4 Enterprise',
    notes: 'Very interested in our enterprise solution. Has budget approved.',
    value: 250000,
    assignedTo: 'Sarah Wilson',
    assignedToId: 'user-1',
    lastContactDate: '2025-01-10',
    nextFollowUp: '2025-01-15',
    tags: ['enterprise', 'hot-lead', 'decision-maker'],
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/johnsmith',
      website: 'https://techcorp.com'
    },
    location: {
      city: 'San Francisco',
      state: 'CA',
      country: 'United States'
    },
    leadQuality: 'hot',
    originalCallId: 'call-001',
    vapiCallId: 'vapi_call_123',
    lastActivity: '2025-01-10T14:30:00Z',
    activities: 8,
    deals: 2,
    revenue: 125000,
    isStarred: true
  },
  {
    id: 'contact-2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@healthtech.io',
    phone: '+1 (555) 987-6543',
    company: 'HealthTech Innovation',
    title: 'Chief Technology Officer',
    status: 'interested',
    priority: 'medium',
    source: 'Website Form',
    campaign: 'Healthcare Demo',
    notes: 'Interested in integration capabilities with existing systems.',
    value: 150000,
    assignedTo: 'Mark Johnson',
    assignedToId: 'user-2',
    lastContactDate: '2025-01-09',
    nextFollowUp: '2025-01-14',
    tags: ['healthcare', 'integration', 'warm'],
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/sarahjohnson',
    },
    location: {
      city: 'Austin',
      state: 'TX',
      country: 'United States'
    },
    leadQuality: 'warm',
    lastActivity: '2025-01-09T16:45:00Z',
    activities: 5,
    deals: 1,
    revenue: 0,
    isStarred: false
  },
  {
    id: 'contact-3',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'm.chen@startup.dev',
    phone: '+1 (555) 456-7890',
    company: 'DevStartup Inc',
    title: 'Founder & CEO',
    status: 'new',
    priority: 'high',
    source: 'LinkedIn Outreach',
    campaign: 'Startup Outreach',
    notes: 'Young startup looking for growth solutions.',
    value: 75000,
    assignedTo: 'Emily Chen',
    assignedToId: 'user-3',
    lastContactDate: '2025-01-08',
    nextFollowUp: '2025-01-13',
    tags: ['startup', 'founder', 'growth'],
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/michaelchen',
      x: 'https://twitter.com/mchen'
    },
    location: {
      city: 'Seattle',
      state: 'WA',
      country: 'United States'
    },
    leadQuality: 'warm',
    lastActivity: '2025-01-08T10:15:00Z',
    activities: 3,
    deals: 0,
    revenue: 0,
    isStarred: false
  },
  {
    id: 'contact-4',
    firstName: 'Amanda',
    lastName: 'Davis',
    email: 'a.davis@enterprise.corp',
    phone: '+1 (555) 321-9876',
    company: 'Enterprise Corporation',
    title: 'Director of Operations',
    status: 'converted',
    priority: 'high',
    source: 'Referral',
    campaign: 'Referral Program',
    notes: 'Converted customer. Very satisfied with our service.',
    value: 500000,
    assignedTo: 'Sarah Wilson',
    assignedToId: 'user-1',
    lastContactDate: '2025-01-05',
    nextFollowUp: '2025-02-01',
    tags: ['enterprise', 'converted', 'high-value'],
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/amandadavis',
    },
    location: {
      city: 'New York',
      state: 'NY',
      country: 'United States'
    },
    leadQuality: 'hot',
    lastActivity: '2025-01-05T11:30:00Z',
    activities: 15,
    deals: 3,
    revenue: 350000,
    isStarred: true
  },
  {
    id: 'contact-5',
    firstName: 'Robert',
    lastName: 'Wilson',
    email: 'r.wilson@consulting.biz',
    phone: '+1 (555) 654-3210',
    company: 'Wilson Consulting',
    title: 'Managing Partner',
    status: 'contacted',
    priority: 'medium',
    source: 'Trade Show',
    campaign: 'Trade Show Follow-up',
    notes: 'Met at industry conference. Expressed interest in our consulting services.',
    value: 100000,
    assignedTo: 'David Rodriguez',
    assignedToId: 'user-4',
    lastContactDate: '2025-01-07',
    nextFollowUp: '2025-01-12',
    tags: ['consulting', 'conference', 'partner'],
    socialProfiles: {
      website: 'https://wilsonconsulting.biz'
    },
    location: {
      city: 'Chicago',
      state: 'IL',
      country: 'United States'
    },
    leadQuality: 'warm',
    lastActivity: '2025-01-07T14:20:00Z',
    activities: 4,
    deals: 1,
    revenue: 25000,
    isStarred: false
  },
]; */

// Status configuration
const statusConfig = {
  new: {
    label: "New",
    color: "bg-white/20 border border-white/50 text-white",
    icon: User,
  },
  contacted: {
    label: "Contacted",
    color: "bg-white/10 border border-white/20 text-white/90",
    icon: Phone,
  },
  interested: {
    label: "Interested",
    color: "bg-white/20 border border-white/30 text-white",
    icon: MessageSquare,
  },
  qualified: {
    label: "Qualified",
    color: "bg-white/10 border border-white/20 text-white",
    icon: CheckCircle,
  },
  converted: {
    label: "Converted",
    color: "bg-white/20 border border-white/30 text-white font-medium",
    icon: Target,
  },
  unqualified: {
    label: "Unqualified",
    color: "bg-red-500/20 border border-red-500/50 text-red-400",
    icon: XCircle,
  },
};

const priorityConfig = {
  low: {
    label: "Low",
    color: "bg-gray-500/20 border border-gray-500/50 text-gray-400",
  },
  medium: {
    label: "Medium",
    color: "bg-white/10 border border-white/20 text-white/70",
  },
  high: {
    label: "High",
    color: "bg-red-500/20 border border-red-500/50 text-red-400",
  },
};

export default function CRM() {
  const navigate = useNavigate();
  const { t } = useTranslation(["crm", "common"]);

  // Mock call data for demonstration
  const getMockCallData = (contact: Contact) => {
    return {
      id: `call_${contact.id}_001`,
      duration: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
      transcript: [
        {
          speaker: "ai" as const,
          text: `Hello, is this ${displayField(contact.firstName, "there")}?`,
        },
        { speaker: "user" as const, text: "Yes, this is me." },
        {
          speaker: "ai" as const,
          text: `Hi ${displayField(
            contact.firstName,
            "there"
          )}, this is Sarah from Trinity Labs AI Solutions. I hope I'm not catching you at a bad time. I'm calling because we've developed an innovative AI calling solution that's been helping companies like ${displayField(
            contact.company,
            "yours"
          )} increase their outreach efficiency. Would you be interested in learning more?`,
        },
        {
          speaker: "user" as const,
          text:
            contact.status === "interested"
              ? "Yes, that sounds very interesting. Tell me more."
              : "I might be interested, but I'm quite busy right now.",
        },
        {
          speaker: "ai" as const,
          text:
            contact.status === "interested"
              ? "Great! Our AI platform can handle hundreds of calls simultaneously and provides detailed analytics. Would you like to schedule a demo?"
              : "I understand you're busy. Would it be better if I called back at a more convenient time?",
        },
      ],
      recording: "/mock-audio.wav",
      analysis: {
        sentiment:
          contact.status === "interested"
            ? 0.8
            : contact.status === "contacted"
            ? 0.6
            : 0.4,
        keywords: [
          "AI",
          "solution",
          displayField(contact.company, ""),
          "efficiency",
        ].filter((k) => k),
        summary: `Call with ${displayField(contact.firstName)} ${displayField(
          contact.lastName
        )} from ${displayField(contact.company)}. ${
          contact.status === "interested"
            ? "Expressed strong interest in AI solutions."
            : contact.status === "contacted"
            ? "Showed moderate interest, needs follow-up."
            : "Limited interest shown."
        }`,
      },
      cost: +(Math.random() * 2 + 0.25).toFixed(2),
    };
  };

  const handleViewCallDetails = (contact: Contact) => {
    setSelectedCallContact(contact);
    setShowCallDetails(true);
  };
  const { contacts } = useContacts();

  const styleTag = (
    <style>{`
      /* 2026 Obsidian Theme */
      .glass-container {
        background: rgba(17, 17, 17, 0.4);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      }
      
      .floating-bar {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      /* Modern Table Overhaul */
      table {
        border-collapse: separate;
        border-spacing: 0 8px;
        width: 100%;
      }
      
      thead th {
        color: rgba(255, 255, 255, 0.5) !important;
        font-weight: 500;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 12px 24px !important;
      }
      
      tbody tr {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.03);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        cursor: pointer;
      }
      
      tbody tr:hover {
        background: rgba(255, 255, 255, 0.05);
        transform: translateY(-2px) scale(1.002);
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        border-color: rgba(255, 255, 255, 0.1);
      }

      tbody td {
        border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        padding: 16px 24px !important;
      }

      tbody td:first-child {
        border-left: 1px solid rgba(255, 255, 255, 0.05) !important;
        border-top-left-radius: 12px;
        border-bottom-left-radius: 12px;
      }

      tbody td:last-child {
        border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
        border-top-right-radius: 12px;
        border-bottom-right-radius: 12px;
      }
      
      /* Status Badge Refinement */
      .premium-badge {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 6px;
        transition: all 0.3s ease;
      }

      /* Custom Scrollbar */
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    `}</style>
  );

  // Mock data removed - now using shared ContactsContext
  /* const mockContacts: Contact[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corp',
      title: 'CEO',
      status: 'qualified',
      priority: 'high',
      source: 'Website',
      campaign: 'Q4 Growth',
      notes: 'Interested in enterprise plan',
      cid: '93705c74-c7dd-4ed0-b95a-3a341bc68b34',
      date: '2024-01-15',
      value: 25000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2024-01-15',
      nextFollowUp: '2024-01-20',
      lastActivity: '2024-01-15',
      activities: 5,
      tags: ['hot-lead', 'enterprise']
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@techstart.io',
      phone: '+1 (555) 987-6543',
      company: 'TechStart',
      title: 'CTO',
      status: 'interested',
      priority: 'medium',
      source: 'LinkedIn',
      campaign: 'Tech Leaders',
      notes: 'Needs demo',
      cid: '2a8b94e1-5f3c-4a7d-9e8f-1c2d3e4f5a6b',
      date: '2024-01-14',
      value: 15000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2024-01-14',
      nextFollowUp: '2024-01-18',
      lastActivity: '2024-01-14',
      activities: 3,
      tags: ['demo-requested']
    },
    {
      id: '3',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@innovate.com',
      phone: '+1 (555) 456-7890',
      company: 'Innovate LLC',
      title: 'VP Marketing',
      status: 'new',
      priority: 'low',
      source: 'Referral',
      campaign: 'Referral Program',
      notes: 'Referred by existing client',
      cid: '',
      date: '2024-01-13',
      value: 8000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2024-01-13',
      nextFollowUp: '2024-01-16',
      lastActivity: '2024-01-13',
      activities: 1,
      tags: ['referral']
    },
    {
      id: '4',
      firstName: 'Alice',
      lastName: 'Brown',
      email: 'alice.brown@datatech.com',
      phone: '+1 (555) 234-5678',
      company: 'DataTech Solutions',
      title: 'Data Director',
      status: 'contacted',
      priority: 'high',
      source: 'Cold Call',
      campaign: 'Data Analytics',
      notes: 'Looking for data solutions',
      cid: '4e6f8a9b-3c1d-5e7f-8a9b-2c3d4e5f6a7b',
      date: '2024-01-12',
      value: 35000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2024-01-12',
      nextFollowUp: '2024-01-17',
      lastActivity: '2024-01-12',
      activities: 7,
      tags: ['data', 'enterprise']
    },
    {
      id: '5',
      firstName: 'Charlie',
      lastName: 'Davis',
      email: 'charlie.davis@cloudify.io',
      phone: '+1 (555) 345-6789',
      company: 'Cloudify Inc',
      title: 'Cloud Architect',
      status: 'qualified',
      priority: 'medium',
      source: 'Webinar',
      campaign: 'Cloud Migration',
      notes: 'Ready to migrate to cloud',
      cid: '7b9d2e5f-6a8c-4e7f-9a1b-3c4d5e6f7a8b',
      date: '2024-01-11',
      value: 22000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2024-01-11',
      nextFollowUp: '2024-01-19',
      lastActivity: '2024-01-11',
      activities: 4,
      tags: ['cloud', 'migration']
    },
    {
      id: '6',
      firstName: 'Diana',
      lastName: 'Garcia',
      email: 'diana.garcia@fintech.com',
      phone: '+1 (555) 456-7891',
      company: 'FinTech Innovations',
      title: 'CFO',
      status: 'interested',
      priority: 'high',
      source: 'Conference',
      campaign: 'Financial Services',
      notes: 'Interested in financial analytics',
      cid: '9f2e5a8b-4d6e-7f9a-1b2c-4e5f6a7b8c9d',
      date: '2024-01-10',
      value: 45000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2024-01-10',
      nextFollowUp: '2024-01-21',
      lastActivity: '2024-01-10',
      activities: 6,
      tags: ['fintech', 'analytics']
    },
    {
      id: '7',
      firstName: 'Ethan',
      lastName: 'Martinez',
      email: 'ethan.martinez@healthtech.org',
      phone: '+1 (555) 567-8912',
      company: 'HealthTech Solutions',
      title: 'Medical Director',
      status: 'new',
      priority: 'medium',
      source: 'Website',
      campaign: 'Healthcare IT',
      notes: 'Looking for HIPAA compliant solutions',
      cid: '',
      date: '2024-01-09',
      value: 18000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2024-01-09',
      nextFollowUp: '2024-01-22',
      lastActivity: '2024-01-09',
      activities: 2,
      tags: ['healthcare', 'compliance']
    },
    {
      id: '8',
      firstName: 'Fiona',
      lastName: 'Anderson',
      email: 'fiona.anderson@retailtech.com',
      phone: '+1 (555) 678-9123',
      company: 'RetailTech Corp',
      title: 'Operations Manager',
      status: 'contacted',
      priority: 'low',
      source: 'LinkedIn',
      campaign: 'Retail Automation',
      notes: 'Interested in inventory management',
      cid: '1a3c5e7f-8b9d-2e4f-6a8c-5e7f8a9b1c2d',
      date: '2024-01-08',
      value: 12000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2024-01-08',
      nextFollowUp: '2024-01-23',
      lastActivity: '2024-01-08',
      activities: 3,
      tags: ['retail', 'automation']
    },
    {
      id: '9',
      firstName: 'George',
      lastName: 'Taylor',
      email: 'george.taylor@edutech.edu',
      phone: '+1 (555) 789-1234',
      company: 'EduTech University',
      title: 'IT Administrator',
      status: 'qualified',
      priority: 'medium',
      source: 'Referral',
      campaign: 'Education Sector',
      notes: 'Looking for student management system',
      cid: '3e6a9d2f-5b8c-4e7f-9a1b-7f8a9b2c3d4e',
      date: '2024-01-07',
      value: 28000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2024-01-07',
      nextFollowUp: '2024-01-24',
      lastActivity: '2024-01-07',
      activities: 5,
      tags: ['education', 'management']
    },
    {
      id: '10',
      firstName: 'Hannah',
      lastName: 'Thomas',
      email: 'hannah.thomas@greentech.com',
      phone: '+1 (555) 891-2345',
      company: 'GreenTech Energy',
      title: 'Sustainability Officer',
      status: 'interested',
      priority: 'high',
      source: 'Cold Email',
      campaign: 'Green Technology',
      notes: 'Wants carbon tracking solutions',
      cid: '5f8b1e4a-7c9d-6e8f-1a2b-8a9b1c2d3e4f',
      date: '2024-01-06',
      value: 32000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2024-01-06',
      nextFollowUp: '2024-01-25',
      lastActivity: '2024-01-06',
      activities: 4,
      tags: ['green-tech', 'sustainability']
    },
    {
      id: '11',
      firstName: 'Ian',
      lastName: 'Jackson',
      email: 'ian.jackson@logistech.com',
      phone: '+1 (555) 912-3456',
      company: 'LogisTech Solutions',
      title: 'Logistics Manager',
      status: 'converted',
      priority: 'high',
      source: 'Partner',
      campaign: 'Supply Chain',
      notes: 'Completed purchase last month',
      cid: '7d9f3a6c-8e1b-4f7a-2c3d-9b1c2d3e4f5a',
      date: '2024-01-05',
      value: 55000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2024-01-05',
      nextFollowUp: '2024-01-26',
      lastActivity: '2024-01-05',
      activities: 8,
      tags: ['logistics', 'converted']
    },
    {
      id: '12',
      firstName: 'Julia',
      lastName: 'White',
      email: 'julia.white@autotech.com',
      phone: '+1 (555) 123-4567',
      company: 'AutoTech Industries',
      title: 'Production Manager',
      status: 'unqualified',
      priority: 'low',
      source: 'Trade Show',
      campaign: 'Manufacturing',
      notes: 'Budget constraints this year',
      cid: '',
      date: '2024-01-04',
      value: 5000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2024-01-04',
      nextFollowUp: '2024-01-27',
      lastActivity: '2024-01-04',
      activities: 2,
      tags: ['manufacturing', 'budget-constrained']
    },
    {
      id: '13',
      firstName: 'Kevin',
      lastName: 'Harris',
      email: 'kevin.harris@sporttech.com',
      phone: '+1 (555) 234-5678',
      company: 'SportTech Analytics',
      title: 'Head of Analytics',
      status: 'new',
      priority: 'medium',
      source: 'Website',
      campaign: 'Sports Analytics',
      notes: 'Interested in player performance tracking',
      cid: '9b2e5a8d-1f4c-6a7b-3e4f-1c2d3e4f5a6b',
      date: '2024-01-03',
      value: 19000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2024-01-03',
      nextFollowUp: '2024-01-28',
      lastActivity: '2024-01-03',
      activities: 1,
      tags: ['sports', 'analytics']
    },
    {
      id: '14',
      firstName: 'Laura',
      lastName: 'Clark',
      email: 'laura.clark@mediatech.com',
      phone: '+1 (555) 345-6789',
      company: 'MediaTech Productions',
      title: 'Creative Director',
      status: 'contacted',
      priority: 'medium',
      source: 'LinkedIn',
      campaign: 'Media & Entertainment',
      notes: 'Looking for content management system',
      cid: '2d4f6a9c-3e5b-7f8a-4c5d-2e3f4a5b6c7d',
      date: '2024-01-02',
      value: 16000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2024-01-02',
      nextFollowUp: '2024-01-29',
      lastActivity: '2024-01-02',
      activities: 3,
      tags: ['media', 'content-management']
    },
    {
      id: '15',
      firstName: 'Michael',
      lastName: 'Lewis',
      email: 'michael.lewis@realtech.com',
      phone: '+1 (555) 456-7890',
      company: 'RealTech Properties',
      title: 'Property Manager',
      status: 'interested',
      priority: 'low',
      source: 'Referral',
      campaign: 'Real Estate Tech',
      notes: 'Wants property management software',
      cid: '4a6c8e1b-5f7d-9a2c-6e7f-4a5b6c7d8e9f',
      date: '2024-01-01',
      value: 14000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2024-01-01',
      nextFollowUp: '2024-01-30',
      lastActivity: '2024-01-01',
      activities: 2,
      tags: ['real-estate', 'property-management']
    },
    {
      id: '16',
      firstName: 'Nina',
      lastName: 'Robinson',
      email: 'nina.robinson@foodtech.com',
      phone: '+1 (555) 567-8901',
      company: 'FoodTech Solutions',
      title: 'Operations Director',
      status: 'qualified',
      priority: 'high',
      source: 'Conference',
      campaign: 'Food Industry',
      notes: 'Ready to implement food safety tracking',
      cid: '6c8f1a4d-7b9e-2f4a-8c9d-6a7b8c9d1e2f',
      date: '2023-12-31',
      value: 38000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2023-12-31',
      nextFollowUp: '2024-01-31',
      lastActivity: '2023-12-31',
      activities: 6,
      tags: ['food-safety', 'compliance']
    },
    {
      id: '17',
      firstName: 'Oscar',
      lastName: 'Walker',
      email: 'oscar.walker@traveltech.com',
      phone: '+1 (555) 678-9012',
      company: 'TravelTech Booking',
      title: 'Product Manager',
      status: 'contacted',
      priority: 'medium',
      source: 'Cold Call',
      campaign: 'Travel Industry',
      notes: 'Interested in booking system integration',
      cid: '8e1d4a7c-9f2b-4e6a-1d2e-8c9d1e2f3a4b',
      date: '2023-12-30',
      value: 21000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2023-12-30',
      nextFollowUp: '2024-02-01',
      lastActivity: '2023-12-30',
      activities: 4,
      tags: ['travel', 'booking-system']
    },
    {
      id: '18',
      firstName: 'Paula',
      lastName: 'Young',
      email: 'paula.young@fashiontech.com',
      phone: '+1 (555) 789-0123',
      company: 'FashionTech Retail',
      title: 'Retail Manager',
      status: 'new',
      priority: 'low',
      source: 'Website',
      campaign: 'Fashion Retail',
      notes: 'Just started exploring tech solutions',
      cid: '',
      date: '2023-12-29',
      value: 9000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2023-12-29',
      nextFollowUp: '2024-02-02',
      lastActivity: '2023-12-29',
      activities: 1,
      tags: ['fashion', 'retail']
    },
    {
      id: '19',
      firstName: 'Quinn',
      lastName: 'King',
      email: 'quinn.king@gametech.com',
      phone: '+1 (555) 890-1234',
      company: 'GameTech Studios',
      title: 'Game Director',
      status: 'interested',
      priority: 'medium',
      source: 'LinkedIn',
      campaign: 'Gaming Industry',
      notes: 'Looking for player analytics platform',
      cid: '1f3a6d9c-2e4b-6f8a-3e4f-1d2e3f4a5b6c',
      date: '2023-12-28',
      value: 24000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2023-12-28',
      nextFollowUp: '2024-02-03',
      lastActivity: '2023-12-28',
      activities: 3,
      tags: ['gaming', 'analytics']
    },
    {
      id: '20',
      firstName: 'Rachel',
      lastName: 'Scott',
      email: 'rachel.scott@biotech.com',
      phone: '+1 (555) 901-2345',
      company: 'BioTech Research',
      title: 'Research Director',
      status: 'qualified',
      priority: 'high',
      source: 'Conference',
      campaign: 'Life Sciences',
      notes: 'Needs lab management system',
      cid: '3d5f8b1e-4a6c-8f1d-5f6a-3e4f5a6b7c8d',
      date: '2023-12-27',
      value: 42000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2023-12-27',
      nextFollowUp: '2024-02-04',
      lastActivity: '2023-12-27',
      activities: 7,
      tags: ['biotech', 'lab-management']
    },
    {
      id: '21',
      firstName: 'Samuel',
      lastName: 'Green',
      email: 'samuel.green@agritech.com',
      phone: '+1 (555) 012-3456',
      company: 'AgriTech Farms',
      title: 'Farm Manager',
      status: 'contacted',
      priority: 'medium',
      source: 'Referral',
      campaign: 'Agriculture Tech',
      notes: 'Interested in crop monitoring solutions',
      cid: '5f8e1d4a-6c9f-1e3a-7f8a-5b6c7d8e9f1a',
      date: '2023-12-26',
      value: 17000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2023-12-26',
      nextFollowUp: '2024-02-05',
      lastActivity: '2023-12-26',
      activities: 3,
      tags: ['agriculture', 'monitoring']
    },
    {
      id: '22',
      firstName: 'Tina',
      lastName: 'Adams',
      email: 'tina.adams@constructech.com',
      phone: '+1 (555) 123-4567',
      company: 'ConstrucTech Inc',
      title: 'Project Manager',
      status: 'new',
      priority: 'low',
      source: 'Cold Email',
      campaign: 'Construction Tech',
      notes: 'Looking for project management tools',
      cid: '',
      date: '2023-12-25',
      value: 11000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2023-12-25',
      nextFollowUp: '2024-02-06',
      lastActivity: '2023-12-25',
      activities: 1,
      tags: ['construction', 'project-management']
    },
    {
      id: '23',
      firstName: 'Victor',
      lastName: 'Baker',
      email: 'victor.baker@securitytech.com',
      phone: '+1 (555) 234-5678',
      company: 'SecurityTech Solutions',
      title: 'Security Officer',
      status: 'interested',
      priority: 'high',
      source: 'Partner',
      campaign: 'Cybersecurity',
      notes: 'Needs advanced threat detection',
      cid: '7a1f4e8c-8d2b-3f6a-9e1f-7d8e9f1a2b3c',
      date: '2023-12-24',
      value: 48000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2023-12-24',
      nextFollowUp: '2024-02-07',
      lastActivity: '2023-12-24',
      activities: 5,
      tags: ['security', 'threat-detection']
    },
    {
      id: '24',
      firstName: 'Wendy',
      lastName: 'Carter',
      email: 'wendy.carter@legaltech.com',
      phone: '+1 (555) 345-6789',
      company: 'LegalTech Partners',
      title: 'Legal Director',
      status: 'qualified',
      priority: 'medium',
      source: 'Conference',
      campaign: 'Legal Tech',
      notes: 'Ready to implement case management',
      cid: '9c3e6a1f-1f4d-5a8c-2f3a-9f1a2b3c4d5e',
      date: '2023-12-23',
      value: 26000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2023-12-23',
      nextFollowUp: '2024-02-08',
      lastActivity: '2023-12-23',
      activities: 4,
      tags: ['legal', 'case-management']
    },
    {
      id: '25',
      firstName: 'Xavier',
      lastName: 'Mitchell',
      email: 'xavier.mitchell@insurtech.com',
      phone: '+1 (555) 456-7890',
      company: 'InsurTech Group',
      title: 'Risk Manager',
      status: 'contacted',
      priority: 'high',
      source: 'LinkedIn',
      campaign: 'Insurance Tech',
      notes: 'Evaluating risk assessment tools',
      cid: '2e5a8d1f-3c6f-7a1e-4d5a-2b3c4d5e6f7a',
      date: '2023-12-22',
      value: 35000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2023-12-22',
      nextFollowUp: '2024-02-09',
      lastActivity: '2023-12-22',
      activities: 6,
      tags: ['insurance', 'risk-assessment']
    },
    {
      id: '26',
      firstName: 'Yolanda',
      lastName: 'Perez',
      email: 'yolanda.perez@pharmatech.com',
      phone: '+1 (555) 567-8901',
      company: 'PharmaTech Labs',
      title: 'Clinical Manager',
      status: 'new',
      priority: 'medium',
      source: 'Website',
      campaign: 'Pharmaceutical',
      notes: 'Interested in clinical trial management',
      cid: '4f7c1e5a-6d9b-8f2e-6c7d-4e5f6a7b8c9d',
      date: '2023-12-21',
      value: 31000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2023-12-21',
      nextFollowUp: '2024-02-10',
      lastActivity: '2023-12-21',
      activities: 2,
      tags: ['pharmaceutical', 'clinical-trials']
    },
    {
      id: '27',
      firstName: 'Zachary',
      lastName: 'Roberts',
      email: 'zachary.roberts@energytech.com',
      phone: '+1 (555) 678-9012',
      company: 'EnergyTech Corp',
      title: 'Energy Manager',
      status: 'interested',
      priority: 'low',
      source: 'Cold Call',
      campaign: 'Energy Management',
      notes: 'Looking for energy optimization tools',
      cid: '6a9e2f5c-8b1d-1f4e-8d9f-6a7b8c9d1e2f',
      date: '2023-12-20',
      value: 13000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2023-12-20',
      nextFollowUp: '2024-02-11',
      lastActivity: '2023-12-20',
      activities: 2,
      tags: ['energy', 'optimization']
    },
    {
      id: '28',
      firstName: 'Amy',
      lastName: 'Turner',
      email: 'amy.turner@chemtech.com',
      phone: '+1 (555) 789-0123',
      company: 'ChemTech Industries',
      title: 'Chemical Engineer',
      status: 'qualified',
      priority: 'high',
      source: 'Trade Show',
      campaign: 'Chemical Industry',
      notes: 'Ready to upgrade process control systems',
      cid: '8c1f4a7e-1d3b-3a6f-1f2a-8c9d1e2f3a4b',
      date: '2023-12-19',
      value: 52000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2023-12-19',
      nextFollowUp: '2024-02-12',
      lastActivity: '2023-12-19',
      activities: 8,
      tags: ['chemical', 'process-control']
    },
    {
      id: '29',
      firstName: 'Brian',
      lastName: 'Phillips',
      email: 'brian.phillips@miningtech.com',
      phone: '+1 (555) 890-1234',
      company: 'MiningTech Operations',
      title: 'Mining Engineer',
      status: 'contacted',
      priority: 'medium',
      source: 'Referral',
      campaign: 'Mining Industry',
      notes: 'Interested in safety monitoring systems',
      cid: '1e3a6f9c-3f5d-5c8a-3a4c-1e2f3a4b5c6d',
      date: '2023-12-18',
      value: 29000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2023-12-18',
      nextFollowUp: '2024-02-13',
      lastActivity: '2023-12-18',
      activities: 4,
      tags: ['mining', 'safety-monitoring']
    },
    {
      id: '30',
      firstName: 'Carol',
      lastName: 'Campbell',
      email: 'carol.campbell@textiletech.com',
      phone: '+1 (555) 901-2345',
      company: 'TextileTech Manufacturing',
      title: 'Production Supervisor',
      status: 'unqualified',
      priority: 'low',
      source: 'Website',
      campaign: 'Textile Industry',
      notes: 'Current systems are sufficient',
      cid: '',
      date: '2023-12-17',
      value: 6000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2023-12-17',
      nextFollowUp: '2024-02-14',
      lastActivity: '2023-12-17',
      activities: 1,
      tags: ['textile', 'manufacturing']
    },
    {
      id: '31',
      firstName: 'Derek',
      lastName: 'Evans',
      email: 'derek.evans@aviationtech.com',
      phone: '+1 (555) 012-3456',
      company: 'AviationTech Systems',
      title: 'Flight Operations Manager',
      status: 'new',
      priority: 'high',
      source: 'Conference',
      campaign: 'Aviation Industry',
      notes: 'Looking for flight tracking solutions',
      cid: '3a5f8c1e-5a7f-7e1d-5c6e-3a4b5c6d7e8f',
      date: '2023-12-16',
      value: 67000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2023-12-16',
      nextFollowUp: '2024-02-15',
      lastActivity: '2023-12-16',
      activities: 1,
      tags: ['aviation', 'flight-tracking']
    },
    {
      id: '32',
      firstName: 'Elena',
      lastName: 'Rodriguez',
      email: 'elena.rodriguez@marinetech.com',
      phone: '+1 (555) 123-4567',
      company: 'MarineTech Solutions',
      title: 'Marine Biologist',
      status: 'interested',
      priority: 'medium',
      source: 'LinkedIn',
      campaign: 'Marine Science',
      notes: 'Needs ocean monitoring equipment',
      cid: '5c7e1a4f-7c9a-9a3f-7e8f-5c6d7e8f9a1b',
      date: '2023-12-15',
      value: 23000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2023-12-15',
      nextFollowUp: '2024-02-16',
      lastActivity: '2023-12-15',
      activities: 3,
      tags: ['marine', 'monitoring']
    },
    {
      id: '33',
      firstName: 'Frank',
      lastName: 'Cox',
      email: 'frank.cox@spacetech.com',
      phone: '+1 (555) 234-5678',
      company: 'SpaceTech Innovations',
      title: 'Aerospace Engineer',
      status: 'qualified',
      priority: 'high',
      source: 'Partner',
      campaign: 'Aerospace',
      notes: 'Ready for satellite communication upgrade',
      cid: '7e9a3f6c-9e1c-2f5a-9a1c-7e8f9a1b2c3d',
      date: '2023-12-14',
      value: 89000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2023-12-14',
      nextFollowUp: '2024-02-17',
      lastActivity: '2023-12-14',
      activities: 9,
      tags: ['aerospace', 'satellite-communication']
    },
    {
      id: '34',
      firstName: 'Grace',
      lastName: 'Ward',
      email: 'grace.ward@nanotech.com',
      phone: '+1 (555) 345-6789',
      company: 'NanoTech Research',
      title: 'Research Scientist',
      status: 'contacted',
      priority: 'medium',
      source: 'Cold Email',
      campaign: 'Nanotechnology',
      notes: 'Exploring nano-scale measurement tools',
      cid: '9a1c5e8f-2a3f-4a7c-2c3e-9a1b2c3d4e5f',
      date: '2023-12-13',
      value: 34000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2023-12-13',
      nextFollowUp: '2024-02-18',
      lastActivity: '2023-12-13',
      activities: 5,
      tags: ['nanotechnology', 'measurement']
    },
    {
      id: '35',
      firstName: 'Henry',
      lastName: 'Brooks',
      email: 'henry.brooks@robotech.com',
      phone: '+1 (555) 456-7890',
      company: 'RoboTech Automation',
      title: 'Robotics Engineer',
      status: 'new',
      priority: 'low',
      source: 'Website',
      campaign: 'Robotics',
      notes: 'Just starting automation project',
      cid: '',
      date: '2023-12-12',
      value: 15000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2023-12-12',
      nextFollowUp: '2024-02-19',
      lastActivity: '2023-12-12',
      activities: 1,
      tags: ['robotics', 'automation']
    },
    {
      id: '36',
      firstName: 'Iris',
      lastName: 'Kelly',
      email: 'iris.kelly@quantumtech.com',
      phone: '+1 (555) 567-8901',
      company: 'QuantumTech Labs',
      title: 'Quantum Physicist',
      status: 'interested',
      priority: 'high',
      source: 'Conference',
      campaign: 'Quantum Computing',
      notes: 'Evaluating quantum computing solutions',
      cid: '2c4e7a1f-4c6a-6c9e-4e5a-2c3d4e5f6a7b',
      date: '2023-12-11',
      value: 125000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2023-12-11',
      nextFollowUp: '2024-02-20',
      lastActivity: '2023-12-11',
      activities: 6,
      tags: ['quantum', 'computing']
    },
    {
      id: '37',
      firstName: 'Jack',
      lastName: 'Reed',
      email: 'jack.reed@virtualtech.com',
      phone: '+1 (555) 678-9012',
      company: 'VirtualTech Studios',
      title: 'VR Developer',
      status: 'qualified',
      priority: 'medium',
      source: 'LinkedIn',
      campaign: 'Virtual Reality',
      notes: 'Ready to implement VR training platform',
      cid: '4e6a9c3f-6e8c-8e1a-6a7c-4e5f6a7b8c9d',
      date: '2023-12-10',
      value: 41000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2023-12-10',
      nextFollowUp: '2024-02-21',
      lastActivity: '2023-12-10',
      activities: 7,
      tags: ['virtual-reality', 'training']
    },
    {
      id: '38',
      firstName: 'Karen',
      lastName: 'Murphy',
      email: 'karen.murphy@aitech.com',
      phone: '+1 (555) 789-0123',
      company: 'AITech Solutions',
      title: 'AI Research Director',
      status: 'contacted',
      priority: 'high',
      source: 'Referral',
      campaign: 'Artificial Intelligence',
      notes: 'Looking for machine learning infrastructure',
      cid: '6c8e2a5f-8a1e-1a4c-8c9e-6a7b8c9d1e2f',
      date: '2023-12-09',
      value: 78000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2023-12-09',
      nextFollowUp: '2024-02-22',
      lastActivity: '2023-12-09',
      activities: 8,
      tags: ['artificial-intelligence', 'machine-learning']
    },
    {
      id: '39',
      firstName: 'Leo',
      lastName: 'Rivera',
      email: 'leo.rivera@blocktech.com',
      phone: '+1 (555) 890-1234',
      company: 'BlockTech Ventures',
      title: 'Blockchain Developer',
      status: 'new',
      priority: 'medium',
      source: 'Cold Call',
      campaign: 'Blockchain Technology',
      notes: 'Exploring blockchain implementation',
      cid: '8e1a4f7c-1c3a-3c6e-1e2a-8c9d1e2f3a4b',
      date: '2023-12-08',
      value: 33000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2023-12-08',
      nextFollowUp: '2024-02-23',
      lastActivity: '2023-12-08',
      activities: 2,
      tags: ['blockchain', 'cryptocurrency']
    },
    {
      id: '40',
      firstName: 'Megan',
      lastName: 'Howard',
      email: 'megan.howard@iottech.com',
      phone: '+1 (555) 901-2345',
      company: 'IoTTech Networks',
      title: 'IoT Architect',
      status: 'interested',
      priority: 'high',
      source: 'Trade Show',
      campaign: 'Internet of Things',
      notes: 'Planning large-scale IoT deployment',
      cid: '1a3c6f9e-3e5c-5e8a-3a4c-1e2f3a4b5c6d',
      date: '2023-12-07',
      value: 56000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2023-12-07',
      nextFollowUp: '2024-02-24',
      lastActivity: '2023-12-07',
      activities: 6,
      tags: ['iot', 'networking']
    },
    {
      id: '41',
      firstName: 'Nathan',
      lastName: 'Flores',
      email: 'nathan.flores@edgetech.com',
      phone: '+1 (555) 012-3456',
      company: 'EdgeTech Computing',
      title: 'Edge Computing Specialist',
      status: 'qualified',
      priority: 'medium',
      source: 'Website',
      campaign: 'Edge Computing',
      notes: 'Ready to deploy edge infrastructure',
      cid: '3c5e8a1f-5a7e-7a1c-5c6e-3a4b5c6d7e8f',
      date: '2023-12-06',
      value: 44000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2023-12-06',
      nextFollowUp: '2024-02-25',
      lastActivity: '2023-12-06',
      activities: 5,
      tags: ['edge-computing', 'infrastructure']
    },
    {
      id: '42',
      firstName: 'Olivia',
      lastName: 'Washington',
      email: 'olivia.washington@cloudnative.com',
      phone: '+1 (555) 123-4567',
      company: 'CloudNative Systems',
      title: 'DevOps Engineer',
      status: 'contacted',
      priority: 'low',
      source: 'LinkedIn',
      campaign: 'DevOps Tools',
      notes: 'Evaluating CI/CD pipeline solutions',
      cid: '5e7a1c4f-7c9a-9c3e-7e8a-5c6d7e8f9a1b',
      date: '2023-12-05',
      value: 18000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2023-12-05',
      nextFollowUp: '2024-02-26',
      lastActivity: '2023-12-05',
      activities: 3,
      tags: ['devops', 'ci-cd']
    },
    {
      id: '43',
      firstName: 'Peter',
      lastName: 'Butler',
      email: 'peter.butler@microtech.com',
      phone: '+1 (555) 234-5678',
      company: 'MicroTech Services',
      title: 'Microservices Architect',
      status: 'unqualified',
      priority: 'low',
      source: 'Cold Email',
      campaign: 'Microservices',
      notes: 'Current monolith works fine for them',
      cid: '',
      date: '2023-12-04',
      value: 7000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2023-12-04',
      nextFollowUp: '2024-02-27',
      lastActivity: '2023-12-04',
      activities: 1,
      tags: ['microservices', 'architecture']
    },
    {
      id: '44',
      firstName: 'Quincy',
      lastName: 'Simmons',
      email: 'quincy.simmons@serverless.com',
      phone: '+1 (555) 345-6789',
      company: 'Serverless Solutions',
      title: 'Cloud Solutions Architect',
      status: 'new',
      priority: 'medium',
      source: 'Partner',
      campaign: 'Serverless Computing',
      notes: 'Just started evaluating serverless options',
      cid: '7a9c3e6f-9e1c-2e5a-9a1c-7e8f9a1b2c3d',
      date: '2023-12-03',
      value: 27000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2023-12-03',
      nextFollowUp: '2024-02-28',
      lastActivity: '2023-12-03',
      activities: 2,
      tags: ['serverless', 'cloud-architecture']
    },
    {
      id: '45',
      firstName: 'Rita',
      lastName: 'Foster',
      email: 'rita.foster@containertech.com',
      phone: '+1 (555) 456-7890',
      company: 'ContainerTech Inc',
      title: 'Container Engineer',
      status: 'interested',
      priority: 'high',
      source: 'Conference',
      campaign: 'Container Orchestration',
      notes: 'Looking for Kubernetes management platform',
      cid: '9c1e5a8f-2a4c-4a7e-2c3e-9a1b2c3d4e5f',
      date: '2023-12-02',
      value: 39000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2023-12-02',
      nextFollowUp: '2024-02-29',
      lastActivity: '2023-12-02',
      activities: 4,
      tags: ['containers', 'kubernetes']
    },
    {
      id: '46',
      firstName: 'Steve',
      lastName: 'Bennett',
      email: 'steve.bennett@apitech.com',
      phone: '+1 (555) 567-8901',
      company: 'APITech Gateway',
      title: 'API Developer',
      status: 'qualified',
      priority: 'medium',
      source: 'Referral',
      campaign: 'API Management',
      notes: 'Ready to implement API gateway solution',
      cid: '2e4a7c1f-4c6e-6c9a-4e5a-2c3d4e5f6a7b',
      date: '2023-12-01',
      value: 22000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2023-12-01',
      nextFollowUp: '2024-03-01',
      lastActivity: '2023-12-01',
      activities: 5,
      tags: ['api', 'gateway']
    },
    {
      id: '47',
      firstName: 'Teresa',
      lastName: 'Sanders',
      email: 'teresa.sanders@dataops.com',
      phone: '+1 (555) 678-9012',
      company: 'DataOps Analytics',
      title: 'Data Engineer',
      status: 'contacted',
      priority: 'high',
      source: 'LinkedIn',
      campaign: 'Data Operations',
      notes: 'Building modern data pipeline',
      cid: '4a6c9e3f-6e8a-8e1c-6a7c-4e5f6a7b8c9d',
      date: '2023-11-30',
      value: 47000,
      assignedTo: 'Mike Chen',
      assignedToId: 'mike',
      lastContactDate: '2023-11-30',
      nextFollowUp: '2024-03-02',
      lastActivity: '2023-11-30',
      activities: 6,
      tags: ['data-engineering', 'pipeline']
    },
    {
      id: '48',
      firstName: 'Ulysses',
      lastName: 'Price',
      email: 'ulysses.price@mlops.com',
      phone: '+1 (555) 789-0123',
      company: 'MLOps Platform',
      title: 'ML Engineer',
      status: 'new',
      priority: 'low',
      source: 'Website',
      campaign: 'Machine Learning Operations',
      notes: 'Early stage ML implementation',
      cid: '',
      date: '2023-11-29',
      value: 20000,
      assignedTo: 'David Lee',
      assignedToId: 'david',
      lastContactDate: '2023-11-29',
      nextFollowUp: '2024-03-03',
      lastActivity: '2023-11-29',
      activities: 1,
      tags: ['mlops', 'machine-learning']
    },
    {
      id: '49',
      firstName: 'Valerie',
      lastName: 'Hughes',
      email: 'valerie.hughes@observability.com',
      phone: '+1 (555) 890-1234',
      company: 'Observability Systems',
      title: 'Site Reliability Engineer',
      status: 'interested',
      priority: 'medium',
      source: 'Cold Call',
      campaign: 'Monitoring & Observability',
      notes: 'Needs comprehensive monitoring solution',
      cid: '6c8a1e4f-8a1c-1a3e-8c9e-6a7b8c9d1e2f',
      date: '2023-11-28',
      value: 36000,
      assignedTo: 'Emma Wilson',
      assignedToId: 'emma',
      lastContactDate: '2023-11-28',
      nextFollowUp: '2024-03-04',
      lastActivity: '2023-11-28',
      activities: 4,
      tags: ['observability', 'monitoring']
    },
    {
      id: '50',
      firstName: 'William',
      lastName: 'Diaz',
      email: 'william.diaz@secops.com',
      phone: '+1 (555) 901-2345',
      company: 'SecOps Security',
      title: 'Security Operations Manager',
      status: 'qualified',
      priority: 'high',
      source: 'Trade Show',
      campaign: 'Security Operations',
      notes: 'Ready to upgrade security infrastructure',
      cid: '8e1c4a7f-1c3e-3c6a-1e2a-8c9d1e2f3a4b',
      date: '2023-11-27',
      value: 63000,
      assignedTo: 'Sarah Johnson',
      assignedToId: 'sarah',
      lastContactDate: '2023-11-27',
      nextFollowUp: '2024-03-05',
      lastActivity: '2023-11-27',
      activities: 7,
      tags: ['security-operations', 'infrastructure']
    }
  ]; */

  // State
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "tile">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [leadTypeFilter, setLeadTypeFilter] = useState("All leads");
  const [sortBy, setSortBy] = useState("lastActivity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [sortHistory, setSortHistory] = useState<{
    [key: string]: ("asc" | "desc")[];
  }>({}); // Track sort history per column
  const [pinnedColumns, setPinnedColumns] = useState<{
    [key: string]: boolean;
  }>({}); // Track pinned columns
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "firstName",
    "company",
    "status",
    "assignedTo",
    "campaign",
    "phone",
    "cid",
    "date",
    "lastActivity",
  ]); // Track column order
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(
    null
  );
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showCallDetails, setShowCallDetails] = useState(false);
  const [selectedCallContact, setSelectedCallContact] =
    useState<Contact | null>(null);
  const [showAddColumnsModal, setShowAddColumnsModal] = useState(false);
  const [additionalColumns, setAdditionalColumns] = useState<string[]>([]);
  const [expandedFilters, setExpandedFilters] = useState({
    status: true,
    tags: true,
    quickFilters: true,
  });

  // Computed values
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      searchTerm === "" ||
      (contact.firstName &&
        contact.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.lastName &&
        contact.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.email &&
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.company &&
        contact.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.phone && contact.phone.includes(searchTerm));

    const matchesStatus =
      statusFilter === "all" || contact.status === statusFilter;
    const matchesAssignee =
      assigneeFilter === "all" || contact.assignedToId === assigneeFilter;
    const matchesTag = tagFilter === "all" || contact.tags.includes(tagFilter);

    // Lead type filtering logic
    const matchesLeadType = (() => {
      switch (leadTypeFilter) {
        case "All leads":
          return true;
        case "My leads":
          return contact.assignedTo === "Sarah Johnson"; // Current user leads
        case "Junk leads":
          return contact.status === "unqualified";
        case "Call backs":
          return (
            contact.tags.includes("callback") || contact.status === "contacted"
          );
        case "Today's leads":
          const today = new Date();
          const contactDate = new Date(contact.dateAdded);
          return contactDate.toDateString() === today.toDateString();
        default:
          return true;
      }
    })();

    return (
      matchesSearch &&
      matchesStatus &&
      matchesAssignee &&
      matchesTag &&
      matchesLeadType
    );
  });

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    let aVal = a[sortBy as keyof Contact];
    let bVal = b[sortBy as keyof Contact];

    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();

    if (sortOrder === "asc") {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  // Statistics
  const stats = {
    total: contacts.length,
    new: contacts.filter((c) => c.status === "new").length,
    qualified: contacts.filter((c) => c.status === "qualified").length,
    converted: contacts.filter((c) => c.status === "converted").length,
    totalValue: contacts.reduce((sum, c) => sum + c.value, 0),
    thisMonth: contacts.filter(
      (c) => new Date(c.lastContactDate) > new Date("2025-01-01")
    ).length,
  };

  // Handlers
  const handleSelectContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    setSelectedContacts(
      selectedContacts.length === sortedContacts.length
        ? []
        : sortedContacts.map((c) => c.id)
    );
  };

  const handleHideColumn = (columnKey: string) => {
    setHiddenColumns((prev) => [...prev, columnKey]);
    setColumnOrder((prev) => prev.filter((col) => col !== columnKey));
  };

  const handleUnhideColumn = (columnKey: string) => {
    setHiddenColumns((prev) => prev.filter((col) => col !== columnKey));
    // Add column back to its original position or at the end
    const allColumns = [
      "firstName",
      "company",
      "status",
      "assignedTo",
      "campaign",
      "phone",
      "cid",
      "date",
      "lastActivity",
    ];
    const originalIndex = allColumns.indexOf(columnKey);
    setColumnOrder((prev) => {
      const newOrder = [...prev];
      newOrder.splice(originalIndex, 0, columnKey);
      return newOrder;
    });
  };

  const toggleStar = (contactId: string) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId
          ? { ...contact, isStarred: !contact.isStarred }
          : contact
      )
    );
  };

  const handleSort = (field: string, order?: "asc" | "desc") => {
    const newOrder =
      order ||
      (sortBy === field ? (sortOrder === "asc" ? "desc" : "asc") : "desc");

    // Update sort history
    setSortHistory((prev) => {
      const fieldHistory = prev[field] || [];
      if (!fieldHistory.includes(newOrder)) {
        return {
          ...prev,
          [field]: [...fieldHistory, newOrder],
        };
      }
      return prev;
    });

    setSortBy(field);
    setSortOrder(newOrder);
  };

  const handleUnsort = (field: string) => {
    // Reset to default sort (lastActivity desc) and clear history for this field
    setSortBy("lastActivity");
    setSortOrder("desc");
    setSortHistory((prev) => ({
      ...prev,
      [field]: [],
    }));
  };

  const handlePinToggle = (field: string) => {
    setPinnedColumns((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Column reordering handlers
  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", columnKey);

    // Add custom drag image
    const dragImage = document.createElement("div");
    dragImage.innerHTML =
      columnConfig[columnKey as keyof typeof columnConfig].title;
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      background: rgba(16, 185, 129, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== columnKey) {
      setDraggedOverColumn(columnKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the column area
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDraggedOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnKey) return;

    const newColumnOrder = [...columnOrder];
    const draggedIndex = newColumnOrder.indexOf(draggedColumn);
    const targetIndex = newColumnOrder.indexOf(targetColumnKey);

    // Remove dragged column from its current position
    newColumnOrder.splice(draggedIndex, 1);
    // Insert it at the target position
    newColumnOrder.splice(targetIndex, 0, draggedColumn);

    setColumnOrder(newColumnOrder);
    setDraggedColumn(null);
    setDraggedOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDraggedOverColumn(null);
  };

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags)));

  // Column configuration
  const baseColumnConfig = {
    firstName: { title: "name", minWidth: "320px" },
    company: { title: "company", minWidth: "240px" },
    status: { title: "status", minWidth: "128px" },
    assignedTo: { title: "owner", minWidth: "192px" },
    campaign: { title: "campaign", minWidth: "160px" },
    phone: { title: "phone", minWidth: "140px" },
    cid: { title: "CID", minWidth: "120px" },
    date: { title: "Created Date", minWidth: "120px" },
    lastActivity: { title: "last activity", minWidth: "192px" },
  };

  const additionalColumnConfig = {
    industry: { title: "industry", minWidth: "140px" },
    companySize: { title: "company size", minWidth: "120px" },
    location: { title: "location", minWidth: "140px" },
    website: { title: "website", minWidth: "140px" },
    pipelineValue: { title: "pipeline value", minWidth: "130px" },
    leadScore: { title: "lead score", minWidth: "110px" },
    interestLevel: { title: "interest level", minWidth: "120px" },
    priority: { title: "priority", minWidth: "100px" },
    source: { title: "lead source", minWidth: "130px" },
    nextFollowUp: { title: "next follow-up", minWidth: "140px" },
    lastCallOutcome: { title: "last call outcome", minWidth: "150px" },
    callDuration: { title: "call duration", minWidth: "120px" },
    owner: { title: "lead owner", minWidth: "130px" },
    title: { title: "job title", minWidth: "130px" },
  };

  const columnConfig = {
    ...baseColumnConfig,
    ...Object.fromEntries(
      additionalColumns.map((col) => [
        col,
        additionalColumnConfig[col as keyof typeof additionalColumnConfig],
      ])
    ),
  };

  // Render cell content based on column type
  const renderCellContent = (columnKey: string, contact: Contact) => {
    const statusInfo = statusConfig[contact.status] || statusConfig.new;
    const StatusIcon = statusInfo.icon;

    switch (columnKey) {
      case "firstName":
        return (
          <div className="flex items-center">
            <div>
              <div className="flex items-center text-xs font-semibold text-white">
                {displayField(contact.firstName)}{" "}
                {displayField(contact.lastName)}
                {contact.isStarred && (
                  <Star className="ml-1 h-3 w-3 fill-current text-yellow-400" />
                )}
              </div>
              <div className="text-xs text-gray-400">
                {displayField(contact.email)}
              </div>
            </div>
          </div>
        );
      case "company":
        return (
          <div className="flex items-center">
            <div className="text-xs font-medium text-white">
              {displayField(contact.company)}
            </div>
          </div>
        );
      case "status":
        return (
          <Badge
            className={`${statusInfo.color} px-2 py-1 text-xs font-medium`}
          >
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusInfo.label}
          </Badge>
        );
      case "assignedTo":
        return (
          <div className="flex items-center">
            <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-xs font-medium text-white">
              {contact.assignedTo
                .split(" ")
                .map((name) => name[0])
                .join("")}
            </div>
            <span className="text-xs text-white font-medium">
              {contact.assignedTo}
            </span>
          </div>
        );
      case "campaign":
        return (
          <div className="inline-flex items-center rounded-full bg-gray-500/20 px-2 py-1 text-xs font-medium text-gray-300 border border-gray-500/30">
            {contact.campaign}
          </div>
        );
      case "phone":
        return (
          <div className="flex items-center">
            <Phone className="mr-1 h-3 w-3 text-gray-400" />
            <span className="text-xs text-white font-medium">
              {displayField(contact.phone)}
            </span>
          </div>
        );
      case "cid":
        return (
          <span className="font-mono text-xs text-white">
            {contact.cid || "N/A"}
          </span>
        );
      case "date":
        return (
          <span className="text-xs text-white">
            {formatCustomDate(contact.date)}
          </span>
        );
      case "lastActivity":
        return (
          <div>
            <div className="text-xs text-white font-medium">
              {formatCustomDate(contact.lastActivity)}
            </div>
            <div
              className="flex items-center text-gray-400"
              style={{ fontSize: "10px" }}
            >
              <Activity className="mr-1 h-2.5 w-2.5" />
              {contact.activities} activities
            </div>
          </div>
        );

      // New dynamic fields
      case "industry":
        return (
          <span className="text-xs text-white">
            {(contact as any).industry || "N/A"}
          </span>
        );
      case "companySize":
        return (
          <span className="text-xs text-white">
            {(contact as any).companySize || "N/A"}
          </span>
        );
      case "location":
        return (
          <span className="text-xs text-white">
            {(contact as any).location || "N/A"}
          </span>
        );
      case "website":
        return (
          <span className="text-xs text-gray-400 hover:text-gray-300">
            {(contact as any).website || "N/A"}
          </span>
        );
      case "pipelineValue":
        return (
          <span className="text-xs text-white">
            $
            {(contact as any).pipelineValue
              ? Number((contact as any).pipelineValue).toLocaleString()
              : "0"}
          </span>
        );
      case "leadScore":
        const score = (contact as any).leadScore || 0;
        return (
          <div className="flex items-center">
            <span
              className={`text-xs font-medium ${
                score >= 8
                  ? "text-white"
                  : score >= 6
                  ? "text-white/60"
                  : "text-red-400"
              }`}
            >
              {score}/10
            </span>
          </div>
        );
      case "interestLevel":
        const interest = (contact as any).interestLevel || 0;
        return (
          <div className="flex items-center">
            <span
              className={`text-xs font-medium ${
                interest >= 8
                  ? "text-white"
                  : interest >= 6
                  ? "text-white/60"
                  : "text-red-400"
              }`}
            >
              {interest}/10
            </span>
          </div>
        );
      case "priority":
        const priority = (contact as any).priority || "medium";
        const priorityColors = {
          high: "text-red-400",
          medium: "text-white/60",
          low: "text-white/40",
        };
        return (
          <span
            className={`text-xs font-medium ${
              priorityColors[priority as keyof typeof priorityColors]
            }`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </span>
        );
      case "source":
        return (
          <span className="text-xs text-white">
            {(contact as any).source || "N/A"}
          </span>
        );
      case "nextFollowUp":
        const followUp = (contact as any).nextFollowUp;
        return (
          <span className="text-xs text-white">
            {followUp ? formatCustomDate(followUp) : "Not scheduled"}
          </span>
        );
      case "lastCallOutcome":
        const outcome = (contact as any).lastCallOutcome || "N/A";
        const outcomeColors = {
          interested: "text-white",
          "not-interested": "text-red-400",
          callback: "text-white/60",
          voicemail: "text-gray-400",
          "no-answer": "text-gray-400",
        };
        return (
          <span
            className={`text-xs ${
              outcomeColors[outcome as keyof typeof outcomeColors] ||
              "text-white"
            }`}
          >
            {outcome.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </span>
        );
      case "callDuration":
        const duration = (contact as any).callDuration || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return (
          <span className="text-xs text-white">
            {duration > 0
              ? `${minutes}:${seconds.toString().padStart(2, "0")}`
              : "N/A"}
          </span>
        );
      case "owner":
        return (
          <div className="flex items-center">
            <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-xs font-medium text-white">
              {((contact as any).owner || "U")
                .split(" ")
                .map((name: string) => name[0])
                .join("")}
            </div>
            <span className="text-xs text-white">
              {(contact as any).owner || "Unassigned"}
            </span>
          </div>
        );
      case "title":
        return (
          <span className="text-xs text-white">
            {(contact as any).title || contact.title || "N/A"}
          </span>
        );

      default:
        return <span className="text-xs text-white">-</span>;
    }
  };

  // Handler for adding columns
  const handleAddColumns = (selectedFields: string[]) => {
    setAdditionalColumns((prev) => [...prev, ...selectedFields]);
    // Update column order to include new columns
    setColumnOrder((prev) => [...prev, ...selectedFields]);
  };

  // Debug browser extension interference
  React.useEffect(() => {
    const checkExtensionCSS = () => {
      const stylesheets = Array.from(document.styleSheets);
      const extensionSheets = stylesheets.filter((sheet) => {
        try {
          return (
            sheet.href &&
            (sheet.href.includes("chrome-extension://") ||
              sheet.href.includes("moz-extension://") ||
              sheet.href.includes("extension"))
          );
        } catch (e) {
          return false;
        }
      });

      if (extensionSheets.length > 0) {
        console.log(
          "🔍 Browser extensions detected affecting CSS:",
          extensionSheets.length
        );
        console.log(
          "Extensions:",
          extensionSheets.map((s) => s.href)
        );
      }

      // Force override any external styles
      const style = document.createElement("style");
      style.textContent = `
        table thead th {
          color: rgba(255, 255, 255, 0.6) !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
        }
      `;
      style.setAttribute("data-force-override", "true");
      document.head.appendChild(style);
    };

    setTimeout(checkExtensionCSS, 100);
  }, []);

  // Scroll handling for back to top button
  React.useEffect(() => {
    const handleScroll = () => {
      const tableContainer = document.querySelector(".table-scroll-container");
      if (tableContainer) {
        setShowBackToTop(tableContainer.scrollTop > 300);
      }
    };

    const tableContainer = document.querySelector(".table-scroll-container");
    if (tableContainer) {
      tableContainer.addEventListener("scroll", handleScroll);
      return () => tableContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const scrollToTop = () => {
    const tableContainer = document.querySelector(".table-scroll-container");
    if (tableContainer) {
      tableContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleFilterSection = (section: "status" | "tags" | "quickFilters") => {
    setExpandedFilters((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Column header component
  const ColumnHeader = ({
    title,
    sortKey,
    minWidth,
  }: {
    title: string;
    sortKey?: string;
    minWidth: string;
  }) => {
    const isDragging = draggedColumn === sortKey;
    const isDraggedOver = draggedOverColumn === sortKey;

    return (
      <th
        className={`relative whitespace-nowrap px-6 py-5 text-left transition-all duration-300 ease-out border-r border-b border-white/5 ${
          sortKey ? "cursor-move" : ""
        } ${
          isDragging
            ? "scale-95 opacity-40"
            : isDraggedOver
            ? "bg-white/10"
            : "hover:bg-white/5"
        }`}
        style={{
          background: "transparent",
          minWidth,
          transform: isDraggedOver ? "scale(1.02)" : "scale(1)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "sticky",
          top: 0,
          zIndex: 45,
        }}
        draggable={!!sortKey}
        onDragStart={sortKey ? (e) => handleDragStart(e, sortKey) : undefined}
        onDragOver={handleDragOver}
        onDragEnter={sortKey ? (e) => handleDragEnter(e, sortKey) : undefined}
        onDragLeave={handleDragLeave}
        onDrop={sortKey ? (e) => handleDrop(e, sortKey) : undefined}
        onDragEnd={handleDragEnd}
      >
        {isDraggedOver && (
          <div className="pointer-events-none absolute inset-0 animate-pulse bg-white/5" />
        )}

        <div className="relative z-10 flex items-center justify-between">
          <div className="group flex items-center">
            {sortKey && (
              <div
                className={`drag-handle mr-2.5 transition-all duration-300 ${
                  isDragging
                    ? "rotate-45 scale-125 transform text-white"
                    : "text-white/20 group-hover:scale-110 group-hover:text-white/50"
                }`}
                title="Drag to reorder column"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </div>
            )}
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 ${
                isDragging ? "text-white/40" : "text-white/60"
              }`}
            >
              {title}
            </span>
          </div>

          <SolidDropdown
            trigger={
              <div className="cursor-pointer text-white/30 transition-all hover:scale-110 hover:text-white">
                <ChevronDown className="h-3 w-3" />
              </div>
            }
            title={title}
            sortKey={sortKey}
            onSort={(key, order) => {
              handleSort(key, order);
            }}
            onUnsort={sortKey ? () => handleUnsort(sortKey) : undefined}
            onPinToggle={sortKey ? () => handlePinToggle(sortKey) : undefined}
            onHideColumn={sortKey ? () => handleHideColumn(sortKey) : undefined}
            sortHistory={sortKey ? sortHistory[sortKey] || [] : []}
            isPinned={sortKey ? pinnedColumns[sortKey] || false : false}
          />
        </div>
      </th>
    );
  };

  return (
    <React.Fragment>
      {styleTag}
      <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#1a1a1a_0%,_#000_100%)] overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col px-8 py-8 overflow-hidden">
          {/* Sticky Header Section */}
          <div className="pb-6 flex-shrink-0 relative z-50">
            {/* Controls row */}
            <div className="mb-6 max-w-full">
              <div className="floating-bar rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="border-white/20 text-xs text-white transition-all hover:bg-white/10"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                  <SolidDropdown
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-xs text-gray-300 transition-all hover:bg-gray-800"
                      >
                        {leadTypeFilter}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    }
                    title="Lead Type"
                    options={[
                      "All leads",
                      "My leads",
                      "Junk leads",
                      "Call backs",
                      "Today's leads",
                    ]}
                    onSelect={(option: string) => setLeadTypeFilter(option)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <SolidDropdown
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-xs text-gray-300 transition-all hover:bg-gray-800"
                      >
                        10 Records per page
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    }
                    title="10 Records per page"
                    options={[
                      "10 Records per page",
                      "20 Records per page",
                      "30 Records per page",
                      "40 Records per page",
                      "50 Records per page",
                    ]}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-xs text-gray-300 transition-all hover:bg-gray-800"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <SolidDropdown
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-xs text-gray-300 transition-all hover:bg-gray-800"
                      >
                        {viewMode === "table" ? (
                          <List className="h-4 w-4" />
                        ) : (
                          <LayoutGrid className="h-4 w-4" />
                        )}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    }
                    title="View Mode"
                    options={["Table View", "Tile View"]}
                    onOptionSelect={(option) => {
                      if (option === "Table View") setViewMode("table");
                      if (option === "Tile View") setViewMode("tile");
                    }}
                  />
                  <SolidDropdown
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary/50 text-xs text-primary bg-primary/10 transition-all hover:bg-primary/20 hover:text-primary hover:border-primary shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        New Lead
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    }
                    title="Add Lead"
                    options={["Import Leads", "New Lead"]}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-xs text-gray-300 transition-all hover:bg-gray-800"
                    onClick={() => setShowAddColumnsModal(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Columns
                  </Button>
                  {hiddenColumns.length > 0 && (
                    <SolidDropdown
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-xs text-gray-300 transition-all hover:bg-gray-800"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t("common:actions.view_details")}{" "}
                          {t("common:table.columns")} ({hiddenColumns.length})
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      }
                      title={`${t("common:actions.view_details")} ${t(
                        "common:table.columns"
                      )}`}
                      options={hiddenColumns.map(
                        (col) =>
                          `${t("common:actions.view_details")} ${
                            columnConfig[col as keyof typeof columnConfig]
                              ?.title || col
                          }`
                      )}
                      onOptionSelect={(option) => {
                        const columnKey = hiddenColumns.find((col) =>
                          option.includes(
                            columnConfig[col as keyof typeof columnConfig]
                              ?.title || col
                          )
                        );
                        if (columnKey) handleUnhideColumn(columnKey);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Total Records row */}
          <div className="mb-4 flex items-center justify-between flex-shrink-0 px-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-white opacity-50 animate-pulse" />
              <div className="text-[11px] uppercase tracking-widest text-white/70 font-bold">
                {t("common:data_states.showing_total", {
                  total: contacts.length,
                })}
              </div>
            </div>
            <div className="flex items-center gap-1 glass-container rounded-full px-2 py-1">
              <button className="p-1 px-2 text-white/60 transition-all hover:text-white">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="h-4 w-[1px] bg-white/10 mx-1" />
              <span className="text-[10px] font-bold text-white/50 px-2 tracking-tighter">
                1 / 50
              </span>
              <div className="h-4 w-[1px] bg-white/10 mx-1" />
              <button className="p-1 px-2 text-white/60 transition-all hover:text-white">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Action Bar */}
            {selectedContacts.length > 0 && (
              <div className="sticky top-0 z-20 flex-shrink-0 border-b border-gray-700 bg-gray-900 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">
                      {selectedContacts.length} contact
                      {selectedContacts.length !== 1 ? "s" : ""} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 bg-gray-700 text-xs text-white transition-all hover:bg-gray-800"
                    >
                      <Mail className="mr-2 h-3.5 w-3.5" />
                      Mail
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 bg-gray-700 text-xs text-white transition-all hover:bg-gray-800"
                    >
                      <Calendar className="mr-2 h-3.5 w-3.5" />
                      Create Task
                    </Button>
                    <SolidDropdown
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 bg-gray-700 text-xs text-white transition-all hover:bg-gray-800"
                        >
                          Actions
                          <ChevronDown className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      }
                      title="Actions"
                      options={["Mass Update", "Change Owner", "Delete"]}
                    />
                  </div>
                  <button
                    className="p-1 text-gray-400 transition-all hover:text-gray-300"
                    onClick={() => setSelectedContacts([])}
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div
              className="main-content-scroll flex flex-1 overflow-hidden pl-6"
              style={{ gap: showFilters ? "24px" : "0px" }}
            >
              {/* Filter Sidebar */}
              <div
                className={`mt-6 h-[calc(100vh-140px)] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-in-out ${
                  showFilters
                    ? "w-64 translate-x-0 overflow-y-auto p-5 opacity-100"
                    : "w-0 -translate-x-full overflow-hidden border-0 p-0 opacity-0"
                }`}
              >
                <div className="space-y-6">
                  {/* Filters Header */}
                  <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                      <Filter className="mr-2 h-3.5 w-3.5 opacity-80" />
                      Filters
                    </h3>
                    <button
                      className="text-[10px] uppercase font-bold tracking-wider text-white/50 hover:text-white transition-colors"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setAssigneeFilter("all");
                        setTagFilter("all");
                        setLeadTypeFilter("All leads");
                      }}
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Search Filter */}
                  <div>
                    <label className="mb-3 block text-[10px] font-bold uppercase tracking-wider text-white/60">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-white/50" />
                      <input
                        type="text"
                        placeholder="Name, email, company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          fontSize: "11px",
                          color: "#ffffff",
                          backgroundColor: "rgba(255, 255, 255, 0.03)",
                          backdropFilter: "blur(12px)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "10px",
                          paddingLeft: "36px",
                          paddingRight: "12px",
                          paddingTop: "10px",
                          paddingBottom: "10px",
                          height: "38px",
                          width: "100%",
                          outline: "none",
                          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.02)",
                        }}
                        className="search-input-modern placeholder:text-white/40"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <div
                      className="mb-3 flex cursor-pointer items-center justify-between group"
                      onClick={() => toggleFilterSection("status")}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 group-hover:text-white/90 transition-colors">
                        Status
                      </label>
                      <ChevronDown
                        className={`h-3 w-3 text-white/50 transition-transform duration-200 ${
                          expandedFilters.status ? "rotate-180 transform" : ""
                        }`}
                      />
                    </div>
                    {expandedFilters.status && (
                      <div className="space-y-1 ml-1">
                        {Object.entries(statusConfig).map(([key, config]) => {
                          const Icon = config.icon;
                          const isActive = statusFilter === key;
                          return (
                            <button
                              key={key}
                              onClick={() =>
                                setStatusFilter(isActive ? "all" : key)
                              }
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[11px] font-medium transition-all ${
                                isActive
                                  ? "bg-primary/20 text-primary shadow-lg border border-primary/30"
                                  : "text-white/80 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <span className="flex items-center">
                                <Icon
                                  className={`mr-2.5 h-3.5 w-3.5 ${
                                    isActive ? "opacity-100" : "opacity-60"
                                  }`}
                                />
                                {config.label}
                              </span>
                              <span className="text-[10px] font-bold opacity-50">
                                {
                                  contacts.filter((c) => c.status === key)
                                    .length
                                }
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Owner Filter */}
                  <div>
                    <label className="mb-3 block text-[10px] font-bold uppercase tracking-wider text-white/60">
                      Owner
                    </label>
                    <Select
                      value={assigneeFilter}
                      onValueChange={setAssigneeFilter}
                    >
                      <SelectTrigger className="h-10 border-white/10 bg-white/5 text-[11px] font-medium rounded-xl backdrop-blur-md text-white/80 transition-colors hover:text-white">
                        <SelectValue placeholder="All owners" />
                      </SelectTrigger>
                      <SelectContent className="border-white/10 bg-black/80 backdrop-blur-2xl">
                        <SelectItem value="all" className="text-[11px]">
                          All owners
                        </SelectItem>
                        {teams.map((team) => (
                          <SelectItem
                            key={team.id}
                            value={team.id}
                            className="text-[11px]"
                          >
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags Filter */}
                  <div>
                    <div
                      className="mb-3 flex cursor-pointer items-center justify-between group"
                      onClick={() => toggleFilterSection("tags")}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 group-hover:text-white/90 transition-colors">
                        Tags
                      </label>
                      <ChevronDown
                        className={`h-3 w-3 text-white/50 transition-transform duration-200 ${
                          expandedFilters.tags ? "rotate-180 transform" : ""
                        }`}
                      />
                    </div>
                    {expandedFilters.tags && (
                      <div className="space-y-1 ml-1">
                        {allTags.slice(0, 5).map((tag) => {
                          const isActive = tagFilter === tag;
                          return (
                            <button
                              key={tag}
                              onClick={() =>
                                setTagFilter(isActive ? "all" : tag)
                              }
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[11px] font-medium transition-all ${
                                isActive
                                  ? "bg-white/10 text-white shadow-lg border border-white/10"
                                  : "text-white/80 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <span className="flex items-center">
                                <Tag
                                  className={`mr-2.5 h-3.5 w-3.5 ${
                                    isActive ? "opacity-100" : "opacity-60"
                                  }`}
                                />
                                {tag}
                              </span>
                              <span className="text-[10px] font-bold opacity-50">
                                {
                                  contacts.filter((c) => c.tags.includes(tag))
                                    .length
                                }
                              </span>
                            </button>
                          );
                        })}
                        {allTags.length > 5 && (
                          <button className="text-[10px] font-bold text-white/60 hover:text-white transition-colors px-2 py-1">
                            +{allTags.length - 5} MORE
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Filters */}
                  <div>
                    <div
                      className="mb-3 flex cursor-pointer items-center justify-between group"
                      onClick={() => toggleFilterSection("quickFilters")}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/60 group-hover:text-white/90 transition-colors">
                        Quick filters
                      </label>
                      <ChevronDown
                        className={`h-3 w-3 text-white/50 transition-transform duration-200 ${
                          expandedFilters.quickFilters
                            ? "rotate-180 transform"
                            : ""
                        }`}
                      />
                    </div>
                    {expandedFilters.quickFilters && (
                      <div className="space-y-1 ml-1">
                        <button className="flex w-full items-center rounded-lg px-2.5 py-2 text-[11px] font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all">
                          <Star className="mr-2.5 h-3.5 w-3.5 text-white/60" />
                          Starred only
                        </button>
                        <button className="flex w-full items-center rounded-lg px-2.5 py-2 text-[11px] font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all">
                          <Clock className="mr-2.5 h-3.5 w-3.5 text-white/60" />
                          Recently active
                        </button>
                        <button className="flex w-full items-center rounded-lg px-2.5 py-2 text-[11px] font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all">
                          <TrendingUp className="mr-2.5 h-3.5 w-3.5 text-white/60" />
                          High value
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out min-h-0">
                {viewMode === "table" ? (
                  <div className="flex flex-1 flex-col overflow-hidden min-h-0">
                    <div
                      className="table-scroll-container flex-1 overflow-x-auto overflow-y-auto bg-gradient-to-b from-black to-gray-950"
                      style={{ maxWidth: "calc(100vw - 140px)" }}
                    >
                      <table className="w-full min-w-max border-separate border-spacing-0">
                        <thead className="sticky top-0 z-40">
                          <tr className="bg-white/[0.04] backdrop-blur-3xl">
                            <th
                              className="sticky left-0 z-50 px-6 py-5 text-center border-r border-b border-white/5"
                              style={{
                                background: "rgba(10, 10, 10, 0.85)",
                                backdropFilter: "blur(40px)",
                                WebkitBackdropFilter: "blur(40px)",
                              }}
                            >
                              <div className="flex items-center justify-center">
                                <SmallCheckbox
                                  checked={
                                    selectedContacts.length ===
                                    sortedContacts.length
                                  }
                                  onCheckedChange={handleSelectAll}
                                />
                              </div>
                            </th>
                            {columnOrder.map((columnKey) => {
                              const config =
                                columnConfig[
                                  columnKey as keyof typeof columnConfig
                                ];
                              return (
                                <ColumnHeader
                                  key={columnKey}
                                  title={config.title}
                                  sortKey={columnKey}
                                  minWidth={config.minWidth}
                                />
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="">
                          {sortedContacts.map((contact) => {
                            const statusInfo =
                              statusConfig[contact.status] || statusConfig.new;
                            const StatusIcon = statusInfo.icon;
                            return (
                              <tr
                                key={contact.id}
                                className="cursor-pointer text-xs transition-all duration-200 hover:bg-gray-900/30 group"
                                onClick={() => navigate(`/leads/${contact.id}`)}
                              >
                                <td
                                  className="z-5 sticky left-0 px-6 py-4 bg-black group-hover:bg-gray-900/50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SmallCheckbox
                                    checked={selectedContacts.includes(
                                      contact.id
                                    )}
                                    onCheckedChange={() =>
                                      handleSelectContact(contact.id)
                                    }
                                  />
                                </td>
                                {columnOrder.map((columnKey) => {
                                  const config =
                                    columnConfig[
                                      columnKey as keyof typeof columnConfig
                                    ];
                                  return (
                                    <td
                                      key={columnKey}
                                      className="whitespace-nowrap px-6 py-4"
                                      style={{ minWidth: config.minWidth }}
                                    >
                                      {renderCellContent(columnKey, contact)}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Cards View */
                  <div className="overflow-y-auto p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {sortedContacts.map((contact) => {
                        const statusInfo =
                          statusConfig[contact.status] || statusConfig.new;
                        const StatusIcon = statusInfo.icon;
                        return (
                          <Card
                            key={contact.id}
                            className="cursor-pointer border-gray-800 bg-gray-900 transition-all hover:border-gray-600 hover:bg-gray-800/50"
                            onClick={() => navigate(`/leads/${contact.id}`)}
                          >
                            <CardContent className="p-4">
                              <div className="mb-3 flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center text-sm font-medium text-white">
                                    {displayField(contact.firstName)}{" "}
                                    {displayField(contact.lastName)}
                                    {contact.isStarred && (
                                      <Star className="ml-1 h-3 w-3 fill-current text-yellow-400" />
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-400">
                                    {displayField(contact.email)}
                                  </div>
                                </div>
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="-m-2 p-2"
                                >
                                  <SmallCheckbox
                                    checked={selectedContacts.includes(
                                      contact.id
                                    )}
                                    onCheckedChange={() =>
                                      handleSelectContact(contact.id)
                                    }
                                  />
                                </div>
                              </div>

                              <div className="mb-3 space-y-2">
                                <div className="text-sm text-white">
                                  {displayField(contact.company)}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {contact.title}
                                </div>
                              </div>

                              <div className="mb-3 flex items-center justify-between">
                                <Badge
                                  className={`${statusInfo.color} premium-badge`}
                                >
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                  {statusInfo.label}
                                </Badge>
                              </div>

                              <div className="mb-3 space-y-2">
                                <div className="flex items-center text-xs">
                                  <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-gray-500 to-gray-600 text-xs font-medium text-white">
                                    {contact.assignedTo
                                      .split(" ")
                                      .map((name) => name[0])
                                      .join("")}
                                  </div>
                                  <span className="text-gray-300">
                                    {contact.assignedTo}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400">
                                  Campaign: {contact.campaign || "Q4 Growth"}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {displayField(contact.phone)}
                                </div>
                              </div>

                              <div className="mt-3 flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs bg-white text-black hover:bg-gray-200 border-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewCallDetails(contact);
                                  }}
                                >
                                  <Phone className="mr-1 h-3 w-3" />
                                  Call
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
                                >
                                  <Mail className="mr-1 h-3 w-3" />
                                  Email
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <CallLogDetailsModal
                isOpen={showCallDetails}
                onClose={() => setShowCallDetails(false)}
                callData={
                  selectedCallContact
                    ? getMockCallData(selectedCallContact)
                    : undefined
                }
              />

              <AddColumnsModal
                isOpen={showAddColumnsModal}
                onClose={() => setShowAddColumnsModal(false)}
                onSave={handleAddColumns}
                availableColumns={[]}
                currentColumns={[
                  ...Object.keys(baseColumnConfig),
                  ...additionalColumns,
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
