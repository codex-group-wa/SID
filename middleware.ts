import { NextResponse } from "next/server";

export function middleware(req: Request) {
    // Check the Host header, if SID_ALLOWED_HOSTS is set
    const host = req.headers.get("host");
    //console.log(host)

    const port = process.env.PORT || 3000;
    //console.log(port)

    let allowedHosts = [`localhost:${port}`, `127.0.0.1:${port}`];
    const allowAll = process.env.SID_ALLOWED_HOSTS === "*";
    if (process.env.SID_ALLOWED_HOSTS) {
        allowedHosts = allowedHosts.concat(process.env.SID_ALLOWED_HOSTS.split(","));
    }
    if (!allowAll && (!host || !allowedHosts.includes(host))) {
        // eslint-disable-next-line no-console
        console.error(
            `Host validation failed for: ${host}. Hint: Set the SID_ALLOWED_HOSTS environment variable to allow requests from this host / port.`,
        );
        return NextResponse.json({ error: "Host validation failed. See logs for more details." }, { status: 400 });
    }
    return NextResponse.next();
}

export const config = {
    matcher: "/:path*",
};