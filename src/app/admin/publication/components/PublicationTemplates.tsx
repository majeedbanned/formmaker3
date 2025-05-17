"use client";

import { useState, useEffect } from "react";
import { TemplateData } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Edit, Eye, FileText, Loader2, Search, Trash2 } from "lucide-react";

interface PublicationTemplatesProps {
  user: {
    id: string;
    userType: string;
    schoolCode: string;
  };
  onSelectTemplate: (template: TemplateData) => void;
}

export default function PublicationTemplates({
  user,
  onSelectTemplate,
}: PublicationTemplatesProps) {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(
    null
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateData[]>(
    []
  );
  const [currentFilter, setCurrentFilter] = useState<"all" | "my">("all");

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, [user]);

  // Filter templates when search term changes
  useEffect(() => {
    if (templates.length === 0) {
      setFilteredTemplates([]);
      return;
    }

    const filtered = templates.filter((template) => {
      // First apply user filter
      const passesUserFilter =
        currentFilter === "all" || template.creatorId === user.id;

      // Then apply search filter
      const passesSearch =
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      return passesUserFilter && passesSearch;
    });

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, currentFilter, user.id]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/formbuilder/publication-templates?schoolCode=${user.schoolCode}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      console.log("Fetched templates:", data.templates);

      // Add a check to ensure each template has an id
      if (data.templates && data.templates.length > 0) {
        const firstTemplate = data.templates[0];
        console.log("First template:", firstTemplate);
        console.log(
          "First template ID:",
          firstTemplate.id,
          "Type:",
          typeof firstTemplate.id
        );

        // Map templates to ensure they have proper id field
        const processedTemplates = data.templates.map(
          (template: Partial<TemplateData> & { _id?: string }) => {
            // Make sure template has a proper id or _id property
            if (!template.id && template._id) {
              console.log("Converting _id to id for template:", template._id);
              return { ...template, id: template._id };
            }
            return template;
          }
        );

        setTemplates(processedTemplates);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("خطا در دریافت قالب‌ها");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(
        `/api/formbuilder/publication-templates/${selectedTemplate.id}`,
        {
          method: "DELETE",
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete template");
      }

      toast.success("قالب با موفقیت حذف شد");
      setIsDeleteDialogOpen(false);

      // Update the templates list
      setTemplates((prev) => prev.filter((t) => t.id !== selectedTemplate.id));
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("خطا در حذف قالب");
    }
  };

  const handleTemplateSelect = (template: TemplateData) => {
    console.log("Selecting template:", template);
    console.log("Template ID:", template.id);

    // Ensure template has a valid ID
    if (!template.id) {
      console.error("Template is missing ID:", template);
      toast.error("خطا در انتخاب قالب: شناسه قالب نامعتبر است");
      return;
    }

    setSelectedTemplate(template);
    onSelectTemplate(template);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="جستجو در قالب‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-right"
            dir="rtl"
          />
        </div>

        <Tabs
          value={currentFilter}
          onValueChange={(v) => setCurrentFilter(v as "all" | "my")}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">همه قالب‌ها</TabsTrigger>
            <TabsTrigger value="my">قالب‌های من</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">
            قالبی یافت نشد
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            {searchTerm
              ? "قالبی با معیارهای جستجوی شما یافت نشد. معیارهای جستجو را تغییر دهید."
              : "هنوز قالبی ایجاد نشده است. با استفاده از بخش «نامه جدید» می‌توانید قالب‌های خود را ایجاد کنید."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="pb-3 text-right">
                <CardTitle className="text-xl">{template.title}</CardTitle>
                <CardDescription>
                  {template.description || "بدون توضیحات"}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-right">
                <div className="text-xs text-gray-500 mb-4">
                  ایجاد شده در {formatDate(template.createdAt)}
                </div>
                <div className="truncate h-12 text-sm opacity-70 overflow-hidden">
                  {template.content.replace(/<[^>]*>?/gm, "")}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsPreviewOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    پیش‌نمایش
                  </Button>

                  {template.creatorId === user.id && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log(
                            "Edit button clicked for template:",
                            template
                          );
                          console.log("Template ID:", template.id);

                          // Ensure template has all necessary data for editing
                          if (!template.id) {
                            console.error("Cannot edit template without ID");
                            toast.error(
                              "خطا: قالب انتخاب شده دارای شناسه نامعتبر است"
                            );
                            return;
                          }

                          setSelectedTemplate(template);
                          handleTemplateSelect(template);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        ویرایش
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        حذف
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  استفاده
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>پیش‌نمایش قالب</DialogTitle>
            <DialogDescription>
              قالب &quot;{selectedTemplate?.title}&quot; ایجاد شده در{" "}
              {selectedTemplate && formatDate(selectedTemplate.createdAt)}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] mt-4 border rounded-md p-4">
            <div className="text-right">
              <h3 className="text-xl font-bold mb-4">
                {selectedTemplate?.title}
              </h3>
              <div
                dangerouslySetInnerHTML={{
                  __html: selectedTemplate?.content || "",
                }}
                className="prose prose-sm max-w-none"
              />
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              بستن
            </Button>
            <Button
              onClick={() => {
                if (selectedTemplate) {
                  handleTemplateSelect(selectedTemplate);
                  setIsPreviewOpen(false);
                }
              }}
            >
              استفاده از این قالب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تایید حذف</DialogTitle>
            <DialogDescription>
              آیا از حذف قالب &quot;{selectedTemplate?.title}&quot; اطمینان
              دارید؟ این عملیات قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
