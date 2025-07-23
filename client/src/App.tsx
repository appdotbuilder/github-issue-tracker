
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { 
  User, 
  IssueWithRelations, 
  IssueTag, 
  LoginUserInput, 
  RegisterUserInput,
  IssueFilter,
  IssueStatus 
} from '../../server/src/schema';
import { AuthForm } from '@/components/AuthForm';
import { IssueList } from '@/components/IssueList';
import { IssueForm } from '@/components/IssueForm';
import { TagManager } from '@/components/TagManager';
import { FilterBar } from '@/components/FilterBar';

function App() {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Data state
  const [issues, setIssues] = useState<IssueWithRelations[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<IssueTag[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState('issues');
  const [editingIssue, setEditingIssue] = useState<IssueWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter state
  const [filter, setFilter] = useState<IssueFilter>({});

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      const [issuesData, usersData, tagsData] = await Promise.all([
        trpc.getIssues.query(filter),
        trpc.getUsers.query(),
        trpc.getIssueTags.query()
      ]);
      setIssues(issuesData);
      setUsers(usersData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [filter]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Authentication handlers
  const handleLogin = async (credentials: LoginUserInput) => {
    setIsLoading(true);
    try {
      await trpc.loginUser.mutate(credentials);
      // STUB: Real implementation would return user data
      // For now, we'll simulate a successful login
      setUser({
        id: 1,
        email: credentials.email,
        password: '',
        created_at: new Date()
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (userData: RegisterUserInput) => {
    setIsLoading(true);
    try {
      await trpc.registerUser.mutate(userData);
      // STUB: Real implementation would return user data
      // For now, we'll simulate a successful registration
      setUser({
        id: 1,
        email: userData.email,
        password: '',
        created_at: new Date()
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIssues([]);
    setUsers([]);
    setTags([]);
    setEditingIssue(null);
    setActiveTab('issues');
  };

  // Issue handlers
  const handleIssueCreated = (newIssue: IssueWithRelations) => {
    setIssues((prev: IssueWithRelations[]) => [newIssue, ...prev]);
  };

  const handleIssueUpdated = (updatedIssue: IssueWithRelations) => {
    setIssues((prev: IssueWithRelations[]) => 
      prev.map((issue: IssueWithRelations) => 
        issue.id === updatedIssue.id ? updatedIssue : issue
      )
    );
    setEditingIssue(null);
  };

  const handleIssueDeleted = (issueId: number) => {
    setIssues((prev: IssueWithRelations[]) => 
      prev.filter((issue: IssueWithRelations) => issue.id !== issueId)
    );
  };

  // Tag handlers
  const handleTagCreated = (newTag: IssueTag) => {
    setTags((prev: IssueTag[]) => [...prev, newTag]);
  };

  const handleTagUpdated = (updatedTag: IssueTag) => {
    setTags((prev: IssueTag[]) => 
      prev.map((tag: IssueTag) => 
        tag.id === updatedTag.id ? updatedTag : tag
      )
    );
  };

  const handleTagDeleted = (tagId: number) => {
    setTags((prev: IssueTag[]) => 
      prev.filter((tag: IssueTag) => tag.id !== tagId)
    );
  };

  // Filter handlers
  const handleFilterChange = (newFilter: IssueFilter) => {
    setFilter(newFilter);
  };

  const handleStatusUpdate = async (issueId: number, status: IssueStatus) => {
    try {
      await trpc.updateIssue.mutate({
        id: issueId,
        status
      });
      // STUB: Real implementation would return the updated issue with relations
      // For now, we'll update the local state
      setIssues((prev: IssueWithRelations[]) => 
        prev.map((issue: IssueWithRelations) => 
          issue.id === issueId ? { ...issue, status, updated_at: new Date() } : issue
        )
      );
    } catch (error) {
      console.error('Failed to update issue status:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              🐛 Issue Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <AuthForm
                  mode="login"
                  onSubmit={handleLogin}
                  isLoading={isLoading}
                />
              </TabsContent>
              <TabsContent value="register">
                <AuthForm
                  mode="register"
                  onSubmit={handleRegister}
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">🐛 Issue Tracker</h1>
              <Badge variant="secondary">{issues.length} issues</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="new-issue">New Issue</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-6">
            <FilterBar
              users={users}
              tags={tags}
              filter={filter}
              onFilterChange={handleFilterChange}
            />
            <IssueList
              issues={issues}
              onEdit={setEditingIssue}
              onDelete={handleIssueDeleted}
              onStatusUpdate={handleStatusUpdate}
            />
          </TabsContent>

          <TabsContent value="new-issue">
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingIssue ? 'Edit Issue' : 'Create New Issue'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <IssueForm
                  users={users}
                  tags={tags}
                  editingIssue={editingIssue}
                  onSuccess={editingIssue ? handleIssueUpdated : handleIssueCreated}
                  onCancel={() => {
                    setEditingIssue(null);
                    setActiveTab('issues');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags">
            <TagManager
              tags={tags}
              onTagCreated={handleTagCreated}
              onTagUpdated={handleTagUpdated}
              onTagDeleted={handleTagDeleted}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Issue Modal Trigger */}
        {editingIssue && activeTab === 'issues' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Edit Issue</CardTitle>
              </CardHeader>
              <CardContent>
                <IssueForm
                  users={users}
                  tags={tags}
                  editingIssue={editingIssue}
                  onSuccess={handleIssueUpdated}
                  onCancel={() => setEditingIssue(null)}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
