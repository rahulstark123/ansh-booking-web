export type ContactTag = "VIP" | "Warm" | "Trial" | "No meetings";

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  linkedin: string;
  timezone: string;
  country: string;
  city: string;
  state: string;
  pincode: string;
  owner: string;
  tag: ContactTag;
  lastMeeting: string;
  nextMeeting: string;
  notes: string;
};

export type FilterId = "all" | ContactTag;

export type ContactForm = {
  name: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  jobTitle: string;
  company: string;
  linkedin: string;
  timezone: string;
  country: string;
  city: string;
  state: string;
  pincode: string;
};

export const EMPTY_CONTACT_FORM: ContactForm = {
  name: "",
  email: "",
  phoneCountryCode: "+91",
  phoneNumber: "",
  jobTitle: "",
  company: "",
  linkedin: "",
  timezone: "",
  country: "",
  city: "",
  state: "",
  pincode: "",
};

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Aarav Sharma",
    email: "aarav@northstar.io",
    phone: "+91 98100 23011",
    jobTitle: "Head of Growth",
    company: "Northstar Labs",
    linkedin: "linkedin.com/in/aarav-sharma",
    timezone: "Asia/Kolkata",
    country: "India",
    city: "Delhi",
    state: "Delhi",
    pincode: "110001",
    owner: "Ansh",
    tag: "VIP",
    lastMeeting: "Apr 08, 2026",
    nextMeeting: "Apr 12, 2026",
    notes: "Interested in annual plan, asked for team onboarding support.",
  },
  {
    id: "c2",
    name: "Neha Verma",
    email: "neha@growthverse.in",
    phone: "+91 98211 78342",
    jobTitle: "Marketing Director",
    company: "Growthverse",
    linkedin: "linkedin.com/in/neha-verma",
    timezone: "Asia/Kolkata",
    country: "India",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    owner: "Ansh",
    tag: "Warm",
    lastMeeting: "Apr 05, 2026",
    nextMeeting: "Apr 14, 2026",
    notes: "Prefers weekday slots after 4 PM, very responsive on email.",
  },
  {
    id: "c3",
    name: "Rohan Patel",
    email: "rohan@pixelcraft.co",
    phone: "+91 98901 49877",
    jobTitle: "Operations Lead",
    company: "PixelCraft",
    linkedin: "linkedin.com/in/rohan-patel",
    timezone: "Asia/Kolkata",
    country: "India",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380001",
    owner: "Ops Team",
    tag: "Trial",
    lastMeeting: "Apr 02, 2026",
    nextMeeting: "-",
    notes: "In trial phase, evaluating round robin setup for sales reps.",
  },
  {
    id: "c4",
    name: "Meera Iyer",
    email: "meera@zenline.ai",
    phone: "+91 98771 22914",
    jobTitle: "",
    company: "Zenline",
    linkedin: "",
    timezone: "",
    country: "India",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    owner: "Ansh",
    tag: "No meetings",
    lastMeeting: "-",
    nextMeeting: "-",
    notes: "Imported contact. No bookings yet.",
  },
];
