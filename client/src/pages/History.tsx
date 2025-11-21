import { useInventoryStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Activity, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HistoryPage() {
  const { history, clearHistory } = useInventoryStore();

  return (
    <div className="p-8 space-y-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
            <p className="text-muted-foreground">Track all system changes and updates</p>
        </div>
        <Button variant="outline" onClick={clearHistory} disabled={history.length === 0}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear History
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col border-l-4 border-l-primary/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Actions
            </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full px-6 pb-6">
                {history.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        No activity recorded yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((entry) => (
                            <div key={entry.id} className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={
                                            entry.action === 'create' ? 'text-green-600 border-green-200 bg-green-50' :
                                            entry.action === 'delete' ? 'text-red-600 border-red-200 bg-red-50' :
                                            entry.action === 'update' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                                            'text-gray-600'
                                        }>
                                            {entry.action.toUpperCase()}
                                        </Badge>
                                        <span className="font-medium text-sm">{entry.user}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(new Date(entry.timestamp), "MMM d, yyyy HH:mm")}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
