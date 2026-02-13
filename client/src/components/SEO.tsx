import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  keywords?: string;
}

/**
 * SEO Component for managing meta tags dynamically
 * Handles Open Graph, Twitter Cards, and standard meta tags
 */
export default function SEO({
  title = "المستشفى السعودي الألماني - صنعاء | احجز موعدك الآن",
  description = "احجز موعدك مع أفضل الأطباء في المستشفى السعودي الألماني بصنعاء. خدمات طبية متميزة، عروض خاصة، ومخيمات صحية مجانية. اتصل الآن: 8000018",
  image = "/assets/og-image.jpg",
  url,
  type = "website",
  keywords = "المستشفى السعودي الألماني, صنعاء, حجز موعد, أطباء, عروض طبية, مخيمات صحية, استشارات طبية",
}: SEOProps) {
  const currentUrl = url || `https://sghsanaa.net${window.location.pathname}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, content: string, attribute: string = "content") => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        const [attr, value] = selector.match(/\[(.+?)=['"](.+?)['"]\]/)?.slice(1, 3) || [];
        if (attr && value) {
          element.setAttribute(attr, value);
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, content);
    };

    // Standard meta tags
    updateMetaTag('meta[name="description"]', description);
    updateMetaTag('meta[name="keywords"]', keywords);

    // Open Graph tags
    updateMetaTag('meta[property="og:title"]', title);
    updateMetaTag('meta[property="og:description"]', description);
    updateMetaTag('meta[property="og:image"]', image);
    updateMetaTag('meta[property="og:url"]', currentUrl);
    updateMetaTag('meta[property="og:type"]', type);
    updateMetaTag('meta[property="og:site_name"]', "المستشفى السعودي الألماني - صنعاء");
    updateMetaTag('meta[property="og:locale"]', "ar_YE");

    // Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', "summary_large_image");
    updateMetaTag('meta[name="twitter:title"]', title);
    updateMetaTag('meta[name="twitter:description"]', description);
    updateMetaTag('meta[name="twitter:image"]', image);

    // WhatsApp specific (uses Open Graph)
    updateMetaTag('meta[property="og:image:width"]', "1200");
    updateMetaTag('meta[property="og:image:height"]', "630");
  }, [title, description, image, currentUrl, type, keywords]);

  return null; // This component doesn't render anything
}
