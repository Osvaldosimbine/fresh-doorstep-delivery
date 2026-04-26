import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/contexts/NotificationContext";

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  const recent = notifications.slice(0, 10);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-background">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary hover:underline font-normal flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Marcar tudo como lido
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-6">
            Sem notificações
          </div>
        ) : (
          recent.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`flex flex-col items-start gap-0.5 py-2 cursor-pointer ${
                !n.read ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                <span className={`text-sm font-medium ${!n.read ? "" : "ml-4"}`}>
                  {n.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground ml-4">{n.body}</p>
              <p className="text-xs text-muted-foreground ml-4">
                {n.createdAt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
