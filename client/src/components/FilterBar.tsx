
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User, IssueTag, IssueFilter, IssueStatus } from '../../../server/src/schema';

interface FilterBarProps {
  users: User[];
  tags: IssueTag[];
  filter: IssueFilter;
  onFilterChange: (filter: IssueFilter) => void;
}

export function FilterBar({ users, tags, filter, onFilterChange }: FilterBarProps) {
  const handleAssigneeChange = (value: string) => {
    onFilterChange({
      ...filter,
      assignee_id: value === 'all' ? undefined : parseInt(value)
    });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filter,
      status: value === 'all' ? undefined : value as IssueStatus
    });
  };

  const handleTagChange = (value: string) => {
    onFilterChange({
      ...filter,
      tag_id: value === 'all' ? undefined : parseInt(value)
    });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = filter.assignee_id || filter.status || filter.tag_id;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Filter by:</span>
        
        {/* Assignee Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Assignee:</span>
          <Select
            value={filter.assignee_id?.toString() || 'all'}
            onValueChange={handleAssigneeChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {users.map((user: User) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Status:</span>
          <Select
            value={filter.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not started">⭕ Not Started</SelectItem>
              <SelectItem value="in progress">🔄 In Progress</SelectItem>
              <SelectItem value="done">✅ Done</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tag Filter */}
        {tags.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Tag:</span>
            <Select
              value={filter.tag_id?.toString() || 'all'}
              onValueChange={handleTagChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {tags.map((tag: IssueTag) => (
                  <SelectItem key={tag.id} value={tag.id.toString()}>
                    🏷️ {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {filter.assignee_id && (
            <Badge variant="secondary">
              Assignee: {users.find((u) => u.id === filter.assignee_id)?.email}
            </Badge>
          )}
          
          {filter.status && (
            <Badge variant="secondary">
              Status: {filter.status}
            </Badge>
          )}
          
          {filter.tag_id && (
            <Badge variant="secondary">
              Tag: {tags.find((t) => t.id === filter.tag_id)?.name}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
