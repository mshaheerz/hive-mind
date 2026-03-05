/* Dummy data used across the site */
window.DUMMY_DATA = {
  users: [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin", status: "active" },
    { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Editor", status: "inactive" },
    { id: 3, name: "Carol White", email: "carol@example.com", role: "Viewer", status: "active" },
    { id: 4, name: "David Brown", email: "david@example.com", role: "Editor", status: "pending" },
    { id: 5, name: "Eve Davis", email: "eve@example.com", role: "Admin", status: "active" },
    { id: 6, name: "Frank Miller", email: "frank@example.com", role: "Viewer", status: "inactive" },
    { id: 7, name: "Grace Lee", email: "grace@example.com", role: "Editor", status: "active" },
    { id: 8, name: "Henry Wilson", email: "henry@example.com", role: "Viewer", status: "pending" },
    { id: 9, name: "Ivy Clark", email: "ivy@example.com", role: "Admin", status: "active" },
    { id: 10, name: "Jack Turner", email: "jack@example.com", role: "Editor", status: "active" }
  ],
  activities: [
    { time: "2026-03-01 09:12", action: "Logged in", user: "Alice Johnson" },
    { time: "2026-03-01 10:05", action: "Created a new project", user: "Bob Smith" },
    { time: "2026-03-01 11:30", action: "Updated settings", user: "Carol White" },
    { time: "2026-03-01 13:45", action: "Deleted a file", user: "David Brown" },
    { time: "2026-03-01 15:20", action: "Commented on ticket #42", user: "Eve Davis" }
  ],
  stats: {
    users: 124,
    activeSessions: 27,
    projects: 58,
    ticketsOpen: 13
  }
};
