import { redirect } from 'next/navigation';

export default function NotificationSendRedirect() {
  // Redirect to the new notification page
  redirect('/admin/sendnotif2');
}
