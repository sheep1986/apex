import React, { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Play, Search, User, CheckCircle, Calendar, Award, Star, Filter, Phone, Clock, BarChart3 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select'

// Function to convert date to UK format (dd/mm/yyyy)
const formatDateToUK = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const statusColors: Record<string, string> = {
  Lead: "bg-brand-pink text-white",
  Interested: "bg-green-500 text-white",
  "Meeting booked": "bg-purple-500 text-white",
  "Meeting completed": "bg-orange-400 text-white",
  Won: "bg-blue-500 text-white",
};

const statusIcons: Record<string, JSX.Element> = {
  Lead: <User className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />,
  Interested: <CheckCircle className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />,
  "Meeting booked": <Calendar className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />,
  "Meeting completed": <Award className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />,
  Won: <Star className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />,
};

const mockCalls = [
  {
    id: 1,
    number: "+1 555-123-4567",
    status: "Lead",
    transcript: "Hi, this is Sean from Apex AI. I wanted to follow up on our last conversation about your AI calling needs. We've seen great results with similar companies in your industry.",
    date: "28/06/2025 14:32",
    duration: "3:45",
    campaign: "Q4 Outreach"
  },
  {
    id: 2,
    number: "+1 555-987-6543",
    status: "Interested",
    transcript: "Yes, I'm interested in learning more about your platform. The automation capabilities sound exactly like what we need to scale our sales process.",
    date: "28/06/2025 13:10",
    duration: "5:22",
    campaign: "Q4 Outreach"
  },
  {
    id: 3,
    number: "+1 555-456-7890",
    status: "Meeting booked",
    transcript: "Let's schedule a meeting for next week to discuss details. I'd like to see a demo of the platform and understand the pricing structure.",
    date: "27/06/2025 16:45",
    duration: "4:18",
    campaign: "Enterprise Demo"
  },
  {
    id: 4,
    number: "+1 555-789-0123",
    status: "Won",
    transcript: "Perfect! We're ready to move forward. The ROI projections you showed us are exactly what we were looking for.",
    date: "26/06/2025 11:20",
    duration: "6:33",
    campaign: "Enterprise Demo"
  },
];

const statusOptions = ["All", "Lead", "Interested", "Meeting booked", "Meeting completed", "Won"];
const campaignOptions = ["All", "Q4 Outreach", "Enterprise Demo", "Retention Campaign"];
const numberOptions = ["All", "+1 555-123-4567", "+1 555-987-6543", "+1 555-456-7890", "+1 555-789-0123"];

export default function CRM() {
  const [status, setStatus] = useState("All");
  const [campaign, setCampaign] = useState("All");
  const [number, setNumber] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const filteredCalls = mockCalls.filter((call) => {
    const searchLower = search.toLowerCase();
    return (
      (status === "All" || call.status === status) &&
      (campaign === "All" || call.campaign === campaign) &&
      (number === "All" || call.number === number) &&
      (search === "" ||
        call.transcript.toLowerCase().includes(searchLower) ||
        call.number.toLowerCase().includes(searchLower) ||
        call.date.toLowerCase().includes(searchLower)
      )
    );
  });

  const stats = {
    total: mockCalls.length,
    leads: mockCalls.filter(c => c.status === "Lead").length,
    interested: mockCalls.filter(c => c.status === "Interested").length,
    won: mockCalls.filter(c => c.status === "Won").length,
  };

  return (
    <div className="flex h-full w-full bg-black overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-80 bg-black border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white tracking-tight">CRM</h2>
          <p className="text-gray-400 text-sm mt-1">Customer Relationship Management</p>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-gray-800">
          <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-3 h-3" />
            Overview
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="rounded-md bg-gray-900 border border-gray-800 px-3 py-2 flex flex-col items-center text-xs font-medium text-gray-300">
              <span className="text-base font-semibold text-white">{stats.total}</span>
              Total Calls
            </div>
            <div className="rounded-md bg-gray-900 border border-gray-800 px-3 py-2 flex flex-col items-center text-xs font-medium text-gray-300">
              <span className="text-base font-semibold text-pink-400">{stats.leads}</span>
              New Leads
            </div>
            <div className="rounded-md bg-gray-900 border border-gray-800 px-3 py-2 flex flex-col items-center text-xs font-medium text-gray-300">
              <span className="text-base font-semibold text-green-400">{stats.interested}</span>
              Interested
            </div>
            <div className="rounded-md bg-gray-900 border border-gray-800 px-3 py-2 flex flex-col items-center text-xs font-medium text-gray-300">
              <span className="text-base font-semibold text-blue-400">{stats.won}</span>
              Won
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Status Filter */}
          <div>
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-3 h-3" />
              Status
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[220px] bg-gray-800 border border-gray-800 text-white rounded-lg">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="glassy-dropdown-content rounded-xl shadow-2xl border border-gray-800 bg-gradient-to-br from-gray-900/90 via-gray-950/90 to-black/95 backdrop-blur-xl">
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s} className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">
                    {statusIcons[s] && <span>{statusIcons[s]}</span>}{s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campaign Filter */}
          <div>
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Campaign</div>
            <Select value={campaign} onValueChange={setCampaign}>
              <SelectTrigger className="w-full bg-gray-800 border border-gray-800 text-white rounded-lg">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="glassy-dropdown-content rounded-xl shadow-2xl border border-gray-800 bg-gradient-to-br from-gray-900/90 via-gray-950/90 to-black/95 backdrop-blur-xl">
                {campaignOptions.map((c) => (
                  <SelectItem key={c} value={c} className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number Filter */}
          <div>
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-3 h-3" />
              Phone Number
            </div>
            <Select value={number} onValueChange={setNumber}>
              <SelectTrigger className="w-full bg-gray-800 border border-gray-800 text-white rounded-lg">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="glassy-dropdown-content rounded-xl shadow-2xl border border-gray-800 bg-gradient-to-br from-gray-900/90 via-gray-950/90 to-black/95 backdrop-blur-xl">
                {numberOptions.map((n) => (
                  <SelectItem key={n} value={n} className="flex items-center gap-2 text-white text-sm py-2 px-3 rounded-lg hover:bg-brand-pink/20 transition-all">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* More Filters */}
          <div className="pt-4 border-t border-gray-800">
            <button className="text-brand-pink hover:text-brand-magenta text-xs font-medium transition-colors flex items-center gap-2">
              <Filter className="w-3 h-3" />
              More Filters
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-black">
        {/* Header */}
        <div className="p-8 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-1 text-white">Calls</h2>
              <p className="text-sm text-gray-400 mb-2">View and manage your AI call history and recordings</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Showing</div>
                <div className="text-lg font-semibold text-white">{filteredCalls.length} of {mockCalls.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-8 pb-6">
          <div className="mb-2 relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
              <Search className="w-4 h-4" />
            </span>
            <Input
              className="w-full h-10 rounded-lg bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-800 text-sm pl-8 pr-2 shadow-sm focus:outline-none focus:ring-0 placeholder:text-gray-500"
              placeholder="Search calls, transcripts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 px-8 pb-8">
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/80 via-gray-950/80 to-black/90 backdrop-blur-md shadow-2xl">
            <table className="w-full text-sm bg-gray-900 rounded-md border border-gray-800">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="font-medium px-2 py-2">PHONE NUMBER</th>
                  <th className="font-medium px-2 py-2">STATUS</th>
                  <th className="font-medium px-2 py-2">TRANSCRIPT</th>
                  <th className="font-medium px-2 py-2">DURATION</th>
                  <th className="font-medium px-2 py-2">DATE/TIME</th>
                  <th className="font-medium px-2 py-2">LISTEN</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map((call, idx) => (
                  <tr
                    key={call.id}
                    className={`border-b border-gray-800 hover:bg-gray-800 transition-colors ${expandedRow === idx ? "bg-gray-800" : ""}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                  >
                    <td className="px-2 py-2 align-middle">
                      <div className="text-xs font-medium text-white leading-tight">{call.number}</div>
                      <div className="text-xs text-gray-500">{call.campaign}</div>
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <Badge className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${statusColors[call.status]}`}>{statusIcons[call.status]}{call.status}</Badge>
                    </td>
                    <td className="px-2 py-2 align-middle text-gray-300 max-w-xs truncate">{call.transcript}</td>
                    <td className="px-2 py-2 align-middle text-gray-400 text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{call.duration}</td>
                    <td className="px-2 py-2 align-middle text-gray-400 text-xs">{call.date}</td>
                    <td className="px-2 py-2 align-middle">
                      <Button size="icon" variant="ghost" className="rounded-md p-1 h-7 w-7 border border-pink-400 hover:bg-pink-900/20">
                        <Play className="w-4 h-4 text-pink-400" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 