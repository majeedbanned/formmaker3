"use client";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import {
  SurveyWidget,
  BirthdateWidget,
  StudentsSearchWidget,
  FormsWidget,
} from "../components/widgets";
import StudentSearchWidget from "../components/StudentSearchWidget";
import { DraggableWidget } from "../components/DraggableWidget";
import { WidgetSelector } from "../components/WidgetSelector";
import OnboardingStatus from "@/components/OnboardingStatus";
import AnnouncementProvider from "@/components/AnnouncementProvider";
import { useState, useEffect, useRef, Suspense } from "react";
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
  QrCode,
  X,
  Smartphone,
} from "lucide-react";
import QRCode from "qrcode";
import { useSearchParams } from "next/navigation";

// Widget component mapping
const WIDGET_COMPONENTS = {
  SurveyWidget: SurveyWidget,
  BirthdateWidget: BirthdateWidget,
  StudentsSearchWidget: StudentsSearchWidget,
  FormsWidget: FormsWidget,
};

function DashboardContent() {
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

  const searchParams = useSearchParams();
  const showQR = searchParams.get('qr') !== null;

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isWidgetSelectorOpen, setIsWidgetSelectorOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOnboardingMinimized, setIsOnboardingMinimized] = useState(false);
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string>("");
  const [hasPassword, setHasPassword] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch password from database and generate QR Code (only when ?qr param is present)
  useEffect(() => {
    const fetchPasswordAndGenerateQR = async () => {
      if (!user ) return;

      try {
        // Fetch password from database
        const response = await fetch('/api/user/password');
        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error('Failed to fetch password:', data.message);
          return;
        }

        const password = data.password;
        setHasPassword(!!password);
        
        const currentDomain = (user as any).domain || window.location.hostname;
        
        const qrData = JSON.stringify({
          domain: currentDomain,
          userType: user.userType,
          role: user.role,
          username: user.username,
          schoolCode: user.schoolCode,
          password: password,
        });

        // console.log('Generating QR code with data:', {
        //   domain: currentDomain,
        //   userType: user.userType,
        //   username: user.username,
        //   schoolCode: user.schoolCode,
        //   hasPassword: !!password,
        //   passwordLength: password?.length || 0,
        // });

        // Generate QR code
        const url = await QRCode.toDataURL(qrData, {
          width: 500,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        // console.log('QR Code generated successfully');
        setQRCodeDataURL(url);
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    };

    fetchPasswordAndGenerateQR();
  }, [user]);

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
    // eslint-disable-line @typescript-eslint/no-explicit-any
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
      <div className="min-h-screen ">
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

          {/* QR Code Login Widget - Only when ?qr query param is present */}
          {true && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200"
            >
            <div className="flex items-start gap-6">
              {/* QR Code Display */}
              <div className="flex-shrink-0">
                <div className="bg-white rounded-xl p-4 shadow-md border-2 border-green-300">
                  {qrCodeDataURL ? (
                    <motion.img
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      src={qrCodeDataURL}
                      alt="QR Code for Quick Login"
                      className="w-48 h-48 rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent mx-auto mb-2"></div>
                        <p className="text-xs text-gray-500">در حال ایجاد QR...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Information and Instructions */}
              <div className="flex-1 text-right">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md">
                    <QrCode className="h-5 w-5" />
                    <span className="font-bold">ورود سریع به اپلیکیشن</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-4 border border-green-200">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-3 text-base">
                        برای ورود آسان به اپلیکیشن:
                      </h3>
                      <ol className="text-sm text-gray-700 space-y-2">
                      <li className="flex items-start gap-2">
                          <span className="font-bold text-green-600">۱.</span>
                          <span>اپلیکیشن <a style={{ color: '#2563eb', textDecoration: 'underline' }} href="https://farsamooz.ir/uploads/parsamooz-latest.apk" target="_blank" rel="noopener noreferrer">پارس آموز</a> را دانلود کنید</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-green-600">۲.</span>
                          <span>اپلیکیشن پارس آموز را باز کنید</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-green-600">۳.</span>
                          <span>روی گزینه &quot;ورود با QR Code&quot; کلیک کنید</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-bold text-green-600">۴.</span>
                          <span className="font-semibold text-green-700">این کد را اسکن کنید و وارد شوید!</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* User Info Display */}
                {/* <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-200">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 mb-1">🌐 دامنه</p>
                      <p className="font-semibold text-gray-800">
                        {(user as any)?.domain || window.location.hostname}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">👤 کاربر</p>
                      <p className="font-semibold text-gray-800">
                        {user?.userType}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">🔑 نام کاربری</p>
                      <p className="font-semibold text-gray-800">
                        {user?.username}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">🔐 رمز عبور</p>
                      <p className={`font-semibold ${hasPassword ? 'text-green-700' : 'text-red-600'}`}>
                        {hasPassword ? '✓ در QR موجود' : '✗ موجود نیست'}
                      </p>
                    </div>
                  </div>
                </div> */}

                {/* Security Warning */}
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800 text-center font-semibold">
                    ⚠️ این QR Code شامل اطلاعات کامل ورود شماست (شامل رمز عبور). از اشتراک‌گذاری آن خودداری کنید!
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          )}

          {/* Student Search for School Users */}
          {user.userType === "school" && (
            <div className="mb-6">
              <StudentSearchWidget />
            </div>
          )}

          {/* Forms Section for Students - Always Visible */}
          {user.userType === "student" && (
            <div className="mb-6">
              <FormsWidget />
            </div>
          )}

          {/* Onboarding Status for School Users */}
          {user.userType === "school" && (
            <OnboardingStatus
              isMinimized={isOnboardingMinimized}
              onToggleMinimize={() => setIsOnboardingMinimized(!isOnboardingMinimized)}
            />
          )}

          {/* Debug: Show user type */}
          {/* {process.env.NODE_ENV === "development" && (
            <div className="bg-yellow-100 p-2 rounded mb-4 text-sm">
              Debug: User Type = {user.userType}, Username = {user.username}
            </div>
          )} */}

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

export default function Dashboard() {
  return (
    <>
      <AnnouncementProvider />
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-lg font-medium text-gray-700">
              در حال بارگذاری...
            </p>
          </div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </>
  );
}
