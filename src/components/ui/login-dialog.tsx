"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { CheckCircle2, School, UserRound, BookOpenCheck } from "lucide-react";

const formSchema = z.object({
  userType: z.enum(["school", "teacher", "student"], {
    required_error: "نوع کاربر را انتخاب کنید",
  }),
  schoolCode: z.string().min(1, {
    message: "کد مدرسه الزامی است",
  }),
  username: z.string().min(1, {
    message: "نام کاربری الزامی است",
  }),
  password: z.string().min(1, {
    message: "رمز عبور الزامی است",
  }),
});

type FormValues = z.infer<typeof formSchema>;

// UserType box component
const UserTypeBox = ({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) => (
  <motion.div
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`relative cursor-pointer rounded-lg p-4 overflow-hidden transition-all duration-300 ${
      selected
        ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/20 border-blue-400 text-white"
        : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
    } border-2 flex flex-col items-center justify-center gap-2`}
  >
    <div className={`text-2xl ${selected ? "text-white" : "text-blue-500"}`}>
      {icon}
    </div>
    <div className="text-sm font-medium">{label}</div>
    {selected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute top-1 right-1"
      >
        <CheckCircle2 className="h-4 w-4 text-white" />
      </motion.div>
    )}
  </motion.div>
);

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (credentials: FormValues) => Promise<void>;
}

export function LoginDialog({ open, onOpenChange, onLogin }: LoginDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userType: "school",
      schoolCode: "",
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setError(null);

    try {
      await onLogin(values);
      // Note: Will redirect to dashboard after successful login, so we don't need to reset form or close dialog
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در ورود به سیستم");
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">افزودن کاربر جدید</DialogTitle>
          <DialogDescription className="text-right">
            اطلاعات کاربر جدید را وارد کنید تا بتوانید بین حساب‌های مختلف جابجا
            شوید
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-center block text-sm font-medium text-gray-700">
                    انتخاب نوع کاربر
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-2">
                      <UserTypeBox
                        label="مدرسه"
                        icon={<School />}
                        selected={field.value === "school"}
                        onClick={() => field.onChange("school")}
                      />
                      <UserTypeBox
                        label="معلم"
                        icon={<UserRound />}
                        selected={field.value === "teacher"}
                        onClick={() => field.onChange("teacher")}
                      />
                      <UserTypeBox
                        label="دانش آموز"
                        icon={<BookOpenCheck />}
                        selected={field.value === "student"}
                        onClick={() => field.onChange("student")}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schoolCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">کد مدرسه</FormLabel>
                  <FormControl>
                    <Input
                      dir="ltr"
                      placeholder="کد مدرسه خود را وارد کنید"
                      className="bg-white border-gray-200 focus:border-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">نام کاربری</FormLabel>
                  <FormControl>
                    <Input
                      dir="ltr"
                      placeholder="نام کاربری خود را وارد کنید"
                      className="bg-white border-gray-200 focus:border-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">رمز عبور</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="رمز عبور خود را وارد کنید"
                      className="bg-white border-gray-200 focus:border-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? "در حال ورود..." : "ورود"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
