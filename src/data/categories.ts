import { Pill, Heart, Eye, Baby, Leaf, Shield, Brain, Stethoscope, Droplets, Wind, Syringe, Thermometer, CircleDot, Tablets, Bandage, FlaskConical, Activity } from "lucide-react";

export interface MedicineCategory {
  id: string;
  nameKey: string;
  icon: any;
}

export const categories: MedicineCategory[] = [
  { id: "analgesic", nameKey: "cat_analgesic", icon: Thermometer },
  { id: "antacid", nameKey: "cat_antacid", icon: Tablets },
  { id: "antibiotic", nameKey: "cat_antibiotic", icon: Syringe },
  { id: "antidiabetic", nameKey: "cat_antidiabetic", icon: Droplets },
  { id: "cardiovascular", nameKey: "cat_cardiovascular", icon: Heart },
  { id: "dermatology", nameKey: "cat_dermatology", icon: Bandage },
  { id: "eye_ent", nameKey: "cat_eye_ent", icon: Eye },
  { id: "vitamins", nameKey: "cat_vitamins", icon: FlaskConical },
  { id: "respiratory", nameKey: "cat_respiratory", icon: Wind },
  { id: "gastrointestinal", nameKey: "cat_gastrointestinal", icon: CircleDot },
  { id: "neurological", nameKey: "cat_neurological", icon: Brain },
  { id: "hormonal", nameKey: "cat_hormonal", icon: Stethoscope },
  { id: "antimalarial", nameKey: "cat_antimalarial", icon: Shield },
  { id: "antiseptic", nameKey: "cat_antiseptic", icon: Droplets },
  { id: "pediatric", nameKey: "cat_pediatric", icon: Baby },
  { id: "herbal", nameKey: "cat_herbal", icon: Leaf },
  { id: "service", nameKey: "cat_service", icon: Activity },
];
