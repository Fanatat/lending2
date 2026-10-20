"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { YANDEX_METRIKA_ID } from "@/lib/site";

type Ym = (id: number, method: string, ...args: unknown[]) => void;

/**
 * Yandex Metrica for the site itself. Off until YANDEX_METRIKA_ID is set.
 * The counter starts with `defer: true` and page views are sent by hand,
 * because moving between pages doesn't reload the document and Metrica
 * wouldn't see it on its own.
 */
export default function YandexMetrika() {
  const pathname = usePathname();
  const firstView = useRef(true);

  // The first view is sent by the snippet below; this covers the rest.
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    if (!YANDEX_METRIKA_ID) return;
    const ym = (window as unknown as { ym?: Ym }).ym;
    ym?.(YANDEX_METRIKA_ID, "hit", window.location.href, { referer: document.referrer });
  }, [pathname]);

  if (!YANDEX_METRIKA_ID) return null;

  return (
    <Script id="yandex-metrika" strategy="afterInteractive">
      {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
ym(${YANDEX_METRIKA_ID},"init",{defer:true,clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
ym(${YANDEX_METRIKA_ID},"hit",window.location.href,{referer:document.referrer});`}
    </Script>
  );
}
