import { User } from "@shared/schema";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle } from "lucide-react";

interface UserSearchCommandProps {
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (userId: string) => void;
  selectedUserId?: string;
  emptyMessage?: string;
  placeholder?: string;
  className?: string;
}

export function UserSearchCommand({
  users,
  open,
  onOpenChange,
  onSelect,
  selectedUserId,
  emptyMessage = "No users found.",
  placeholder = "Search users...",
  className,
}: UserSearchCommandProps) {
  const handleSelect = (userId: string) => {
    onSelect(userId);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className={className}>
      <CommandInput
        placeholder={placeholder}
        data-testid="input-search-users"
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        <CommandGroup>
          {users.map((user) => {
            const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
            const isSelected = selectedUserId === user.id;
            const searchValue = `${user.firstName} ${user.lastName} ${user.email}`;
            
            return (
              <CommandItem
                key={user.id}
                value={searchValue}
                onSelect={() => handleSelect(user.id)}
                className="gap-3 py-3 cursor-pointer"
                data-testid={`user-item-${user.id}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profilePhotoUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {initials || <UserCircle className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {user.firstName} {user.lastName}
                    </span>
                    {isSelected && (
                      <span className="text-xs text-muted-foreground">(selected)</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
