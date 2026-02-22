import DashboardLayout from "@/components/DashboardLayout";
import TasksSection from "@/components/TasksSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export default function TasksPage() {
  return (
    <DashboardLayout
      pageTitle="المهام"
      pageDescription="عرض وإدارة جميع المهام من كل الأقسام"
    >
      <div className="container mx-auto py-6 space-y-6" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              جميع المهام
            </CardTitle>
            <CardDescription>
              عرض وإدارة جميع المهام من كل الأقسام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TasksSection 
              entityType="all"
              entityId={0}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
