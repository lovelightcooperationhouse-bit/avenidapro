"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getAcademicYears, getCurrentAcademicYear, type AcademicYear } from "@/lib/academic-data";

interface SchoolYearContextType {
  /** L'année scolaire actuellement sélectionnée (ex: "2026-2027") */
  selectedYear: string;
  /** Label formaté (ex: "2026 - 2027") */
  selectedYearLabel: string;
  /** Toutes les années disponibles */
  availableYears: AcademicYear[];
  /** Changer l'année scolaire affichée */
  setSelectedYear: (year: string) => void;
  /** Date / heure actuelle mise à jour en temps réel */
  currentDateTime: Date;
}

const SchoolYearContext = createContext<SchoolYearContextType | undefined>(undefined);

export function SchoolYearProvider({ children }: { children: ReactNode }) {
  const availableYears = getAcademicYears();
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Mise à jour de la date/heure toutes les 60 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const selectedYearLabel =
    availableYears.find((y) => y.value === selectedYear)?.label || selectedYear;

  return (
    <SchoolYearContext.Provider
      value={{
        selectedYear,
        selectedYearLabel,
        availableYears,
        setSelectedYear,
        currentDateTime,
      }}
    >
      {children}
    </SchoolYearContext.Provider>
  );
}

export function useSchoolYear() {
  const ctx = useContext(SchoolYearContext);
  if (!ctx) {
    throw new Error("useSchoolYear must be used within a SchoolYearProvider");
  }
  return ctx;
}
