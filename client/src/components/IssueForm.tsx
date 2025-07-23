
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/utils/trpc';
import type { 
  User, 
  IssueTag, 
  IssueWithRelations, 
  CreateIssueInput, 
  UpdateIssueInput,
  IssueStatus 
} from '../../../server/src/schema';

interface IssueFormProps {
  users: User[];
  tags: IssueTag[];
  editingIssue?: IssueWithRelations | null;
  onSuccess: (issue: IssueWithRelations) => void;
  onCancel: () => void;
}

export function IssueForm({ users, tags, editingIssue, onSuccess, onCancel }: IssueFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'not started' as IssueStatus,
    assignee_id: null as number | null,
    tag_ids: [] as number[]
  });

  // Initialize form data when editing
  useEffect(() => {
    if (editingIssue) {
      setFormData({
        title: editingIssue.title,
        description: editingIssue.description,
        status: editingIssue.status,
        assignee_id: editingIssue.assignee_id,
        tag_ids: editingIssue.tags.map((tag) => tag.id)
      });
    }
  }, [editingIssue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingIssue) {
        // Update existing issue
        const updateData: UpdateIssueInput = {
          id: editingIssue.id,
          title: formData.title,
          description: formData.description,
          status: formData.status,
          assignee_id: formData.assignee_id,
          tag_ids: formData.tag_ids
        };
        
        await trpc.updateIssue.mutate(updateData);
        
        // STUB: Real implementation would return updated issue with relations
        // For now, we'll construct the updated issue locally
        const updatedIssue: IssueWithRelations = {
          ...editingIssue,
          title: formData.title,
          description: formData.description,
          status: formData.status,
          assignee_id: formData.assignee_id,
          updated_at: new Date(),
          assignee: formData.assignee_id 
            ? users.find((u) => u.id === formData.assignee_id) || null 
            : null,
          tags: tags.filter((tag) => formData.tag_ids.includes(tag.id))
        };
        
        onSuccess(updatedIssue);
      } else {
        // Create new issue
        const createData: CreateIssueInput = {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          assignee_id: formData.assignee_id,
          tag_ids: formData.tag_ids
        };
        
        await trpc.createIssue.mutate(createData);
        
        // STUB: Real implementation would return the created issue with relations
        // For now, we'll construct the new issue locally
        const newIssue: IssueWithRelations = {
          id: Date.now(), // Temporary ID
          title: formData.title,
          description: formData.description,
          status: formData.status,
          assignee_id: formData.assignee_id,
          creator_id: 1, // STUB: Should come from auth context
          created_at: new Date(),
          updated_at: new Date(),
          assignee: formData.assignee_id 
            ? users.find((u) => u.id === formData.assignee_id) || null 
            : null,
          creator: users.length > 0 
            ? users[0] 
            : { id: 1, email: 'user@example.com', password: '', created_at: new Date() },
          tags: tags.filter((tag) => formData.tag_ids.includes(tag.id))
        };
        
        onSuccess(newIssue);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        status: 'not started',
        assignee_id: null,
        tag_ids: []
      });
    } catch (error) {
      console.error('Failed to save issue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tagId: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      tag_ids: checked 
        ? [...prev.tag_ids, tagId]
        : prev.tag_ids.filter((id) => id !== tagId)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Enter issue title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Describe the issue"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(status: IssueStatus) =>
              setFormData((prev) => ({ ...prev, status }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not started">⭕ Not Started</SelectItem>
              <SelectItem value="in progress">🔄 In Progress</SelectItem>
              <SelectItem value="done">✅ Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Assignee</Label>
          <Select
            value={formData.assignee_id?.toString() || 'unassigned'}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                assignee_id: value === 'unassigned' ? null : parseInt(value)
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">👤 Unassigned</SelectItem>
              {users.map((user: User) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {tags.map((tag: IssueTag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={formData.tag_ids.includes(tag.id)}
                  onCheckedChange={(checked: boolean) => 
                    handleTagToggle(tag.id, checked)
                  }
                />
                <Label htmlFor={`tag-${tag.id}`} className="text-sm">
                  🏷️ {tag.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : editingIssue ? 'Update Issue' : 'Create Issue'}
        </Button>
      </div>
    </form>
  );
}
