export { auth as middleware } from "@/auth"

export const config = {
  matcher: ["/dashboard/:path*", "/api/organisations/:path*", "/settings/:path*", "/api/settings/:path*", "/instructies/:path*"],
}
