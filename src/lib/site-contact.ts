import { siteConfig } from "@/content/site";
import type { ContactSetting, ThemeSetting } from "./cms-types";

export type SiteContact = {
  phones: { display: string; e164: string }[];
  email: string;
  address: { street: string; district: string; postal: string; city: string; country: string };
  officeHours: string;
  whatsapp: string;
  mapsUrl: string;
  mapsEmbedUrl: string;
  website: string;
};

const toE164 = (display: string) => {
  const digits = display.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+228${digits}`;
};

/** Coordonnées du site : celles saisies dans l'administration remplacent les valeurs par défaut. */
export function mergeContact(c: ContactSetting | undefined): SiteContact {
  const phones = (c?.phones ?? []).map((p) => p.trim()).filter(Boolean);
  const address = {
    street: c?.street || siteConfig.address.street,
    district: c?.district || siteConfig.address.district,
    postal: c?.postal || siteConfig.address.postal,
    city: c?.city || siteConfig.address.city,
    country: c?.country || siteConfig.address.country,
  };
  const query = encodeURIComponent(`${address.street} ${address.district} ${address.city} ${address.country}`);
  return {
    phones: phones.length ? phones.map((display) => ({ display, e164: toE164(display) })) : [...siteConfig.phones],
    email: c?.email || siteConfig.email,
    address,
    officeHours: c?.hours || siteConfig.officeHours,
    whatsapp: c?.whatsapp ? toE164(c.whatsapp) : siteConfig.whatsapp,
    mapsUrl: c?.mapsUrl || (c?.street ? `https://www.google.com/maps/search/?api=1&query=${query}` : siteConfig.mapsUrl),
    mapsEmbedUrl: c?.street ? `https://www.google.com/maps?q=${query}&z=15&output=embed` : siteConfig.mapsEmbedUrl,
    website: c?.website || siteConfig.website,
  };
}

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const shade = (rgb: number[], f: number) => rgb.map((v) => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
const valid = (h?: string) => !!h && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h);

/** Variables CSS des couleurs choisies (vide si aucune personnalisation). */
export function themeCss(t: ThemeSetting | undefined) {
  if (!t) return "";
  const vars: string[] = [];
  if (valid(t.blue)) {
    const b = hexToRgb(t.blue!);
    vars.push(`--av-blue:${b.join(" ")}`, `--av-blue-950:${shade(b, -0.4).join(" ")}`);
  }
  if (valid(t.vif)) {
    const r = hexToRgb(t.vif!);
    vars.push(`--vif:${r.join(" ")}`, `--vif-fonce:${shade(r, -0.2).join(" ")}`, `--vif-clair:${shade(r, 0.25).join(" ")}`);
  }
  if (valid(t.or)) {
    const o = hexToRgb(t.or!);
    vars.push(`--or:${o.join(" ")}`, `--or-clair:${shade(o, 0.3).join(" ")}`);
  }
  if (valid(t.nuit)) vars.push(`--nuit:${hexToRgb(t.nuit!).join(" ")}`);
  return vars.length ? `:root{${vars.join(";")}}` : "";
}
