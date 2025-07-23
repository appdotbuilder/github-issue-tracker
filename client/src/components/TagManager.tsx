
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { IssueTag, CreateIssueTagInput, UpdateIssueTagInput } from '../../../server/src/schema';

interface TagManagerProps {
  tags: IssueTag[];
  onTagCreated: (tag: IssueTag) => void;
  onTagUpdated: (tag: IssueTag) => void;
  onTagDeleted: (tagId: number) => void;
}

export function TagManager({ tags, onTagCreated, onTagUpdated, onTagDeleted }: TagManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<IssueTag | null>(null);
  const [editTagName, setEditTagName] = useState('');

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setIsLoading(true);
    try {
      const createData: CreateIssueTagInput = {
        name: newTagName.trim()
      };
      
      await trpc.createIssueTag.mutate(createData);
      
      
      
      // STUB: Real implementation would return the created tag
      // For now, we'll construct it locally
      const newTag: IssueTag = {
        id: Date.now(), // Temporary ID
        name: newTagName.trim(),
        created_at: new Date()
      };
      
      onTagCreated(newTag);
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag || !editTagName.trim()) return;

    setIsLoading(true);
    try {
      const updateData: UpdateIssueTagInput = {
        id: editingTag.id,
        name: editTagName.trim()
      };
      
      await trpc.updateIssueTag.mutate(updateData);
      
      // STUB: Real implementation would return the updated tag
      // For now, we'll construct it locally
      const updatedTag: IssueTag = {
        ...editingTag,
        name: editTagName.trim()
      };
      
      onTagUpdated(updatedTag);
      setEditingTag(null);
      setEditTagName('');
    } catch (error) {
      console.error('Failed to update tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      await trpc.deleteIssueTag.mutate({ id: tagId });
      onTagDeleted(tagId);
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const startEditing = (tag: IssueTag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
  };

  const cancelEditing = () => {
    setEditingTag(null);
    setEditTagName('');
  };

  return (
    <div className="space-y-6">
      {/* Create New Tag */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTag} className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="new-tag" className="sr-only">Tag name</Label>
              <Input
                id="new-tag"
                value={newTagName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setNewTagName(e.target.value)
                }
                placeholder="Enter tag name"
                maxLength={50}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Tag'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tags List */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Tags ({tags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">🏷️</div>
                <h3 className="text-lg font-medium mb-2">No tags yet</h3>
                <p className="text-sm">Create your first tag to organize issues!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tags.map((tag: IssueTag) => (
                <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  {editingTag && editingTag.id === tag.id ? (
                    // Edit mode
                    <form onSubmit={handleUpdateTag} className="flex items-center space-x-2 flex-1 mr-2">
                      <Input
                        value={editTagName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setEditTagName(e.target.value)
                        }
                        maxLength={50}
                        required
                        className="flex-1"
                      />
                      <Button type="submit" size="sm" disabled={isLoading}>
                        Save
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    // View mode
                    <>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">🏷️ {tag.name}</Badge>
                        <span className="text-xs text-gray-500">
                          Created {tag.created_at.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(tag)}
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
                              <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the tag "{tag.name}"? 
                                This will remove it from all issues.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTag(tag.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
