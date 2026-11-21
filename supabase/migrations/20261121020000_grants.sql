-- Хүснэгтийн эрхийг (GRANT) тодорхой өгнө. Үүлэн төсөл шинэ хүснэгтэд эрхийг
-- автоматаар өгдөггүй, дотоод нь бүх эрхийг өгдөг. Хоёуланг нь адил болгож,
-- хэрэгтэй хамгийн бага эрхийг л үлдээнэ. Мөр бүрийн хандалтыг RLS шийднэ.

revoke all on public.students, public.progress, public.login_sessions from anon, authenticated;

-- Нэвтэрсэн хэрэглэгч: students-ийг уншина, явцаа уншиж, тэмдэглэж, буцаана
grant select on public.students to authenticated;
grant select, insert, delete on public.progress to authenticated;

-- Сервер (Edge Function): login-start, login-check
grant select, insert, update, delete on public.students, public.progress, public.login_sessions to service_role;

-- RLS бодлого дотор дуудагдана
revoke execute on function public.is_teacher() from public, anon;
grant execute on function public.is_teacher() to authenticated, service_role;
