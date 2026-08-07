import React, { useState } from "react";
import { UserSupportHome } from "./UserSupportHome";
import { CreateTicketView } from "./CreateTicketView";
import { UserTicketHistoryView } from "./UserTicketHistoryView";
import { UserTicketDetailView } from "./UserTicketDetailView";
import { UserProfile } from "../../types";

interface UserSupportContainerProps {
  currentUser?: UserProfile | null;
  onNavigateHome: () => void;
}

export function UserSupportContainer({ currentUser, onNavigateHome }: UserSupportContainerProps) {
  // Sub-route state: "home" | "new" | "history" | "detail"
  const [subRoute, setSubRoute] = useState<"home" | "new" | "history" | "detail">("home");
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const userEmail = currentUser?.email || "adamuamuhammad8541@gmail.com";
  const userName = currentUser?.fullName || "Adamu A. Muhammad";

  const handleSelectTicket = (ticketId: string) => {
    setActiveTicketId(ticketId);
    setSubRoute("detail");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-8">
      {subRoute === "home" && (
        <UserSupportHome
          onCreateNew={() => setSubRoute("new")}
          onViewHistory={() => setSubRoute("history")}
          onSelectTicket={handleSelectTicket}
          userEmail={userEmail}
        />
      )}

      {subRoute === "new" && (
        <CreateTicketView
          onBack={() => setSubRoute("home")}
          onTicketCreated={(ticketId) => handleSelectTicket(ticketId)}
          userEmail={userEmail}
          userName={userName}
        />
      )}

      {subRoute === "history" && (
        <UserTicketHistoryView
          onBack={() => setSubRoute("home")}
          onCreateNew={() => setSubRoute("new")}
          onSelectTicket={handleSelectTicket}
          userEmail={userEmail}
        />
      )}

      {subRoute === "detail" && activeTicketId && (
        <UserTicketDetailView
          ticketId={activeTicketId}
          onBack={() => setSubRoute("history")}
          userEmail={userEmail}
          userName={userName}
        />
      )}
    </div>
  );
}
