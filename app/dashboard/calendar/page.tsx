"use client"

import { Calendar, Clock, MapPin, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function CalendarPage() {
  const upcomingEvents = [
    {
      id: 1,
      title: "Team Meeting",
      time: "9:00 AM - 10:00 AM",
      date: "Today",
      location: "Conference Room A",
      attendees: 5,
      type: "meeting"
    },
    {
      id: 2,
      title: "Project Review",
      time: "2:00 PM - 3:30 PM", 
      date: "Today",
      location: "Online",
      attendees: 8,
      type: "review"
    },
    {
      id: 3,
      title: "Client Presentation",
      time: "10:00 AM - 11:30 AM",
      date: "Tomorrow", 
      location: "Client Office",
      attendees: 3,
      type: "presentation"
    }
  ]

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting": return "default"
      case "review": return "secondary"
      case "presentation": return "outline"
      default: return "secondary"
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your schedule and upcoming events
          </p>
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl">28</CardTitle>
            <CardDescription>September 2025</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 meetings, 1 presentation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Total events scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>
            Your next scheduled events and meetings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{event.title}</h4>
                  <Badge variant={getEventTypeColor(event.type)}>
                    {event.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.attendees} attendees
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {event.date}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}