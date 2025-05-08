import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getNotifications } from "@/app/actions/notification-actions"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const notifications = await getNotifications()

  return (
    <div className="flex flex-col gap-4 md:gap-8 pt-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground">No notifications found.</p>
            ) : (
              notifications.map((notification, index) => (
                <div key={index} className="flex items-start border-b pb-4 last:border-0">
                  <div className="mr-4 mt-0.5">
                    <Badge variant="outline" className="h-2 w-2 rounded-full bg-blue-500 p-0" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
