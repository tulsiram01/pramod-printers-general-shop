export interface Design {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
}

export const CATEGORIES = ["सभी", "शादी कार्ड", "भागवत", "जन्मदिन", "गृह प्रवेश", "अन्य"] as const;
export type Category = typeof CATEGORIES[number];

export function normalizeCategory(value: string): string {
  const key = value.trim().toLowerCase();
  const map: Record<string, string> = {
    wedding: "शादी कार्ड", "शादी कार्ड": "शादी कार्ड",
    bhagwat: "भागवत", "bhagwat katha": "भागवत", "भागवत": "भागवत",
    birthday: "जन्मदिन", "जन्मदिन": "जन्मदिन",
    housewarming: "गृह प्रवेश", "griha pravesh": "गृह प्रवेश", "गृह प्रवेश": "गृह प्रवेश",
    other: "अन्य", "अन्य": "अन्य",
  };
  return map[key] ?? (value || "अन्य");
}

export function imageUrl(value: string): string {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (url.hostname === "drive.google.com") {
      const parts = url.pathname.split("/");
      const id = (parts[1] === "file" && parts[2] === "d" ? parts[3] : "") || url.searchParams.get("id") || "";
      if (!/^[a-zA-Z0-9_-]{10,}$/.test(id)) return "";
      return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`;
    }
    return url.href;
  } catch { return ""; }
}
