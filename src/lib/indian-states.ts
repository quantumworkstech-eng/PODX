/** Indian states & UTs for studio location dropdowns (aligned with Google administrative_area_level_1 where possible). */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Chandigarh",
  "Puducherry",
] as const;

export function matchIndianStateList(suggested: string, list: readonly string[]): string {
  const s = suggested.trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  const exact = list.find((x) => x.toLowerCase() === lower);
  if (exact) return exact;
  const contains = list.find(
    (x) => lower.includes(x.toLowerCase()) || x.toLowerCase().includes(lower)
  );
  return contains || s;
}
