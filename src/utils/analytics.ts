declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (typeof window === "undefined" || !gaId) return;
  if (window.self !== window.top) return;

  // Disable analytics in development or staging/Cloud Run preview URLs to prevent Script Error issues
  if (
    import.meta.env.DEV || 
    window.location.hostname.includes("localhost") || 
    window.location.hostname.includes(".run.app")
  ) {
    return;
  }

  // Prevent duplicate insertion
  if (document.getElementById("google-tag-manager")) return;

  if (gaId.startsWith("GTM-")) {
    // Google Tag Manager
    const script = document.createElement("script");
    script.id = "google-tag-manager";
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gaId}');
    `;
    document.head.appendChild(script);
  } else {
    // Standard Google Analytics
    const script1 = document.createElement("script");
    script1.id = "google-tag-manager";
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', '${gaId}', {
        send_page_view: false
      });
    `;
    document.head.appendChild(script2);
  }
};

export const trackPageView = (path: string) => {
  if (typeof window === "undefined" || !gaId) return;
  if (window.self !== window.top) return;

  if (gaId.startsWith("GTM-")) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "pageview",
      page_path: path,
    });
  } else if (window.gtag) {
    window.gtag("config", gaId, {
      page_path: path,
    });
  }
};

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window === "undefined") return;
  if (window.self !== window.top) return;

  if (gaId && gaId.startsWith("GTM-")) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "custom_event",
      event_action: action,
      event_category: category,
      event_label: label,
      value: value,
    });
  } else if (window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
