'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, CheckCircle, LineChart, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingCard() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-40" />
      </CardContent>
    </Card>
  );
}

export function DashboardHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        Welcome to your dashboard. Use the sidebar to navigate and the button above to toggle light/dark mode.
      </p>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="relative p-1 h-auto bg-muted/50 backdrop-blur-sm border border-border/50 rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md" />
          <TabsTrigger 
            value="overview" 
            className="relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
          >
            <span className="relative z-10">Overview</span>
            <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300" />
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
          >
            <span className="relative z-10">Analytics</span>
            <span className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-secondary/10 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300" />
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
          >
            <span className="relative z-10">Reports</span>
            <span className="absolute inset-0 bg-gradient-to-r from-accent/5 to-accent/10 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300" />
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/50"
          >
            <span className="relative z-10">Notifications</span>
            <span className="absolute inset-0 bg-gradient-to-r from-muted-foreground/5 to-muted-foreground/10 opacity-0 group-hover:opacity-100 rounded-md transition-opacity duration-300" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 border border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  Total Users
                </CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Users className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-colors">
                  1,234
                </div>
                <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10 hover:-translate-y-1 border border-border/50 hover:border-secondary/20 bg-card/50 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  Active Tasks
                </CardTitle>
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary-foreground group-hover:bg-secondary/20 transition-colors">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-secondary group-hover:to-secondary/80 transition-colors">
                  27
                </div>
                <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  3 due today
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-accent/10 hover:-translate-y-1 border border-border/50 hover:border-accent/20 bg-card/50 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  Revenue
                </CardTitle>
                <div className="p-2 rounded-lg bg-accent/10 text-accent-foreground group-hover:bg-accent/20 transition-colors">
                  <LineChart className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-accent group-hover:to-accent/80 transition-colors">
                  $24,345
                </div>
                <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  +5.2% from last week
                </p>
              </CardContent>
            </Card>
            
            <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-muted-foreground/10 hover:-translate-y-1 border border-border/50 hover:border-muted-foreground/20 bg-card/50 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/5 to-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  Active Projects
                </CardTitle>
                <div className="p-2 rounded-lg bg-muted-foreground/10 text-muted-foreground group-hover:bg-muted-foreground/20 transition-colors">
                  <BarChart className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-muted-foreground group-hover:to-muted-foreground/80 transition-colors">
                  12
                </div>
                <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                  2 launching this week
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>Your team's performance metrics for the past 30 days</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center rounded-md border border-dashed p-4">
                  <p className="text-sm text-muted-foreground">Performance chart will appear here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest team activities and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          New team member added
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {i === 1 ? '5 minutes ago' : i === 2 ? '2 hours ago' : i === 3 ? 'Yesterday' : '3 days ago'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-4">
            <LoadingCard />
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid gap-4">
            <LoadingCard />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="grid gap-4">
            <LoadingCard />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
