'use client'

import React, { createContext, useCallback, use, useEffect, useState } from 'react'

import type { Theme, ThemeContextType } from './types'


const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: undefined,
}

const ThemeContext = createContext(initialContext)

/**
 * Die Website ist nur hell gestaltet (bsv.css). Ein Dunkelmodus des Betriebssystems oder eine in der Verwaltung
 * gewählte dunkle Darstellung (gleicher Speicher-Schlüssel „payload-theme“) darf die Bausteine der Seiten nicht
 * umfärben – sonst werden Überschriften unsichtbar und Kästen schwarz. Deshalb immer „light“.
 */
const FEST: Theme = 'light'

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme] = useState<Theme | undefined>(FEST)
  const setTheme = useCallback((_themeToSet: Theme | null) => {
    document.documentElement.setAttribute('data-theme', FEST)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', FEST)
  }, [])

  return <ThemeContext value={{ setTheme, theme }}>{children}</ThemeContext>
}

export const useTheme = (): ThemeContextType => use(ThemeContext)
