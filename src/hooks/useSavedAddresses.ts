import { useState, useCallback } from "react";

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  coordinates?: { lat: number; lng: number };
}

const STORAGE_KEY = "saved_delivery_addresses";
const MAX_ADDRESSES = 5;

function load(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(addresses: SavedAddress[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  } catch {}
}

export function useSavedAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => load());

  const addAddress = useCallback((address: Omit<SavedAddress, "id">) => {
    const existing = load();
    // Avoid duplicates
    if (existing.some((a) => a.address === address.address)) return;
    const newAddr: SavedAddress = { ...address, id: `addr-${Date.now()}` };
    const updated = [newAddr, ...existing].slice(0, MAX_ADDRESSES);
    save(updated);
    setAddresses(updated);
  }, []);

  const removeAddress = useCallback((id: string) => {
    const updated = load().filter((a) => a.id !== id);
    save(updated);
    setAddresses(updated);
  }, []);

  return { addresses, addAddress, removeAddress };
}
