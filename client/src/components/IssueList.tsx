
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { IssueWithRelations, IssueStatus } from '../../../server/src/schema';

interface IssueListProps {
  issues: IssueWithRelations[];
  onEdit: (issue: IssueWithRelations) => void;
  onDelete: (issueId: number) => void;
  onStatusUpdate: (issueId: number, status: IssueStatus) => void;
}

const statusColors = {
  'not started': 'bg-gray-100 text-gray-800',
  'in progress': 'bg-blue-100 text-blue-800',
  'done': 'bg-green-100 text-green-800'
};

const statusEmojis = {
  'not started': '⭕',
  'in progress': '🔄',
  'done': '✅'
};

export function IssueList({ issues, onEdit, onDelete, onStatusUpdate }: IssueListProps) {
  const handleDelete = async (issueId: number) => {
    try {
      await trpc.deleteIssue.mutate({ id: issueId });
      onDelete(issueId);
    } catch (error) {
      console.error('Failed to delete issue:', error);
    }
  };

  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2">No issues found</h3>
            <p className="text-sm">Create your first issue to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {issues.map((issue: IssueWithRelations) => (
        <Card key={issue.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {issue.title}
                  </h3>
                  <Badge className={statusColors[issue.status]}>
                    {statusEmojis[issue.status]} {issue.status}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-3">{issue.description}</p>
                
                {/* Tags */}
                {issue.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {issue.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        🏷️ {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Metadata */}
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>#{issue.id}</span>
                  <span>Created by {issue.creator.email}</span>
                  {issue.assignee && (
                    <span>Assigned to {issue.assignee.email}</span>
                  )}
                  <span>{issue.created_at.toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2">
                {/* Status Update */}
                <Select
                  value={issue.status}
                  onValueChange={(status: IssueStatus) => onStatusUpdate(issue.id, status)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not started">⭕ Not Started</SelectItem>
                    <SelectItem value="in progress">🔄 In Progress</SelectItem>
                    <SelectItem value="done">✅ Done</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(issue)}
                >
                  Edit
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Issue</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{issue.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(issue.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
