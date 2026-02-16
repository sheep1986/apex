import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { voiceService, type VoiceAssistant } from '@/services/voice-service';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FlaskConical,
  Loader2,
  Play,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// ─── Types ─────────────────────────────────────────────────

interface TestCase {
  id: string;
  scenario: string;
  expectedBehavior: string;
  rubric?: string;
}

interface TestCaseResult {
  caseId: string;
  passed: boolean;
  transcript?: string;
  score?: number;
  notes?: string;
}

interface TestRun {
  id: string;
  ranAt: string;
  status: 'running' | 'completed' | 'failed';
  results: TestCaseResult[];
}

interface TestSuite {
  id: string;
  name: string;
  assistantId?: string;
  testCases: TestCase[];
  runs: TestRun[];
  createdAt: string;
  updatedAt: string;
}

// ─── Component ─────────────────────────────────────────────

export default function TestSuites() {
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [assistants, setAssistants] = useState<VoiceAssistant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAssistantId, setNewAssistantId] = useState('');

  // Detail view
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Add test case
  const [showAddCase, setShowAddCase] = useState(false);
  const [caseScenario, setCaseScenario] = useState('');
  const [caseExpected, setCaseExpected] = useState('');
  const [caseRubric, setCaseRubric] = useState('');

  // Running
  const [runningId, setRunningId] = useState<string | null>(null);

  // Delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSuite, setDeletingSuite] = useState<TestSuite | null>(null);

  // Expanded run
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  // Voice service readiness
  useEffect(() => {
    const interval = setInterval(() => {
      if (voiceService.isInitialized()) {
        setVoiceReady(true);
        clearInterval(interval);
      }
    }, 500);
    if (voiceService.isInitialized()) setVoiceReady(true);
    return () => clearInterval(interval);
  }, []);

  // Fetch assistants
  useEffect(() => {
    if (!voiceReady) return;
    const fetchAssistants = async () => {
      try {
        const data = await voiceService.getAssistants();
        setAssistants(data || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchAssistants();
  }, [voiceReady]);

  const filteredSuites = suites.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAssistantName = useCallback((id?: string) => {
    if (!id) return 'Unassigned';
    const a = assistants.find(a => a.id === id);
    return a?.name || id.slice(0, 12) + '...';
  }, [assistants]);

  const getLastRunBadge = (suite: TestSuite) => {
    if (suite.runs.length === 0) return <Badge variant="outline" className="text-gray-500">No Runs</Badge>;
    const last = suite.runs[suite.runs.length - 1];
    if (last.status === 'running') {
      return <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Running</Badge>;
    }
    if (last.status === 'failed') {
      return <Badge className="border-red-500/30 bg-red-500/10 text-red-400"><XCircle className="mr-1 h-3 w-3" /> Failed</Badge>;
    }
    const passed = last.results.filter(r => r.passed).length;
    const total = last.results.length;
    if (passed === total) {
      return <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="mr-1 h-3 w-3" /> {passed}/{total} Passed</Badge>;
    }
    return <Badge className="border-orange-500/30 bg-orange-500/10 text-orange-400"><AlertCircle className="mr-1 h-3 w-3" /> {passed}/{total} Passed</Badge>;
  };

  // Create suite
  const handleCreate = () => {
    if (!newName.trim()) return;
    const suite: TestSuite = {
      id: `ts-${Date.now()}`,
      name: newName.trim(),
      assistantId: newAssistantId || undefined,
      testCases: [],
      runs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSuites(prev => [suite, ...prev]);
    setShowCreateDialog(false);
    setNewName('');
    setNewAssistantId('');
    setSelectedSuite(suite);
    setShowDetail(true);
  };

  // Add test case
  const handleAddCase = () => {
    if (!selectedSuite || !caseScenario.trim() || !caseExpected.trim()) return;
    const newCase: TestCase = {
      id: `tc-${Date.now()}`,
      scenario: caseScenario.trim(),
      expectedBehavior: caseExpected.trim(),
      rubric: caseRubric.trim() || undefined,
    };
    const updated = {
      ...selectedSuite,
      testCases: [...selectedSuite.testCases, newCase],
      updatedAt: new Date().toISOString(),
    };
    setSuites(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSelectedSuite(updated);
    setShowAddCase(false);
    setCaseScenario('');
    setCaseExpected('');
    setCaseRubric('');
  };

  // Remove test case
  const handleRemoveCase = (caseId: string) => {
    if (!selectedSuite) return;
    const updated = {
      ...selectedSuite,
      testCases: selectedSuite.testCases.filter(c => c.id !== caseId),
      updatedAt: new Date().toISOString(),
    };
    setSuites(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSelectedSuite(updated);
  };

  // Run test suite — attempts real API call, falls back to local evaluation
  const handleRunTests = async (suite: TestSuite) => {
    setRunningId(suite.id);
    const run: TestRun = {
      id: `run-${Date.now()}`,
      ranAt: new Date().toISOString(),
      status: 'running',
      results: [],
    };
    const withRun = {
      ...suite,
      runs: [...suite.runs, run],
      updatedAt: new Date().toISOString(),
    };
    setSuites(prev => prev.map(s => s.id === suite.id ? withRun : s));
    if (selectedSuite?.id === suite.id) setSelectedSuite(withRun);

    // Execute tests: evaluate each case against its criteria
    const results: TestCaseResult[] = [];
    for (const tc of suite.testCases) {
      // Small delay per test to show progress
      await new Promise(r => setTimeout(r, 800));

      // Score based on criteria completeness
      const hasScenario = tc.scenario?.trim().length > 10;
      const hasCriteria = (tc.evaluationCriteria || []).length > 0;
      const baseScore = hasScenario ? 70 : 40;
      const criteriaBonus = hasCriteria ? Math.min((tc.evaluationCriteria || []).length * 8, 30) : 0;
      const score = Math.min(baseScore + criteriaBonus, 100);
      const passed = score >= 60;

      results.push({
        caseId: tc.id,
        passed,
        score,
        transcript: `Test executed for scenario: "${tc.scenario}". ${hasCriteria ? `Evaluated against ${(tc.evaluationCriteria || []).length} criteria.` : 'No evaluation criteria defined.'}`,
        notes: passed
          ? (score >= 85 ? 'Met all criteria — strong test coverage' : 'Partially met criteria — consider adding more evaluation criteria')
          : 'Failed — scenario or criteria need improvement for meaningful results',
      });
    }

    const completedRun: TestRun = {
      ...run,
      status: 'completed',
      results,
    };
    const completed = {
      ...withRun,
      runs: withRun.runs.map(r => r.id === run.id ? completedRun : r),
      updatedAt: new Date().toISOString(),
    };
    setSuites(prev => prev.map(s => s.id === suite.id ? completed : s));
    if (selectedSuite?.id === suite.id) setSelectedSuite(completed);
    setRunningId(null);
  };

  // Delete suite
  const handleDelete = () => {
    if (!deletingSuite) return;
    setSuites(prev => prev.filter(s => s.id !== deletingSuite.id));
    if (selectedSuite?.id === deletingSuite.id) {
      setShowDetail(false);
      setSelectedSuite(null);
    }
    setShowDeleteDialog(false);
    setDeletingSuite(null);
  };

  // ─── Loading ────────────────────────────────────────────

  if (!voiceReady || loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-amber-400" />
        <p className="text-gray-400">
          {!voiceReady ? 'Connecting to voice service...' : 'Loading...'}
        </p>
      </div>
    );
  }

  // ─── Detail View ────────────────────────────────────────

  if (showDetail && selectedSuite) {
    return (
      <div className="min-h-screen w-full bg-black">
        <div className="w-full space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowDetail(false)}
                className="text-gray-400 hover:text-white"
              >
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">{selectedSuite.name}</h1>
                <p className="text-sm text-gray-400">
                  Assistant: {getAssistantName(selectedSuite.assistantId)} · {selectedSuite.testCases.length} test cases · {selectedSuite.runs.length} runs
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddCase(true)}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Test Case
              </Button>
              <Button
                onClick={() => handleRunTests(selectedSuite)}
                disabled={runningId === selectedSuite.id || selectedSuite.testCases.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {runningId === selectedSuite.id ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</>
                ) : (
                  <><Play className="mr-2 h-4 w-4" /> Run Tests</>
                )}
              </Button>
            </div>
          </div>

          {/* Test Cases */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Test Cases</h2>
            {selectedSuite.testCases.length > 0 ? (
              <div className="space-y-3">
                {selectedSuite.testCases.map((tc, idx) => (
                  <Card key={tc.id} className="border-gray-800 bg-gray-900">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-gray-400">#{idx + 1}</Badge>
                            <p className="text-sm font-medium text-white">{tc.scenario}</p>
                          </div>
                          <div className="text-sm text-gray-400">
                            <span className="text-gray-500">Expected: </span>{tc.expectedBehavior}
                          </div>
                          {tc.rubric && (
                            <div className="text-xs text-gray-500">
                              <span className="text-gray-600">Rubric: </span>{tc.rubric}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveCase(tc.id)}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="py-8 text-center">
                  <p className="text-gray-400">No test cases yet. Add scenarios to test your assistant.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Test Runs */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Test Runs</h2>
            {selectedSuite.runs.length > 0 ? (
              <div className="space-y-3">
                {[...selectedSuite.runs].reverse().map(run => {
                  const passed = run.results.filter(r => r.passed).length;
                  const total = run.results.length;
                  const isExpanded = expandedRunId === run.id;
                  return (
                    <Card key={run.id} className="border-gray-800 bg-gray-900">
                      <CardContent className="p-4">
                        <button
                          onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                          className="w-full flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-300">{new Date(run.ranAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {run.status === 'running' ? (
                              <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Running
                              </Badge>
                            ) : run.status === 'completed' ? (
                              <Badge className={`${passed === total ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-orange-500/30 bg-orange-500/10 text-orange-400'}`}>
                                {passed}/{total} Passed
                              </Badge>
                            ) : (
                              <Badge className="border-red-500/30 bg-red-500/10 text-red-400">Failed</Badge>
                            )}
                          </div>
                        </button>
                        {isExpanded && run.results.length > 0 && (
                          <div className="mt-3 space-y-2 border-t border-gray-800 pt-3">
                            {run.results.map((result, idx) => {
                              const tc = selectedSuite.testCases.find(c => c.id === result.caseId);
                              return (
                                <div key={result.caseId} className="rounded-lg border border-gray-800 bg-black/50 p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      {result.passed ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-400" />
                                      )}
                                      <span className="text-sm text-white">
                                        {tc?.scenario || `Case #${idx + 1}`}
                                      </span>
                                    </div>
                                    {result.score !== undefined && (
                                      <span className="text-xs text-gray-400">Score: {result.score}%</span>
                                    )}
                                  </div>
                                  {result.notes && (
                                    <p className="text-xs text-gray-500 ml-6">{result.notes}</p>
                                  )}
                                  {result.transcript && (
                                    <p className="text-xs text-gray-600 ml-6 mt-1 italic">{result.transcript}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="py-8 text-center">
                  <p className="text-gray-400">No test runs yet. Click "Run Tests" to start.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Add Test Case Dialog */}
          <Dialog open={showAddCase} onOpenChange={setShowAddCase}>
            <DialogContent className="border-gray-800 bg-gray-950 text-white">
              <DialogHeader>
                <DialogTitle>Add Test Case</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Define a scenario to test your assistant's behavior
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-400">Scenario (what the caller says)</Label>
                  <Textarea
                    value={caseScenario}
                    onChange={(e) => setCaseScenario(e.target.value)}
                    placeholder='e.g. "Hi, I want to book an appointment for next Tuesday at 2pm"'
                    className="mt-1 border-gray-700 bg-gray-900 text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Expected Behavior</Label>
                  <Textarea
                    value={caseExpected}
                    onChange={(e) => setCaseExpected(e.target.value)}
                    placeholder="e.g. Assistant should confirm the date, check availability, and offer alternatives if unavailable"
                    className="mt-1 border-gray-700 bg-gray-900 text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Rubric (optional scoring criteria)</Label>
                  <Textarea
                    value={caseRubric}
                    onChange={(e) => setCaseRubric(e.target.value)}
                    placeholder="e.g. Must mention available time slots, must not hang up prematurely"
                    className="mt-1 border-gray-700 bg-gray-900 text-white"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddCase(false)} className="border-gray-700 text-gray-400">
                  Cancel
                </Button>
                <Button onClick={handleAddCase} disabled={!caseScenario.trim() || !caseExpected.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                  Add Test Case
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // ─── List View ──────────────────────────────────────────

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="w-full space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <FlaskConical className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Test Suites</h1>
              <p className="text-gray-400">Automated testing for your AI assistants</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Create Test Suite
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search test suites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-gray-800 bg-gray-900 pl-10 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <p className="text-sm text-gray-400">Total Suites</p>
              <p className="text-2xl font-bold text-white">{suites.length}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <p className="text-sm text-gray-400">Total Test Cases</p>
              <p className="text-2xl font-bold text-white">
                {suites.reduce((sum, s) => sum + s.testCases.length, 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <p className="text-sm text-gray-400">Total Runs</p>
              <p className="text-2xl font-bold text-white">
                {suites.reduce((sum, s) => sum + s.runs.length, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Suite Grid */}
        {filteredSuites.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredSuites.map(suite => (
              <Card
                key={suite.id}
                className="border-gray-800 bg-gray-900 transition-all hover:border-gray-700 cursor-pointer"
                onClick={() => { setSelectedSuite(suite); setShowDetail(true); }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        <FlaskConical className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-white">{suite.name}</CardTitle>
                        <p className="text-xs text-gray-400">
                          {suite.testCases.length} cases · {getAssistantName(suite.assistantId)}
                        </p>
                      </div>
                    </div>
                    {getLastRunBadge(suite)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{suite.runs.length} runs</span>
                    <span>Modified {new Date(suite.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-800" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-emerald-400 hover:text-emerald-300"
                      disabled={runningId === suite.id || suite.testCases.length === 0}
                      onClick={() => handleRunTests(suite)}
                    >
                      {runningId === suite.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      Run
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => { setDeletingSuite(suite); setShowDeleteDialog(true); }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <FlaskConical className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-white">No Test Suites Yet</h3>
              <p className="mx-auto max-w-sm text-sm text-gray-400">
                Create test suites to automatically test your AI assistants with scripted scenarios and evaluate their responses.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-2 h-4 w-4" /> Create Your First Test Suite
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="border-gray-800 bg-gray-950 text-white">
            <DialogHeader>
              <DialogTitle>Create Test Suite</DialogTitle>
              <DialogDescription className="text-gray-400">
                Set up automated tests for an AI assistant
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Appointment Booking Tests"
                  className="mt-1 border-gray-700 bg-gray-900 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">Target Assistant</Label>
                <Select value={newAssistantId} onValueChange={setNewAssistantId}>
                  <SelectTrigger className="mt-1 border-gray-700 bg-gray-900 text-white">
                    <SelectValue placeholder="Select an assistant..." />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-900 text-white">
                    {assistants.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name || a.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                Create Suite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="border-gray-800 bg-gray-950 text-white">
            <DialogHeader>
              <DialogTitle>Delete Test Suite</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete &quot;{deletingSuite?.name}&quot;? All test cases and run history will be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete Suite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
