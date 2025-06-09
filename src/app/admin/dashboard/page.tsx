"use client";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { SurveyWidget, BirthdateWidget } from "../components/widgets";
import { DraggableWidget } from "../components/DraggableWidget";
import { WidgetSelector } from "../components/WidgetSelector";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Plus,
  RefreshCw,
  Save,
  Palette,
  Grid3X3,
  Sparkles,
} from "lucide-react";

// Widget component mapping
const WIDGET_COMPONENTS = {
  SurveyWidget: SurveyWidget,
  BirthdateWidget: BirthdateWidget,
};

export default function Dashboard() {
  const { user, isLoading, error, logout, isAuthenticated } = useAuth();
  const {
    layout,
    isLoading: layoutLoading,
    error: layoutError,
    updateLayout,
    addWidget,
    removeWidget,
    resetToDefault,
  } = useDashboardLayout();

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isWidgetSelectorOpen, setIsWidgetSelectorOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.data.current?.type === "new-widget") {
      // Adding new widget
      const widgetType = active.data.current.widgetType;
      addWidget(widgetType, { row: 0, col: 0, width: 1, height: 1 });
      return;
    }

    if (
      active.data.current?.type === "widget" &&
      over.data.current?.type === "widget"
    ) {
      // Reordering widgets
      const activeIndex = layout.findIndex((item) => item.id === active.id);
      const overIndex = layout.findIndex((item) => item.id === over.id);

      if (activeIndex !== overIndex) {
        const newLayout = arrayMove(layout, activeIndex, overIndex);
        updateLayout(newLayout);
      }
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id.toString());
  }

  // Render widget by type
  function renderWidget(widgetType: string, userProp: any) {
    const WidgetComponent =
      WIDGET_COMPONENTS[widgetType as keyof typeof WIDGET_COMPONENTS];

    if (!WidgetComponent) {
      return (
        <div className="p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-600">
            ویجت &quot;{widgetType}&quot; یافت نشد
          </p>
        </div>
      );
    }

    // Pass user prop to widgets that need it
    if (widgetType === "BirthdateWidget") {
      return <WidgetComponent user={userProp} />;
    }

    return <WidgetComponent user={userProp} />;
  }

  if (isLoading || layoutLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            در حال بارگذاری...
          </p>
        </div>
      </div>
    );
  }

  if (error || layoutError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">خطا: {error || layoutError}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">لطفاً وارد شوید</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto p-6" dir="rtl">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  خوش آمدید، {user.name}!
                </h1>
                <p className="text-gray-600 text-lg">
                  {user.userType === "student"
                    ? "به پنل دانش‌آموزی خود خوش آمدید"
                    : user.userType === "teacher"
                    ? "به پنل آموزشی خود خوش آمدید"
                    : "به پنل مدیریتی خود خوش آمدید"}
                </p>
              </div>

              {/* Customization Controls */}
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => setIsCustomizing(!isCustomizing)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${
                      isCustomizing
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isCustomizing ? (
                    <>
                      <Save className="h-4 w-4" />
                      ذخیره
                    </>
                  ) : (
                    <>
                      <Palette className="h-4 w-4" />
                      شخصی‌سازی
                    </>
                  )}
                </motion.button>

                {isCustomizing && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                  >
                    <motion.button
                      onClick={() => setIsWidgetSelectorOpen(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="h-4 w-4" />
                      ویجت
                    </motion.button>

                    <motion.button
                      onClick={resetToDefault}
                      className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      بازنشانی
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                <p className="text-blue-600 font-medium text-sm">نوع کاربر</p>
                <p className="text-blue-800 font-bold text-lg">
                  {user.userType}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                <p className="text-green-600 font-medium text-sm">نام کاربری</p>
                <p className="text-green-800 font-bold text-lg">
                  {user.username}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-200">
                <p className="text-purple-600 font-medium text-sm">نقش</p>
                <p className="text-purple-800 font-bold text-lg">{user.role}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
                <p className="text-orange-600 font-medium text-sm">نام</p>
                <p className="text-orange-800 font-bold text-lg">{user.name}</p>
              </div>
            </div>
          </div>

          {/* Customization Mode Indicator */}
          <AnimatePresence>
            {isCustomizing && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg mb-6 shadow-lg"
              >
                <div className="flex items-center justify-center gap-3">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">
                    حالت شخصی‌سازی فعال است - ویجت‌ها را بکشید و رها کنید
                  </span>
                  <Grid3X3 className="h-5 w-5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Grid */}
          <SortableContext
            items={layout.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            <div
              className={`
              grid gap-6 mb-6 transition-all duration-300
              ${
                isCustomizing
                  ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1 lg:grid-cols-3"
              }
            `}
            >
              <AnimatePresence mode="popLayout">
                {layout.map((widget) => (
                  <DraggableWidget
                    key={widget.id}
                    widget={widget}
                    isCustomizing={isCustomizing}
                    onRemove={removeWidget}
                  >
                    {renderWidget(widget.widgetType, user)}
                  </DraggableWidget>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>

          {/* Drop Zone for Empty Dashboard */}
          {layout.length === 0 && isCustomizing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-white/50 backdrop-blur-sm"
            >
              <div className="text-gray-400 mb-4">
                <Grid3X3 className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                داشبورد خالی
              </h3>
              <p className="text-gray-500 mb-4">
                برای شروع، ویجت‌هایی از منوی سمت چپ اضافه کنید
              </p>
              <motion.button
                onClick={() => setIsWidgetSelectorOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="h-5 w-5 inline ml-2" />
                اضافه کردن ویجت
              </motion.button>
            </motion.div>
          )}

          <div className="text-center">
            <button
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200"
            >
              خروج از حساب
            </button>
          </div>
        </div>

        {/* Widget Selector Sliding Panel */}
        <WidgetSelector
          isOpen={isWidgetSelectorOpen}
          onClose={() => setIsWidgetSelectorOpen(false)}
        />

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="opacity-90 transform rotate-6 shadow-2xl">
              {layout.find((w) => w.id === activeId) &&
                renderWidget(
                  layout.find((w) => w.id === activeId)!.widgetType,
                  user
                )}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
